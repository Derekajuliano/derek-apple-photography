// Featured slideshow — auto-cycling carousel
(() => {
  const slideshow = document.querySelector('.featured-slideshow');
  if (!slideshow) return;

  const slides = Array.from(
    slideshow.querySelectorAll('.featured-slide')
  );

  const dots = Array.from(
    slideshow.querySelectorAll('.featured-dot')
  );

  const prev = slideshow.querySelector('.featured-prev');
  const next = slideshow.querySelector('.featured-next');

  const slideCount = slides.length;
  if (!slideCount) return;

  const INTERVAL_MS = 5000;

  let currentIndex = Math.max(
    0,
    slides.findIndex(slide => slide.classList.contains('active'))
  );

  let timer = null;

  /**
   * Changes the slideshow container to match the active image.
   */
  function updateAspectRatio(slide) {
    const image = slide.querySelector('.featured-img');

    if (!image || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const ratio = image.naturalWidth / image.naturalHeight;

    slideshow.style.setProperty('--slide-ratio', ratio);
  }

  /**
   * Displays a particular slide.
   */
  function go(newIndex) {
    const previousIndex = currentIndex;

    currentIndex =
      ((newIndex % slideCount) + slideCount) % slideCount;

    // Update the container before fading in the new image.
    updateAspectRatio(slides[currentIndex]);

    slides[previousIndex]?.classList.remove('active');
    dots[previousIndex]?.classList.remove('active');

    slides[currentIndex].classList.add('active');
    dots[currentIndex]?.classList.add('active');
  }

  /**
   * Restarts automatic cycling.
   */
  function startTimer() {
    stopTimer();

    if (slideCount < 2) return;

    timer = window.setInterval(() => {
      go(currentIndex + 1);
    }, INTERVAL_MS);
  }

  /**
   * Stops automatic cycling.
   */
  function stopTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  /**
   * Changes slides after manual navigation and resets the timer.
   */
  function navigateTo(index) {
    go(index);
    startTimer();
  }

  // Set each image's ratio after it loads.
  slides.forEach((slide) => {
    const image = slide.querySelector('.featured-img');
    if (!image) return;

    const handleImageLoad = () => {
      if (slide.classList.contains('active')) {
        updateAspectRatio(slide);
      }
    };

    if (image.complete && image.naturalWidth) {
      handleImageLoad();
    } else {
      image.addEventListener('load', handleImageLoad, {
        once: true
      });
    }
  });

  // Previous and next buttons
  prev?.addEventListener('click', () => {
    navigateTo(currentIndex - 1);
  });

  next?.addEventListener('click', () => {
    navigateTo(currentIndex + 1);
  });

  // Navigation dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      navigateTo(index);
    });
  });

  // Pause while the pointer is over the slideshow.
  slideshow.addEventListener('mouseenter', stopTimer);
  slideshow.addEventListener('mouseleave', startTimer);

  // Pause while keyboard focus is inside the slideshow.
  slideshow.addEventListener('focusin', stopTimer);

  slideshow.addEventListener('focusout', (event) => {
    if (!slideshow.contains(event.relatedTarget)) {
      startTimer();
    }
  });

  // Keyboard navigation
  slideshow.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateTo(currentIndex - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateTo(currentIndex + 1);
    }
  });

  // Set the initial container ratio and begin cycling.
  updateAspectRatio(slides[currentIndex]);
  startTimer();
})();  function start() {
    stop();
    timer = setInterval(() => go(I + 1), INTERVAL_MS);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function reset() { start(); }

  prev && prev.addEventListener('click', () => { go(I - 1); reset(); });
  next && next.addEventListener('click', () => { go(I + 1); reset(); });
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);
      if (!Number.isNaN(idx)) { go(idx); reset(); }
    });
  });

  // Pause on hover (desktop), resume on leave
  slideshow.addEventListener('mouseenter', stop);
  slideshow.addEventListener('mouseleave', start);

  // Pause when tab is hidden so we don't spin in the background
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
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

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.category;
      tabs.forEach(T => {
        const isActive = T === tab;
        T.classList.toggle('active', isActive);
        T.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach(P => {
        const match = P.dataset.category === cat;
        P.classList.toggle('active', match);
        if (match) P.removeAttribute('hidden');
        else       P.setAttribute('hidden', '');
      });
    });
  });
})();

// Contact form — Cloudflare Pages Function handler
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (E) => {
    E.preventDefault();

    // Honeypot check
    if (contactForm.querySelector('[name="bot-field"]').value) return;

    const btn = contactForm.querySelector('.submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const data = Object.fromEntries(new FormData(contactForm));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/JSON' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        window.location.href = '/success.html';
      } else {
        throw new Error('Server error');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send Message';
      let err = contactForm.querySelector('.form-error');
      if (!err) {
        err = document.createElement('p');
        err.className = 'form-error';
        err.style.cssText = 'color:var(--red);font-size:0.85rem;margin-top:0.75rem;text-align:center;';
        contactForm.appendChild(err);
      }
      err.textContent = 'Something went wrong. Please try again or email us directly.';
    }
  });
}
