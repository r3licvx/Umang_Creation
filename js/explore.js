/* ================================================
   Explore Gallery Logic — Umang Creation
   Handles dynamic loading, category filters, and rendering.
   ================================================ */

let allProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  loadExploreProjects();
  initBackToTop();
});

function loadExploreProjects() {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  projectsRef.orderByChild('order').on('value', (snapshot) => {
    allProjects = [];

    snapshot.forEach(child => {
      allProjects.push({ id: child.key, ...child.val() });
    });

    if (allProjects.length === 0) {
      grid.innerHTML = `
        <div class="projects-empty" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p>No projects yet</p>
        </div>
      `;
      return;
    }

    // Newest first (reverse order)
    allProjects.reverse();

    renderExploreFilters();
    renderExploreGrid('All');
  }, (error) => {
    grid.innerHTML = `<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:3rem;">Error loading projects: ${error.message}</p>`;
  });
}

function renderExploreFilters() {
  const filtersContainer = document.getElementById('explore-filters');
  if (!filtersContainer) return;

  const categories = ['All'];
  allProjects.forEach(p => {
    const cat = p.category ? p.category.trim() : 'Uncategorized';
    if (cat && !categories.includes(cat)) {
      categories.push(cat);
    }
  });

  filtersContainer.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-tab' + (cat === 'All' ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderExploreGrid(cat);
    };
    filtersContainer.appendChild(btn);
  });
}

function renderExploreGrid(filterCategory) {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const filtered = allProjects.filter(p => {
    if (filterCategory === 'All') return true;
    const cat = p.category ? p.category.trim() : 'Uncategorized';
    return cat.toLowerCase() === filterCategory.toLowerCase();
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:3rem;">No projects in this category</p>';
    return;
  }

  filtered.forEach((project, idx) => {
    const card = createProjectCard(project, idx);
    grid.appendChild(card);
    // Add visible class after a short delay so that transition runs
    setTimeout(() => card.classList.add('visible'), 50);
  });
}

function createProjectCard(project, index) {
  const card = document.createElement('div');
  card.className = 'project-card reveal';
  card.style.transitionDelay = `${index * 0.08}s`;

  const thumbnail = project.thumbnail || (project.media && project.media.length > 0 ? project.media[0].url : '');

  card.innerHTML = `
    <div class="project-card-image-wrapper">
      ${thumbnail ? `<img src="${thumbnail}" alt="${project.title}" class="project-card-image" loading="lazy" onerror="this.style.display='none'">` : '<div class="project-card-placeholder"></div>'}
    </div>
    <div class="project-card-body">
      <span class="project-card-category">${escapeHtml(project.category || 'Uncategorized')}</span>
      <h3 class="project-card-title">${escapeHtml(project.title || 'Untitled')}</h3>
    </div>
    <div class="project-card-footer">
      <a href="project.html?id=${project.id}" class="project-card-btn">
        <span>View Project</span>
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" class="btn-arrow-icon">
          <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
        </svg>
      </a>
    </div>
  `;

  return card;
}

function toggleDesc(btn) {
  const desc = btn.previousElementSibling;
  const isExpanded = desc.classList.contains('expanded');

  if (isExpanded) {
    desc.classList.remove('expanded');
    desc.classList.add('truncated');
    btn.innerHTML = `More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M6 9l6 6 6-6"/></svg>`;
  } else {
    desc.classList.remove('truncated');
    desc.classList.add('expanded');
    btn.innerHTML = `Less <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M6 15l6-6 6 6"/></svg>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function initBackToTop() {
  const backToTop = document.querySelector('.footer-top');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
