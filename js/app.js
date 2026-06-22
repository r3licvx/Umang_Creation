/* ================================================
   Main Application Logic — Umang Creation
   Navigation, Projects, Viewer, Animations
   ================================================ */

let allProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initAge();
  loadProjects();
});

function initAge() {
  const ageEl = document.getElementById('about-age');
  if (!ageEl) return;
  const birthDate = new Date('2009-12-19');
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  ageEl.textContent = age;
}

/* ---------- NAVIGATION ---------- */
function initNav() {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.nav-mobile');
  const allLinks = document.querySelectorAll('.nav-link');

  // Scroll — add shadow to header
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveNav();
  });

  // Hamburger toggle (tablet)
  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
  }

  // Close mobile nav on link click
  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNav && mobileNav.classList.contains('open')) {
        toggle.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // Set initial active
  updateActiveNav();
}

function updateActiveNav() {
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let current = '';

  sections.forEach(section => {
    const top = section.offsetTop - 120;
    if (window.scrollY >= top) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}

/* ---------- SCROLL REVEAL ---------- */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ---------- LOAD PROJECTS FROM FIREBASE ---------- */
function loadProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  // Show skeleton
  container.innerHTML = `
    <div class="skeleton" style="height:280px;"></div>
    <div class="skeleton" style="height:280px;"></div>
  `;

  projectsRef.orderByChild('order').on('value', (snapshot) => {
    container.innerHTML = '';
    allProjects = [];

    snapshot.forEach(child => {
      allProjects.push({ id: child.key, ...child.val() });
    });

    if (allProjects.length === 0) {
      container.innerHTML = `
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

    // Render only top 2 on homepage
    const homepageProjects = allProjects.slice(0, 2);
    homepageProjects.forEach((project, idx) => {
      const card = createProjectCard(project, idx);
      container.appendChild(card);
    });

    // Re-observe for scroll reveal
    initScrollReveal();
  }, (error) => {
    container.innerHTML = `<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;">Error loading projects: ${error.message}</p>`;
  });
}

function createProjectCard(project, index) {
  const card = document.createElement('div');
  card.className = 'project-card reveal';
  card.style.transitionDelay = `${index * 0.1}s`;

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

/* ---------- DESCRIPTION TOGGLE ---------- */
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

/* ---------- UNUSED MODAL VIEWER CODE REMOVED ---------- */

/* ---------- UTILITIES ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- SMOOTH SCROLL ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
