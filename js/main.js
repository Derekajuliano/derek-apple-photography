```js
// Nav scroll shadow
const nav = document.getElementById('nav');

if (nav) {
  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    },
    { passive: true }
  );
}

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

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

// Scroll reveal
const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 70);

          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach(element => {
    element.classList.add('visible');
  });
}

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

  const previousButton = slideshow.querySelector('.featured-prev');
  const nextButton = slideshow.querySelector('.featured-next');

  const slideCount = slides.length;

  if (!slideCount) return;

  const INTERVAL_MS = 5000;

  let currentIndex = Math.max(
    0,
    slides.findIndex(slide => slide.classList.contains('active'))
  );

  let timer = null;
  let isPointerOver = false;
  let hasFocusWithin = false;

  /**
   * Changes the slideshow container to match the active image.
   */
  function updateAspectRatio(slide) {
    const image = slide?.querySelector('.featured-img');

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

    updateAspectRatio(slides[currentIndex]);

    slides[previousIndex]?.classList.remove('active');
    dots[previousIndex]?.classList.remove('active');

    slides[currentIndex].classList.add('active');
    dots[currentIndex]?.classList.add('active');

    dots.forEach((dot, index) => {
      dot.setAttribute(
        'aria-selected',
        String(index === currentIndex)
      );
    });
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
   * Starts automatic cycling unless the slideshow is paused.
   */
  function startTimer() {
    stopTimer();

    if (
      slideCount < 2 ||
      isPointerOver ||
      hasFocusWithin ||
      document.hidden
    ) {
      return;
    }

    timer = window.setInterval(() => {
      go(currentIndex + 1);
    }, INTERVAL_MS);
  }

  /**
   * Changes slides manually and restarts the timer when appropriate.
   */
  function navigateTo(index) {
    go(index);
    startTimer();
  }

  // Update the container ratio whenever an image finishes loading.
  slides.forEach(slide => {
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
  previousButton?.addEventListener('click', () => {
    navigateTo(currentIndex - 1);
  });

  nextButton?.addEventListener('click', () => {
    navigateTo(currentIndex + 1);
  });

  // Navigation dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      navigateTo(index);
    });
  });

  // Pause while the pointer is over the slideshow.
  slideshow.addEventListener('mouseenter', () => {
    isPointerOver = true;
    stopTimer();
  });

  slideshow.addEventListener('mouseleave', () => {
    isPointerOver = false;
    startTimer();
  });

  // Pause while keyboard focus is inside the slideshow.
  slideshow.addEventListener('focusin', () => {
    hasFocusWithin = true;
    stopTimer();
  });

  slideshow.addEventListener('focusout', event => {
    if (!slideshow.contains(event.relatedTarget)) {
      hasFocusWithin = false;
      startTimer();
    }
  });

  // Keyboard navigation
  slideshow.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateTo(currentIndex - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateTo(currentIndex + 1);
    }
  });

  // Pause autoplay while the browser tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  // Set the initial slide state and begin cycling.
  go(currentIndex);
  startTimer();
})();

// Contact form — Cloudflare Pages Function handler
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();

    // Honeypot check
    const honeypot = contactForm.querySelector(
      '[name="bot-field"]'
    );

    if (honeypot?.value) return;

    const submitButton =
      contactForm.querySelector('.submit-btn');

    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';

    const data = Object.fromEntries(
      new FormData(contactForm)
    );

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/JSON'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      window.location.href = '/success.html';
    } catch (error) {
      console.error('Contact form error:', error);

      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';

      let errorMessage =
        contactForm.querySelector('.form-error');

      if (!errorMessage) {
        errorMessage = document.createElement('p');
        errorMessage.className = 'form-error';
        errorMessage.style.cssText = `
          color: var(--red);
          font-size: 0.85rem;
          margin-top: 0.75rem;
          text-align: center;
        `;

        contactForm.appendChild(errorMessage);
      }

      errorMessage.textContent =
        'Something went wrong. Please try again or email us directly.';
    }
  });
}
```
