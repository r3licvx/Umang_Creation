/* ================================================
   Asset Details Page Logic — Umang Creation
   Handles fetching asset details from Firebase and 
   rendering media carousel, designer and dynamic action CTAs.
   ================================================ */

let currentSlide = 0;
let assetMedia = [];

document.addEventListener('DOMContentLoaded', () => {
  const assetId = new URLSearchParams(window.location.search).get('id');
  if (!assetId) {
    showError();
    return;
  }
  loadAssetDetails(assetId);
  initCarouselControls();
  initSwipeSupport();
  initKeyboardSupport();
  initBackNavigation();
  initBackToTop();
});

function initBackNavigation() {
  const backBtn = document.querySelector('.btn-back');
  if (backBtn) {
    const referrer = document.referrer;
    if (referrer && (referrer.includes('assets.html') || referrer.includes('index.html'))) {
      backBtn.href = referrer;
    } else {
      backBtn.href = 'assets.html';
    }

    backBtn.addEventListener('click', (e) => {
      if (referrer && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }
}

function loadAssetDetails(assetId) {
  assetsRef.child(assetId).once('value', (snapshot) => {
    const asset = snapshot.val();
    if (!asset) {
      showError();
      return;
    }

    // Hide skeleton and show grid
    document.getElementById('project-loading-skeleton').style.display = 'none';
    document.getElementById('project-content-grid').style.display = 'grid';

    // Populate data
    document.getElementById('project-title').textContent = asset.title || 'Untitled';
    document.getElementById('project-category').textContent = (asset.category || 'Uncategorized') + (asset.type === 'paid' ? ' • Premium' : ' • Free');
    document.getElementById('project-desc').textContent = asset.description || '';

    // Designer Profile
    const designerSection = document.getElementById('designer-profile-section');
    const designerNameEl = document.getElementById('designer-name');
    const designerPhotoEl = document.getElementById('designer-photo');
    
    if (asset.designerName) {
      designerNameEl.textContent = asset.designerName;
      designerPhotoEl.src = asset.designerPhoto || 'https://imgh.in/host/onzoec';
      designerPhotoEl.onerror = () => {
        designerPhotoEl.src = 'https://imgh.in/host/onzoec';
      };
      designerSection.style.display = 'flex';
    } else {
      designerSection.style.display = 'none';
    }

    // Dynamic CTA Buttons Area
    const ctaSection = document.getElementById('asset-cta-section');
    if (ctaSection) {
      if (asset.type === 'paid') {
        ctaSection.innerHTML = `
          <h3>Place Your Order</h3>
          <div class="order-selector-group">
            <a href="https://ig.me/m/umangcreation.ig" target="_blank" rel="noopener" id="order-now-btn" class="order-btn-main">
              Order Now
            </a>
            <div class="custom-select" id="order-channel-select">
              <div class="custom-select-trigger">
                <span class="selected-option-text">Instagram</span>
                <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div class="custom-options">
                <div class="custom-option selected" data-value="instagram" data-url="https://ig.me/m/umangcreation.ig">
                  <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  Instagram
                </div>
                <div class="custom-option" data-value="telegram" data-url="https://t.me/umangcreation_tg">
                  <svg class="option-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </div>
                <div class="custom-option" data-value="email" data-url="mailto:umang@internet.ru">
                  <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </div>
              </div>
            </div>
          </div>
        `;
        initCustomSelector();
      } else {
        ctaSection.innerHTML = `
          <h3>Download File</h3>
          <a href="${asset.downloadUrl || '#'}" target="_blank" class="btn btn-primary" style="display:inline-flex; align-items:center; justify-content:center; width:100%; padding:14px 28px; font-size:1rem; border-radius:var(--radius-sm);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px; margin-right:8px;">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download Asset
          </a>
        `;
      }
    }

    // Load Carousel Media
    assetMedia = asset.media || [];
    renderCarousel();
  }, (error) => {
    console.error("Error loading asset details: ", error);
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

  if (assetMedia.length === 0) {
    slidesContainer.innerHTML = '<div class="carousel-slide"><div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--text-muted);background:var(--bg-secondary);border-radius:var(--radius-md);">No media available</div></div>';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }

  assetMedia.forEach((item, i) => {
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
      slide.innerHTML = `<img src="${item.url}" alt="Asset media ${i + 1}" loading="lazy" onerror="this.alt='Failed to load'">`;
    }

    slidesContainer.appendChild(slide);

    // Dot
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
  });

  const showArrows = assetMedia.length > 1;
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
  if (currentSlide < assetMedia.length - 1) {
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
