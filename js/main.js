// Nav scroll shadow
window.addEventListener(
  'scroll',
  () => {
    document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 40);
  },
  { passive: true }
);

// Burger / drawer
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');

if (burger && drawer) {
  burger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    drawer.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  drawer.querySelectorAll('a').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

// Scroll reveal
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), index * 70);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Featured slideshow — auto-cycling carousel
(() => {
  const slideshow = document.querySelector('.featured-slideshow');
  if (!slideshow) return;

  const slides = slideshow.querySelectorAll('.featured-slide');
  const dots = slideshow.querySelectorAll('.featured-dot');
  const prev = slideshow.querySelector('.featured-prev');
  const next = slideshow.querySelector('.featured-next');
  const total = slides.length;
  if (total < 2) return; // nothing to cycle

  const INTERVAL_MS = 5000;
  let currentIndex = 0;
  let timer = null;

  function go(nextIndex) {
    slides[currentIndex].classList.remove('active');
    dots[currentIndex]?.classList.remove('active');

    currentIndex = ((nextIndex % total) + total) % total;

    slides[currentIndex].classList.add('active');
    dots[currentIndex]?.classList.add('active');
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    timer = setInterval(() => go(currentIndex + 1), INTERVAL_MS);
  }

  function reset() {
    start();
  }

  prev?.addEventListener('click', () => {
    go(currentIndex - 1);
    reset();
  });

  next?.addEventListener('click', () => {
    go(currentIndex + 1);
    reset();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number.parseInt(dot.dataset.index ?? '', 10);
      if (!Number.isNaN(idx)) {
        go(idx);
        reset();
      }
    });
  });

  // Pause on hover (desktop), resume on leave
  slideshow.addEventListener('mouseenter', stop);
  slideshow.addEventListener('mouseleave', start);

  // Pause when tab is hidden so we don't spin in the background
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // Respect reduced motion: no auto-cycle, manual controls only
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches) start();
})();

// Categorized gallery — tab switching
(() => {
  const tabs = document.querySelectorAll('.cat-tab');
  const panels = document.querySelectorAll('.cat-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;

      tabs.forEach((T) => {
        const isActive = T === tab;
        T.classList.toggle('active', isActive);
        T.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const match = panel.dataset.category === category;
        panel.classList.toggle('active', match);
        if (match) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });
    });
  });
})();

// Contact form — Cloudflare Pages Function handler
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Honeypot check
    const botField = contactForm.querySelector('[name="bot-field"]');
    if (botField?.value) return;

    const submitBtn = contactForm.querySelector('.submit-btn');
    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const data = Object.fromEntries(new FormData(contactForm));

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        window.location.href = '/success.html';
      } else {
        throw new Error('Server error');
      }
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';

      let errorEl = contactForm.querySelector('.form-error');
      if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'form-error';
        errorEl.style.cssText =
          'color:var(--red);font-size:0.85rem;margin-top:0.75rem;text-align:center;';
        contactForm.appendChild(errorEl);
      }

      errorEl.textContent =
        'Something went wrong. Please try again or email us directly.';
    }
  });
}

// === Gallery lightbox (categorized gallery images only) ===
(() => {
  const initLightbox = () => {
    const lightbox = document.getElementById('galleryLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    if (!lightbox || !lightboxImg) return;

    // Only target categorized gallery images, not featured slideshow images
    const galleryImages = document.querySelectorAll('#gallery .cat-item img');
    if (!galleryImages.length) return;

    const closeElements = lightbox.querySelectorAll('[data-lightbox-close]');

    function openLightbox(imgEl) {
      const fullSrc = imgEl.currentSrc || imgEl.getAttribute('src');
      if (!fullSrc) return;

      lightboxImg.src = fullSrc;
      lightboxImg.alt = imgEl.alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      lightboxImg.removeAttribute('src');
      lightboxImg.alt = '';
    }

    galleryImages.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openLightbox(img));
    });

    closeElements.forEach((el) => el.addEventListener('click', closeLightbox));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();
