/* ================================================
   Assets Gallery Logic — Umang Creation
   Handles dynamic loading of assets, category filters, and rendering.
   ================================================ */

let allAssets = [];

document.addEventListener('DOMContentLoaded', () => {
  loadExploreAssets();
  initBackToTop();
});

function loadExploreAssets() {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  assetsRef.orderByChild('order').on('value', (snapshot) => {
    allAssets = [];

    snapshot.forEach(child => {
      allAssets.push({ id: child.key, ...child.val() });
    });

    if (allAssets.length === 0) {
      grid.innerHTML = `
        <div class="projects-empty" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p>No assets yet</p>
        </div>
      `;
      return;
    }

    // Newest first (reverse order)
    allAssets.reverse();

    renderExploreFilters();
    renderExploreGrid('All');
  }, (error) => {
    grid.innerHTML = `<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:3rem;">Error loading assets: ${error.message}</p>`;
  });
}

function renderExploreFilters() {
  const filtersContainer = document.getElementById('explore-filters');
  if (!filtersContainer) return;

  const categories = ['All'];
  allAssets.forEach(a => {
    const cat = a.category ? a.category.trim() : 'Uncategorized';
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

  const filtered = allAssets.filter(a => {
    if (filterCategory === 'All') return true;
    const cat = a.category ? a.category.trim() : 'Uncategorized';
    return cat.toLowerCase() === filterCategory.toLowerCase();
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:3rem;">No assets in this category</p>';
    return;
  }

  filtered.forEach((asset, idx) => {
    const card = createAssetCard(asset, idx);
    grid.appendChild(card);
    // Add visible class after a short delay so that transition runs
    setTimeout(() => card.classList.add('visible'), 50);
  });
}

function createAssetCard(asset, index) {
  const card = document.createElement('div');
  card.className = 'project-card reveal';
  card.style.transitionDelay = `${index * 0.08}s`;

  const thumbnail = asset.thumbnail || (asset.media && asset.media.length > 0 ? asset.media[0].url : '');
  const isPaid = asset.type === 'paid';

  card.innerHTML = `
    <div class="project-card-image-wrapper">
      ${thumbnail ? `<img src="${thumbnail}" alt="${asset.title}" class="project-card-image" loading="lazy" onerror="this.style.display='none'">` : '<div class="project-card-placeholder"></div>'}
      ${isPaid ? `
        <div class="card-lock-overlay">
          <div class="card-lock-icon-container" title="Premium Asset">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0110 0v4"></path>
            </svg>
          </div>
        </div>
      ` : ''}
    </div>
    <div class="project-card-body">
      <span class="project-card-category">${escapeHtml(asset.category || 'Uncategorized')} • ${isPaid ? 'Premium' : 'Free'}</span>
      <h3 class="project-card-title">${escapeHtml(asset.title || 'Untitled')}</h3>
    </div>
    <div class="project-card-footer">
      <a href="asset.html?id=${asset.id}" class="project-card-btn">
        <span>View Asset</span>
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" class="btn-arrow-icon">
          <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
        </svg>
      </a>
    </div>
  `;

  return card;
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
