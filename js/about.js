/* ================================================
   About Page Logic — Umang Creation
   Handles fetching team members from Firebase, calculating
   dynamic ages based on DOB, and displaying detailed modals.
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAge();
  loadTeam();
  initModal();
  initBackToTop();
});

// References
const teamRef = firebase.database().ref('team');

function initAge() {
  const ageEl = document.getElementById('about-age');
  if (!ageEl) return;
  const age = calculateAge('2009-12-19');
  ageEl.textContent = age;
}

function calculateAge(dobString) {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function loadTeam() {
  const container = document.getElementById('team-container');
  const grid = document.getElementById('team-members-grid');
  if (!container || !grid) return;

  teamRef.once('value', (snapshot) => {
    const teamMembers = [];
    snapshot.forEach(child => {
      teamMembers.push({ id: child.key, ...child.val() });
    });

    // If no team members exist, keep section hidden
    if (teamMembers.length === 0) {
      container.style.display = 'none';
      return;
    }

    grid.innerHTML = '';
    teamMembers.forEach(member => {
      const card = document.createElement('div');
      card.className = 'team-card';
      const age = calculateAge(member.dob);
      
      card.innerHTML = `
        <img src="${member.photo || 'https://imgh.in/host/onzoec'}" alt="${escapeHtml(member.name)}" class="team-card-avatar" onerror="this.src='https://imgh.in/host/onzoec'">
        <h3 class="team-card-name">${escapeHtml(member.name || 'Untitled')}</h3>
        <span class="team-card-age">${age} Years Old</span>
        <p class="team-card-desc">${escapeHtml(member.description || '')}</p>
      `;

      card.addEventListener('click', () => {
        openMemberModal(member, age);
      });

      grid.appendChild(card);
    });

    container.style.display = 'block';
  }, (error) => {
    console.error("Error loading team members: ", error);
  });
}

function initModal() {
  const modal = document.getElementById('team-modal');
  const closeBtn = document.getElementById('team-modal-close');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
}

function openMemberModal(member, age) {
  const modal = document.getElementById('team-modal');
  const avatar = document.getElementById('modal-avatar');
  const name = document.getElementById('modal-name');
  const ageEl = document.getElementById('modal-age');
  const bio = document.getElementById('modal-bio');

  if (!modal || !avatar || !name || !ageEl || !bio) return;

  avatar.src = member.photo || 'https://imgh.in/host/onzoec';
  avatar.onerror = () => { avatar.src = 'https://imgh.in/host/onzoec'; };
  name.textContent = member.name || '';
  ageEl.textContent = `${age} Years Old`;
  bio.textContent = member.description || '';

  modal.classList.add('open');
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
