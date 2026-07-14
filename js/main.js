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

  const previousButton =
    slideshow.querySelector('.featured-prev');

  const nextButton =
    slideshow.querySelector('.featured-next');

  const slideCount = slides.length;

  if (slideCount === 0) return;

  const INTERVAL_MS = 5000;

  let currentIndex = slides.findIndex(slide =>
    slide.classList.contains('active')
  );

  if (currentIndex < 0) {
    currentIndex = 0;
    slides[0].classList.add('active');
    dots[0]?.classList.add('active');
  }

  let timer = null;
  let isPointerOver = false;
  let hasFocusWithin = false;

  function updateAspectRatio(slide) {
    const image = slide.querySelector('.featured-img');

    if (
      !image ||
      image.naturalWidth === 0 ||
      image.naturalHeight === 0
    ) {
      return;
    }

    slideshow.style.aspectRatio =
      `${image.naturalWidth} / ${image.naturalHeight}`;
  }

  function showSlide(newIndex) {
    const normalizedIndex =
      ((newIndex % slideCount) + slideCount) % slideCount;

    slides.forEach((slide, index) => {
      const isActive = index === normalizedIndex;

      slide.classList.toggle('active', isActive);
      dots[index]?.classList.toggle('active', isActive);

      if (dots[index]) {
        dots[index].setAttribute(
          'aria-selected',
          String(isActive)
        );
      }
    });

    currentIndex = normalizedIndex;
    updateAspectRatio(slides[currentIndex]);
  }

  function stopTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

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
      showSlide(currentIndex + 1);
    }, INTERVAL_MS);
  }

  function navigateTo(index) {
    showSlide(index);
    startTimer();
  }

  slides.forEach(slide => {
    const image = slide.querySelector('.featured-img');
    if (!image) return;

    const handleLoad = () => {
      if (slide.classList.contains('active')) {
        updateAspectRatio(slide);
      }
    };

    if (image.complete && image.naturalWidth > 0) {
      handleLoad();
    } else {
      image.addEventListener('load', handleLoad, {
        once: true
      });
    }
  });

  previousButton?.addEventListener('click', () => {
    navigateTo(currentIndex - 1);
  });

  nextButton?.addEventListener('click', () => {
    navigateTo(currentIndex + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      navigateTo(index);
    });
  });

  slideshow.addEventListener('mouseenter', () => {
    isPointerOver = true;
    stopTimer();
  });

  slideshow.addEventListener('mouseleave', () => {
    isPointerOver = false;
    startTimer();
  });

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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  showSlide(currentIndex);
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
