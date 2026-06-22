/* ================================================
   Admin Panel Logic — Umang Creation
   Auth, CRUD Projects, Media Management
   ================================================ */

const ADMIN_EMAIL = 'umang@internet.ru';
let currentTab = 'projects';
let editingProjectId = null;
let deleteProjectId = null;
let editingTeamMemberId = null;

// References
const teamRef = database.ref('team');

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initAdminForm();
});

/* ---------- AUTHENTICATION ---------- */
function initAuth() {
  // Auth state listener
  auth.onAuthStateChanged((user) => {
    if (user && user.email === ADMIN_EMAIL) {
      showDashboard();
      switchAdminTab('projects');
    } else if (user) {
      // Wrong email — sign out
      auth.signOut();
      showError('Access denied. Only admin can log in.');
    } else {
      showLogin();
    }
  });

  // Email/Password login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = loginForm.querySelector('.btn-login');

      if (!email || !password) {
        showError('Please enter email and password.');
        return;
      }

      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;

      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        showError(getAuthError(err));
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }
}

function showLogin() {
  const loginEl = document.querySelector('.admin-login');
  const dashEl = document.querySelector('.admin-dash');
  const headerEl = document.querySelector('.header');
  if (loginEl) loginEl.style.display = 'flex';
  if (dashEl) dashEl.classList.remove('show');
  if (headerEl) headerEl.style.display = 'none';
}

function showDashboard() {
  const loginEl = document.querySelector('.admin-login');
  const dashEl = document.querySelector('.admin-dash');
  const headerEl = document.querySelector('.header');
  if (loginEl) loginEl.style.display = 'none';
  if (dashEl) dashEl.classList.add('show');
  if (headerEl) headerEl.style.display = 'flex';
}

function showError(msg) {
  const el = document.querySelector('.admin-error');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
  }
}

function getAuthError(err) {
  const errors = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
    'auth/network-request-failed': 'Network error. Check connection.',
    'auth/invalid-credential': 'Invalid credentials. Check email & password.',
  };
  const code = err.code || err;
  const baseMsg = errors[code] || 'Sign-in failed. Please try again.';
  if (err.message) {
    return `${baseMsg} (${err.message})`;
  }
  return baseMsg;
}

/* ---------- TABS SWITCHING ---------- */
function switchAdminTab(tab) {
  currentTab = tab;
  // Update UI tabs
  const tabProjects = document.getElementById('tab-projects');
  const tabAssets = document.getElementById('tab-assets');
  const tabTeam = document.getElementById('tab-team');
  if (tabProjects) tabProjects.classList.toggle('active', tab === 'projects');
  if (tabAssets) tabAssets.classList.toggle('active', tab === 'assets');
  if (tabTeam) tabTeam.classList.toggle('active', tab === 'team');

  // Update dynamic texts
  const sectionTitle = document.getElementById('admin-section-title');
  if (sectionTitle) {
    if (tab === 'projects') sectionTitle.textContent = 'Projects';
    else if (tab === 'assets') sectionTitle.textContent = 'Assets';
    else sectionTitle.textContent = 'Team';
  }
  const addBtn = document.getElementById('admin-add-btn');
  if (addBtn) {
    let addText = 'Project';
    if (tab === 'assets') addText = 'Asset';
    else if (tab === 'team') addText = 'Team Member';
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add ${addText}
    `;
    
    // Bind click action
    addBtn.onclick = () => {
      if (tab === 'team') {
        openTeamForm();
      } else {
        openAddForm();
      }
    };
  }

  // Reload lists
  assetsRef.off();
  projectsRef.off();
  teamRef.off();
  
  if (tab === 'projects') {
    loadAdminProjects();
  } else if (tab === 'assets') {
    loadAdminAssets();
  } else {
    loadAdminTeam();
  }
}

/* ---------- ADMIN PROJECTS LIST ---------- */
function loadAdminProjects() {
  const container = document.getElementById('admin-projects-list');
  if (!container) return;

  projectsRef.orderByChild('order').on('value', (snapshot) => {
    if (currentTab !== 'projects') return;
    container.innerHTML = '';
    const projects = [];

    snapshot.forEach(child => {
      projects.push({ id: child.key, ...child.val() });
    });

    if (projects.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No projects yet. Add your first project!</p>';
      return;
    }

    projects.forEach(project => {
      const item = document.createElement('div');
      item.className = 'admin-project-item';

      const thumb = project.media && project.media.length > 0 ? project.media[0].url : '';

      item.innerHTML = `
        ${thumb ? `<img src="${thumb}" alt="" class="admin-project-thumb" onerror="this.style.background='var(--bg-card)'">` : '<div class="admin-project-thumb"></div>'}
        <div class="admin-project-info">
          <h4>${escapeHtml(project.title || 'Untitled')}</h4>
          <p>${escapeHtml(project.category || 'Uncategorized')} • ${project.media ? project.media.length : 0} media items</p>
        </div>
        <div class="admin-project-actions">
          <button class="admin-btn-edit" title="Edit" onclick="editProject('${project.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="admin-btn-delete" title="Delete" onclick="confirmDelete('${project.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      `;

      container.appendChild(item);
    });
  });
}

/* ---------- ADMIN ASSETS LIST ---------- */
function loadAdminAssets() {
  const container = document.getElementById('admin-projects-list');
  if (!container) return;

  assetsRef.orderByChild('order').on('value', (snapshot) => {
    if (currentTab !== 'assets') return;
    container.innerHTML = '';
    const assets = [];

    snapshot.forEach(child => {
      assets.push({ id: child.key, ...child.val() });
    });

    if (assets.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No assets yet. Add your first asset!</p>';
      return;
    }

    assets.forEach(asset => {
      const item = document.createElement('div');
      item.className = 'admin-project-item';

      const thumb = asset.media && asset.media.length > 0 ? asset.media[0].url : '';

      item.innerHTML = `
        ${thumb ? `<img src="${thumb}" alt="" class="admin-project-thumb" onerror="this.style.background='var(--bg-card)'">` : '<div class="admin-project-thumb"></div>'}
        <div class="admin-project-info">
          <h4>${escapeHtml(asset.title || 'Untitled')}</h4>
          <p>${escapeHtml(asset.category || 'Uncategorized')} • ${escapeHtml(asset.type || 'free')} • ${asset.media ? asset.media.length : 0} media items</p>
        </div>
        <div class="admin-project-actions">
          <button class="admin-btn-edit" title="Edit" onclick="editProject('${asset.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="admin-btn-delete" title="Delete" onclick="confirmDelete('${asset.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      `;

      container.appendChild(item);
    });
  });
}

/* ---------- ADD / EDIT FORM MANAGEMENT ---------- */
function initAdminForm() {
  // Add media item button
  const addMediaBtn = document.getElementById('add-media-btn');
  if (addMediaBtn) {
    addMediaBtn.addEventListener('click', () => addMediaField());
  }

  // Add collaborator button
  const addCollabBtn = document.getElementById('add-collaborator-btn');
  if (addCollabBtn) {
    addCollabBtn.addEventListener('click', () => addCollaboratorField());
  }

  // Form submit
  const form = document.getElementById('project-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProject();
    });
  }

  // Team form submit
  const teamForm = document.getElementById('team-form');
  if (teamForm) {
    teamForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveTeamMember();
    });
  }

  // Category select change listener
  const catSelect = document.getElementById('project-category');
  const catCustom = document.getElementById('project-category-custom');
  if (catSelect && catCustom) {
    catCustom.style.display = 'none';
    catSelect.addEventListener('change', () => {
      catCustom.style.display = catSelect.value === 'custom' ? 'block' : 'none';
    });
  }

  // Asset type change listener
  const assetTypeSelect = document.getElementById('asset-type');
  const assetDownloadGroup = document.getElementById('asset-download-group');
  if (assetTypeSelect && assetDownloadGroup) {
    assetTypeSelect.addEventListener('change', () => {
      assetDownloadGroup.style.display = assetTypeSelect.value === 'free' ? 'block' : 'none';
    });
  }
}

function openAddForm() {
  editingProjectId = null;
  const overlay = document.querySelector('.admin-form-overlay');
  const formTitle = overlay.querySelector('h3');

  formTitle.textContent = currentTab === 'projects' ? 'New Project' : 'New Asset';
  document.getElementById('project-title').value = '';
  document.getElementById('project-description').value = '';
  document.getElementById('project-thumbnail-url').value = '';

  // Asset fields toggle
  const assetTypeGroup = document.getElementById('asset-type-group');
  const assetDownloadGroup = document.getElementById('asset-download-group');
  const assetType = document.getElementById('asset-type');
  const assetDownloadUrl = document.getElementById('asset-download-url');

  if (currentTab === 'assets') {
    if (assetTypeGroup) assetTypeGroup.style.display = 'block';
    if (assetDownloadGroup) assetDownloadGroup.style.display = 'block';
    if (assetType) assetType.value = 'free';
    if (assetDownloadUrl) assetDownloadUrl.value = '';
  } else {
    if (assetTypeGroup) assetTypeGroup.style.display = 'none';
    if (assetDownloadGroup) assetDownloadGroup.style.display = 'none';
  }

  // Reset category
  const catSelect = document.getElementById('project-category');
  const catCustom = document.getElementById('project-category-custom');
  if (catSelect) catSelect.value = '';
  if (catCustom) {
    catCustom.value = '';
    catCustom.style.display = 'none';
  }

  // Reset media list with one empty field
  const mediaList = document.getElementById('media-list');
  mediaList.innerHTML = '';
  addMediaField();

  // Reset collaborators list with default Umang Sattawan
  const collabList = document.getElementById('collaborators-list');
  if (collabList) {
    collabList.innerHTML = '';
    addCollaboratorField('Umang Sattawan', 'https://imgh.in/host/zoh032', '');
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function editProject(id) {
  editingProjectId = id;
  const ref = currentTab === 'projects' ? projectsRef : assetsRef;

  ref.child(id).once('value', (snapshot) => {
    const project = snapshot.val();
    if (!project) return;

    const overlay = document.querySelector('.admin-form-overlay');
    const formTitle = overlay.querySelector('h3');

    formTitle.textContent = currentTab === 'projects' ? 'Edit Project' : 'Edit Asset';
    document.getElementById('project-title').value = project.title || '';
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-thumbnail-url').value = project.thumbnail || '';

    // Populate collaborators
    const collabList = document.getElementById('collaborators-list');
    if (collabList) {
      collabList.innerHTML = '';
      if (project.collaborators && project.collaborators.length > 0) {
        project.collaborators.forEach(c => {
          addCollaboratorField(c.name, c.photo, c.url);
        });
      } else if (project.designerName) {
        addCollaboratorField(project.designerName, project.designerPhoto, '');
      } else {
        addCollaboratorField();
      }
    }

    // Asset fields toggle
    const assetTypeGroup = document.getElementById('asset-type-group');
    const assetDownloadGroup = document.getElementById('asset-download-group');
    const assetType = document.getElementById('asset-type');
    const assetDownloadUrl = document.getElementById('asset-download-url');

    if (currentTab === 'assets') {
      if (assetTypeGroup) assetTypeGroup.style.display = 'block';
      if (assetType) assetType.value = project.type || 'free';
      if (assetDownloadGroup) {
        assetDownloadGroup.style.display = (project.type || 'free') === 'free' ? 'block' : 'none';
      }
      if (assetDownloadUrl) assetDownloadUrl.value = project.downloadUrl || '';
    } else {
      if (assetTypeGroup) assetTypeGroup.style.display = 'none';
      if (assetDownloadGroup) assetDownloadGroup.style.display = 'none';
    }

    // Populate category
    const catSelect = document.getElementById('project-category');
    const catCustom = document.getElementById('project-category-custom');
    if (catSelect) {
      const cat = project.category || '';
      const options = Array.from(catSelect.options).map(opt => opt.value);
      
      if (cat === '') {
        catSelect.value = '';
        if (catCustom) {
          catCustom.value = '';
          catCustom.style.display = 'none';
        }
      } else if (options.includes(cat) && cat !== 'custom') {
        catSelect.value = cat;
        if (catCustom) {
          catCustom.value = '';
          catCustom.style.display = 'none';
        }
      } else {
        catSelect.value = 'custom';
        if (catCustom) {
          catCustom.value = cat;
          catCustom.style.display = 'block';
        }
      }
    }

    // Populate media
    const mediaList = document.getElementById('media-list');
    mediaList.innerHTML = '';

    if (project.media && project.media.length > 0) {
      project.media.forEach(item => {
        addMediaField(item.url, item.type);
      });
    } else {
      addMediaField();
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function closeForm() {
  const overlay = document.querySelector('.admin-form-overlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  editingProjectId = null;
}

function addMediaField(url = '', type = 'image') {
  const mediaList = document.getElementById('media-list');
  const item = document.createElement('div');
  item.className = 'media-item';
  item.innerHTML = `
    <input type="url" class="form-input media-url" placeholder="https://..." value="${escapeHtml(url)}">
    <select class="media-type-select">
      <option value="image" ${type === 'image' ? 'selected' : ''}>Image</option>
      <option value="video" ${type === 'video' ? 'selected' : ''}>Video</option>
    </select>
    <button type="button" class="media-remove-btn" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  mediaList.appendChild(item);
}

async function saveProject() {
  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-description').value.trim();
  const mediaItems = document.querySelectorAll('#media-list .media-item');

  if (!title) {
    showToast('Please enter a title', 'error');
    return;
  }

  // Read category
  const catSelect = document.getElementById('project-category');
  const catCustom = document.getElementById('project-category-custom');
  let category = '';
  if (catSelect) {
    if (catSelect.value === 'custom') {
      category = catCustom ? catCustom.value.trim() : '';
    } else {
      category = catSelect.value;
    }
  }
  if (!category) {
    category = 'Uncategorized';
  }

  // Collect media
  const media = [];
  mediaItems.forEach(item => {
    const url = item.querySelector('.media-url').value.trim();
    const type = item.querySelector('.media-type-select').value;
    if (url) {
      media.push({ url, type });
    }
  });

  // Collect collaborators
  const collaborators = [];
  const collabItems = document.querySelectorAll('#collaborators-list .media-item');
  collabItems.forEach(item => {
    const cName = item.querySelector('.collab-name').value.trim();
    const cPhoto = item.querySelector('.collab-photo').value.trim();
    const cUrl = item.querySelector('.collab-url').value.trim();
    if (cName) {
      collaborators.push({ name: cName, photo: cPhoto, url: cUrl });
    }
  });

  const customThumbnail = document.getElementById('project-thumbnail-url').value.trim();
  const thumbnail = customThumbnail || (media.length > 0 ? media[0].url : '');

  const data = {
    title,
    description,
    category,
    media,
    thumbnail,
    collaborators,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  if (collaborators.length > 0) {
    data.designerName = collaborators[0].name;
    data.designerPhoto = collaborators[0].photo;
  } else {
    data.designerName = '';
    data.designerPhoto = '';
  }

  if (currentTab === 'assets') {
    data.type = document.getElementById('asset-type').value;
    data.downloadUrl = data.type === 'free' ? document.getElementById('asset-download-url').value.trim() : '';
  }

  const ref = currentTab === 'projects' ? projectsRef : assetsRef;
  const saveBtn = document.querySelector('.btn-save');
  saveBtn.innerHTML = '<span class="spinner"></span>';
  saveBtn.disabled = true;

  try {
    if (editingProjectId) {
      await ref.child(editingProjectId).update(data);
      showToast(currentTab === 'projects' ? 'Project updated!' : 'Asset updated!', 'success');
    } else {
      data.createdAt = firebase.database.ServerValue.TIMESTAMP;
      data.order = Date.now();
      await ref.push(data);
      showToast(currentTab === 'projects' ? 'Project added!' : 'Asset added!', 'success');
    }
    closeForm();
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  }

  saveBtn.textContent = 'Save';
  saveBtn.disabled = false;
}

/* ---------- DELETE OPERATIONS ---------- */
function confirmDelete(id) {
  deleteProjectId = id;
  const overlay = document.querySelector('.confirm-overlay');
  const cardTitle = overlay.querySelector('h4');
  if (cardTitle) {
    cardTitle.textContent = currentTab === 'projects' ? 'Delete Project?' : 'Delete Asset?';
  }
  overlay.classList.add('open');
}

function cancelDelete() {
  deleteProjectId = null;
  const overlay = document.querySelector('.confirm-overlay');
  overlay.classList.remove('open');
}

async function executeDelete() {
  if (!deleteProjectId) return;
  const ref = currentTab === 'projects' ? projectsRef : (currentTab === 'assets' ? assetsRef : teamRef);

  try {
    await ref.child(deleteProjectId).remove();
    let msg = 'Project deleted';
    if (currentTab === 'assets') msg = 'Asset deleted';
    else if (currentTab === 'team') msg = 'Team member deleted';
    showToast(msg, 'success');
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }

  cancelDelete();
}

/* ---------- TOAST ---------- */
function showToast(msg, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.className = 'toast ' + type;

  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  });
}

/* ---------- UTILITIES ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ---------- PHASE 3 TEAM & COLLABORATORS DYNAMIC FUNCTIONS ---------- */

function addCollaboratorField(name = '', photo = '', url = '') {
  const list = document.getElementById('collaborators-list');
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'media-item';
  item.innerHTML = `
    <input type="text" class="form-input collab-name" placeholder="Collaborator Name" value="${escapeHtml(name)}" style="flex:1;" required>
    <input type="url" class="form-input collab-photo" placeholder="Photo URL" value="${escapeHtml(photo)}" style="flex:1;">
    <input type="url" class="form-input collab-url" placeholder="Contact/Portfolio URL" value="${escapeHtml(url)}" style="flex:1;">
    <button type="button" class="media-remove-btn" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  list.appendChild(item);
}

function openTeamForm() {
  editingTeamMemberId = null;
  const overlay = document.querySelector('.team-form-overlay');
  if (!overlay) return;
  const formTitle = overlay.querySelector('h3');
  formTitle.textContent = 'New Team Member';
  
  document.getElementById('team-name').value = '';
  document.getElementById('team-photo').value = '';
  document.getElementById('team-dob').value = '';
  document.getElementById('team-description').value = '';

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTeamForm() {
  const overlay = document.querySelector('.team-form-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  editingTeamMemberId = null;
}

function editTeamMember(id) {
  editingTeamMemberId = id;
  teamRef.child(id).once('value', (snapshot) => {
    const member = snapshot.val();
    if (!member) return;

    const overlay = document.querySelector('.team-form-overlay');
    if (!overlay) return;
    const formTitle = overlay.querySelector('h3');
    formTitle.textContent = 'Edit Team Member';

    document.getElementById('team-name').value = member.name || '';
    document.getElementById('team-photo').value = member.photo || '';
    document.getElementById('team-dob').value = member.dob || '';
    document.getElementById('team-description').value = member.description || '';

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

async function saveTeamMember() {
  const name = document.getElementById('team-name').value.trim();
  const photo = document.getElementById('team-photo').value.trim();
  const dob = document.getElementById('team-dob').value;
  const description = document.getElementById('team-description').value.trim();

  if (!name || !photo || !dob || !description) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const data = {
    name,
    photo,
    dob,
    description,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  const saveBtn = document.getElementById('team-save-btn');
  saveBtn.innerHTML = '<span class="spinner"></span>';
  saveBtn.disabled = true;

  try {
    if (editingTeamMemberId) {
      await teamRef.child(editingTeamMemberId).update(data);
      showToast('Team member updated!', 'success');
    } else {
      data.createdAt = firebase.database.ServerValue.TIMESTAMP;
      await teamRef.push(data);
      showToast('Team member added!', 'success');
    }
    closeTeamForm();
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  }

  saveBtn.textContent = 'Save';
  saveBtn.disabled = false;
}

function loadAdminTeam() {
  const container = document.getElementById('admin-projects-list');
  if (!container) return;

  teamRef.on('value', (snapshot) => {
    if (currentTab !== 'team') return;
    container.innerHTML = '';
    const team = [];

    snapshot.forEach(child => {
      team.push({ id: child.key, ...child.val() });
    });

    if (team.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No team members yet. Add your first team member!</p>';
      return;
    }

    team.forEach(member => {
      const item = document.createElement('div');
      item.className = 'admin-project-item';

      const photo = member.photo || '';

      item.innerHTML = `
        ${photo ? `<img src="${photo}" alt="" class="admin-project-thumb" onerror="this.style.background='var(--bg-card)'">` : '<div class="admin-project-thumb"></div>'}
        <div class="admin-project-info">
          <h4>${escapeHtml(member.name || 'Untitled')}</h4>
          <p>${escapeHtml(member.description || '')} • DOB: ${member.dob || 'N/A'}</p>
        </div>
        <div class="admin-project-actions">
          <button class="admin-btn-edit" title="Edit" onclick="editTeamMember('${member.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="admin-btn-delete" title="Delete" onclick="confirmDelete('${member.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      `;

      container.appendChild(item);
    });
  });
}
