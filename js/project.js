/* ================================================
   Project Details Page Logic — Umang Creation
   Handles fetching project detail from Firebase and 
   rendering media carousel, designer and contact CTAs.
   ================================================ */

let currentSlide = 0;
let projectMedia = [];

document.addEventListener('DOMContentLoaded', () => {
  const projectId = new URLSearchParams(window.location.search).get('id');
  if (!projectId) {
    showError();
    return;
  }
  loadProjectDetails(projectId);
  initCarouselControls();
  initSwipeSupport();
  initKeyboardSupport();
  initBackNavigation();
  initBackToTop();
  initCustomSelector();
});

function initBackNavigation() {
  const backBtn = document.querySelector('.btn-back');
  if (backBtn) {
    const referrer = document.referrer;
    if (referrer && (referrer.includes('explore.html') || referrer.includes('index.html'))) {
      backBtn.href = referrer;
    } else {
      backBtn.href = 'index.html';
    }

    backBtn.addEventListener('click', (e) => {
      if (referrer && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }
}

function loadProjectDetails(projectId) {
  projectsRef.child(projectId).once('value', (snapshot) => {
    const project = snapshot.val();
    if (!project) {
      showError();
      return;
    }

    // Hide skeleton and show grid
    document.getElementById('project-loading-skeleton').style.display = 'none';
    document.getElementById('project-content-grid').style.display = 'grid';

    // Populate data
    document.getElementById('project-title').textContent = project.title || 'Untitled';
    document.getElementById('project-category').textContent = project.category || 'Uncategorized';
    document.getElementById('project-desc').textContent = project.description || '';

    // Designer / Collaborators Profile list
    const designerSection = document.getElementById('designer-profile-section');
    const designersListEl = document.getElementById('project-designers-list');
    
    let designers = [];
    if (project.collaborators && Array.isArray(project.collaborators)) {
      designers = project.collaborators;
    } else if (project.collaborators && typeof project.collaborators === 'object') {
      designers = Object.values(project.collaborators);
    } else if (project.designerName) {
      designers = [{
        name: project.designerName,
        photo: project.designerPhoto || 'https://imgh.in/host/onzoec',
        url: ''
      }];
    }

    designers = designers.filter(d => d && d.name);

    if (designers.length > 0) {
      designersListEl.innerHTML = '';
      designers.forEach(d => {
        const hasLink = d.url && d.url.trim() !== '';
        const item = document.createElement('div');
        item.className = 'designer-profile-item' + (hasLink ? ' clickable' : '');
        if (hasLink) {
          item.onclick = () => window.open(d.url, '_blank', 'noopener,noreferrer');
        }
        
        const photoUrl = d.photo || 'https://imgh.in/host/onzoec';
        item.innerHTML = `
          <img src="${photoUrl}" alt="${escapeHtml(d.name)}" class="designer-avatar-small" onerror="this.src='https://imgh.in/host/onzoec'">
          <span class="designer-name-small">${escapeHtml(d.name)}</span>
        `;
        designersListEl.appendChild(item);
      });
      designerSection.style.display = 'block';
    } else {
      designerSection.style.display = 'none';
    }

    // Load Carousel Media
    projectMedia = project.media || [];
    renderCarousel();
  }, (error) => {
    console.error("Error loading project: ", error);
    showError();
  });
}

function showError() {
  document.getElementById('project-loading-skeleton').style.display = 'none';
  document.getElementById('project-content-grid').style.display = 'none';
  document.getElementById('project-error-card').style.display = 'block';
}

function renderCarousel() {
  const slidesContainer = document.getElementById('project-carousel-slides');
  const dotsContainer = document.getElementById('project-carousel-dots');
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');

  slidesContainer.innerHTML = '';
  dotsContainer.innerHTML = '';

  if (projectMedia.length === 0) {
    slidesContainer.innerHTML = '<div class="carousel-slide"><div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--text-muted);background:var(--bg-secondary);border-radius:var(--radius-md);">No media available</div></div>';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }

  projectMedia.forEach((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    if (item.type === 'video') {
      slide.innerHTML = `
        <video src="${item.url}" preload="metadata" playsinline muted></video>
        <div class="video-play-overlay" onclick="playVideoSlide(${i})">
          <div class="video-play-overlay-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="video-controls">
          <button class="video-play-btn" onclick="toggleVideoPlay(event, ${i})">
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
          </button>
          <div class="video-timeline" onclick="seekVideo(event, ${i})">
            <div class="video-timeline-fill"></div>
          </div>
          <button class="video-mute-btn" onclick="toggleVideoMute(event, ${i})">
            <svg class="muted-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
            <svg class="unmuted-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          </button>
        </div>
      `;
    } else {
      slide.innerHTML = `<img src="${item.url}" alt="Project media ${i + 1}" loading="lazy" onerror="this.alt='Failed to load'">`;
    }

    slidesContainer.appendChild(slide);

    // Dot
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
  });

  // Show or hide navigation arrows
  const showArrows = projectMedia.length > 1;
  prevBtn.style.display = showArrows ? 'flex' : 'none';
  nextBtn.style.display = showArrows ? 'flex' : 'none';

  currentSlide = 0;
  updateCarousel();
}

function initCarouselControls() {
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
  pauseAllVideos();
}

function nextSlide() {
  if (currentSlide < projectMedia.length - 1) {
    goToSlide(currentSlide + 1);
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    goToSlide(currentSlide - 1);
  }
}

function updateCarousel() {
  const slides = document.getElementById('project-carousel-slides');
  const dots = document.querySelectorAll('.carousel-dot');
  if (!slides) return;

  slides.style.transform = `translateX(-${currentSlide * 100}%)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function pauseAllVideos() {
  document.querySelectorAll('#project-carousel-slides video').forEach(v => v.pause());
}

/* ---------- VIDEO CONTROLS ---------- */
function playVideoSlide(index) {
  const slides = document.querySelectorAll('#project-carousel-slides .carousel-slide');
  const video = slides[index].querySelector('video');
  const playOverlay = slides[index].querySelector('.video-play-overlay');

  if (video) {
    video.play();
    video.muted = false;
    playOverlay.classList.add('hidden');
    updateVideoIcons(slides[index], true, false);
    trackVideoProgress(video, slides[index]);
  }
}

function toggleVideoPlay(event, index) {
  event.stopPropagation();
  const slides = document.querySelectorAll('#project-carousel-slides .carousel-slide');
  const video = slides[index].querySelector('video');
  const playOverlay = slides[index].querySelector('.video-play-overlay');

  if (!video) return;

  if (video.paused) {
    video.play();
    if (playOverlay) playOverlay.classList.add('hidden');
    updateVideoIcons(slides[index], true, video.muted);
  } else {
    video.pause();
    updateVideoIcons(slides[index], false, video.muted);
  }
}

function toggleVideoMute(event, index) {
  event.stopPropagation();
  const slides = document.querySelectorAll('#project-carousel-slides .carousel-slide');
  const video = slides[index].querySelector('video');

  if (!video) return;
  video.muted = !video.muted;
  updateVideoIcons(slides[index], !video.paused, video.muted);
}

function seekVideo(event, index) {
  event.stopPropagation();
  const slides = document.querySelectorAll('#project-carousel-slides .carousel-slide');
  const video = slides[index].querySelector('video');
  const timeline = event.currentTarget;

  if (!video || !video.duration) return;
  const rect = timeline.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  video.currentTime = percent * video.duration;
}

function updateVideoIcons(slide, playing, muted) {
  const playIcon = slide.querySelector('.play-icon');
  const pauseIcon = slide.querySelector('.pause-icon');
  const mutedIcon = slide.querySelector('.muted-icon');
  const unmutedIcon = slide.querySelector('.unmuted-icon');

  if (playIcon && pauseIcon) {
    playIcon.style.display = playing ? 'none' : 'block';
    pauseIcon.style.display = playing ? 'block' : 'none';
  }

  if (mutedIcon && unmutedIcon) {
    mutedIcon.style.display = muted ? 'block' : 'none';
    unmutedIcon.style.display = muted ? 'none' : 'block';
  }
}

function trackVideoProgress(video, slide) {
  const fill = slide.querySelector('.video-timeline-fill');
  if (!fill) return;

  const update = () => {
    if (video.duration) {
      fill.style.width = (video.currentTime / video.duration * 100) + '%';
    }
    if (!video.paused) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);

  video.addEventListener('ended', () => {
    const playOverlay = slide.querySelector('.video-play-overlay');
    if (playOverlay) playOverlay.classList.remove('hidden');
    updateVideoIcons(slide, false, video.muted);
  });
}

/* ---------- SWIPE SUPPORT ---------- */
let touchStartX = 0;
let touchEndX = 0;

function initSwipeSupport() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 60) {
      diff > 0 ? nextSlide() : prevSlide();
    }
  }, { passive: true });
}

/* ---------- KEYBOARD SUPPORT ---------- */
function initKeyboardSupport() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });
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

function initCustomSelector() {
  const select = document.getElementById('order-channel-select');
  if (!select) return;
  const trigger = select.querySelector('.custom-select-trigger');
  const options = select.querySelectorAll('.custom-option');
  const mainBtn = document.getElementById('order-now-btn');
  const selectedText = select.querySelector('.selected-option-text');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    select.classList.toggle('open');
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const val = opt.getAttribute('data-value');
      const url = opt.getAttribute('data-url');
      selectedText.textContent = opt.textContent.trim();
      mainBtn.href = url;
      select.classList.remove('open');
    });
  });

  document.addEventListener('click', () => {
    select.classList.remove('open');
  });
}
