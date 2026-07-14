// Nav scroll shadow
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Burger / drawer
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');

burger.addEventListener('click', () => {
  const isOpen = drawer.classList.toggle('open');
  burger.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', isOpen);
  drawer.setAttribute('aria-hidden', !isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

drawer.querySelectorAll('a').forEach(A => {
  A.addEventListener('click', () => {
    drawer.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
});

// Scroll reveal
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, I) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), I * 70);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Featured slideshow — auto-cycling carousel
(() => {
  const slideshow = document.querySelector('.featured-slideshow');
  if (!slideshow) return;

  const slides = slideshow.querySelectorAll('.featured-slide');
  const dots   = slideshow.querySelectorAll('.featured-dot');
  const prev   = slideshow.querySelector('.featured-prev');
  const next   = slideshow.querySelector('.featured-next');
  const N = slides.length;
  if (N < 2) return; // nothing to cycle

  const INTERVAL_MS = 5000;
  let I = 0;
  let timer = null;

  function go(n) {
    slides[I].classList.remove('active');
    dots[I] && dots[I].classList.remove('active');
    I = ((n % N) + N) % N;
    slides[I].classList.add('active');
    dots[I] && dots[I].classList.add('active');
  }

  function start() {
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
