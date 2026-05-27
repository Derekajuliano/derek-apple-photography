// Nav scroll shadow
window.addEventListener(
  'scroll',
  () => {
    document
      .getElementById('nav')
      ?.classList.toggle('scrolled', window.scrollY > 40);
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
    burger.setAttribute('aria-expanded', isOpen);
    drawer.setAttribute('aria-hidden', !isOpen);

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
const revealObs = new IntersectionObserver(
  entries => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 70);

        revealObs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document
  .querySelectorAll('.reveal')
  .forEach(el => revealObs.observe(el));

// Featured slideshow
(() => {
  const slideshow = document.querySelector('.featured-slideshow');

  if (!slideshow) return;

  const slides = slideshow.querySelectorAll('.featured-slide');
  const dots = slideshow.querySelectorAll('.featured-dot');
  const prev = slideshow.querySelector('.featured-prev');
  const next = slideshow.querySelector('.featured-next');

  const total = slides.length;

  if (total < 2) return;

  const INTERVAL_MS = 5000;

  let current = 0;
  let timer = null;

  function go(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');

    current = ((index % total) + total) % total;

    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();

    timer = setInterval(() => {
      go(current + 1);
    }, INTERVAL_MS);
  }

  function reset() {
    start();
  }

  prev?.addEventListener('click', () => {
    go(current - 1);
    reset();
  });

  next?.addEventListener('click', () => {
    go(current + 1);
    reset();
  });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);

      if (!Number.isNaN(idx)) {
        go(idx);
        reset();
      }
    });
  });

  slideshow.addEventListener('mouseenter', stop);
  slideshow.addEventListener('mouseleave', start);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (!reducedMotion.matches) {
    start();
  }
})();

// Categorized gallery tabs
(() => {
  const tabs = document.querySelectorAll('.cat-tab');
  const panels = document.querySelectorAll('.cat-panel');

  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.category;

      tabs.forEach(t => {
        const active = t === tab;

        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active);
      });

      panels.forEach(panel => {
        const match = panel.dataset.category === cat;

        panel.classList.toggle('active', match);

        if (match) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    });
  });
})();

// Contact form
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot
    if (contactForm.querySelector('[name="bot-field"]').value) {
      return;
    }

    const btn = contactForm.querySelector('.submit-btn');

    btn.disabled = true;
    btn.textContent = 'Sending…';

    const data = Object.fromEntries(
      new FormData(contactForm)
    );

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/JSON'
        },
        body: JSON.stringify(data)
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

        err.style.cssText =
          'color:var(--red);font-size:0.85rem;margin-top:0.75rem;text-align:center;';

        contactForm.appendChild(err);
      }

      err.textContent =
        'Something went wrong. Please try again or email us directly.';
    }
  });
}

// Nav logo visibility
const navLogo = document.querySelector('.nav-logo');
const heroLogo = document.querySelector('.hero-logo-circle');

function toggleNavLogo() {
  if (!navLogo || !heroLogo) return;

  const heroBottom =
    heroLogo.getBoundingClientRect().bottom;

  if (heroBottom > 0) {
    navLogo.classList.remove('show-logo');
  } else {
    navLogo.classList.add('show-logo');
  }
}

window.addEventListener('scroll', toggleNavLogo);
window.addEventListener('load', toggleNavLogo);
