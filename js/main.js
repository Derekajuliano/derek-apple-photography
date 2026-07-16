(() => {
  "use strict";

  // ------------------------------
  // Helpers
  // ------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const getFocusable = (root) =>
    $$(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      root
    ).filter((el) => el.offsetParent !== null);

  // ------------------------------
  // Reveal on scroll
  // ------------------------------
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ------------------------------
  // Mobile drawer
  // ------------------------------
  const burger = $("#burger");
  const drawer = $("#drawer");
  const drawerLinks = $$("a", drawer);
  let drawerOpen = false;
  let drawerLastFocus = null;

  const setDrawerState = (open) => {
    if (!burger || !drawer) return;

    drawerOpen = open;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);

    if (open) {
      drawerLastFocus = document.activeElement;
      (drawerLinks[0] || drawer).focus?.();
    } else {
      drawerLastFocus?.focus?.();
    }
  };

  const closeDrawer = () => setDrawerState(false);

  burger?.addEventListener("click", () => setDrawerState(!drawerOpen));

  drawerLinks.forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  document.addEventListener("click", (E) => {
    if (!drawerOpen || !drawer || !burger) return;
    const target = E.target;
    if (!(target instanceof Node)) return;
    if (!drawer.contains(target) && !burger.contains(target)) {
      closeDrawer();
    }
  });

  // ------------------------------
  // Featured slideshow
  // ------------------------------
  const featured = $(".featured-slideshow");
  const slides = $$(".featured-slide", featured || document);
  const dots = $$(".featured-dot", featured || document);
  const prevBtn = $(".featured-prev", featured || document);
  const nextBtn = $(".featured-next", featured || document);

  let currentSlide = 0;
  let autoTimer = null;
  const AUTO_MS = 5000;

  const goToSlide = (idx) => {
    if (!slides.length) return;
    currentSlide = (idx + slides.length) % slides.length;

    slides.forEach((S, I) => S.classList.toggle("active", I === currentSlide));
    dots.forEach((D, I) => D.classList.toggle("active", I === currentSlide));
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  const stopAuto = () => {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAuto = () => {
    stopAuto();
    if (slides.length > 1) autoTimer = setInterval(nextSlide, AUTO_MS);
  };

  prevBtn?.addEventListener("click", () => {
    prevSlide();
    startAuto();
  });

  nextBtn?.addEventListener("click", () => {
    nextSlide();
    startAuto();
  });

  dots.forEach((dot, I) =>
    dot.addEventListener("click", () => {
      goToSlide(I);
      startAuto();
    })
  );

  if (featured) {
    featured.addEventListener("mouseenter", stopAuto);
    featured.addEventListener("mouseleave", startAuto);
  }

  if (slides.length) {
    goToSlide(0);
    startAuto();
  }

  // ------------------------------
  // Category tabs (gallery)
  // ------------------------------
  const tabButtons = $$(".cat-tab[role='tab']");
  const panels = $$(".cat-panel[role='tabpanel']");

  const activateCategory = (category, focusTab = false) => {
    tabButtons.forEach((tab) => {
      const active = tab.dataset.category === category;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
      if (active && focusTab) tab.focus();
    });

    panels.forEach((panel) => {
      const active = panel.dataset.category === category;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  };

  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => activateCategory(tab.dataset.category));

    tab.addEventListener("keydown", (E) => {
      const idx = tabButtons.indexOf(tab);
      if (idx < 0) return;

      let nextIdx = idx;
      if (E.key === "ArrowRight") nextIdx = (idx + 1) % tabButtons.length;
      if (E.key === "ArrowLeft") nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
      if (E.key === "Home") nextIdx = 0;
      if (E.key === "End") nextIdx = tabButtons.length - 1;
      if (nextIdx !== idx) {
        E.preventDefault();
        activateCategory(tabButtons[nextIdx].dataset.category, true);
      }
    });
  });

  // ------------------------------
  // Lightbox (with focus trap + Esc)
  // ------------------------------
  const lightbox = $("#galleryLightbox");
  const lightboxImg = $("#lightboxImage");
  const lightboxCloseEls = $$("[data-lightbox-close]", lightbox || document);
  const galleryImages = $$(".cat-img");
  let lightboxOpen = false;
  let lightboxLastFocus = null;

  const trapFocus = (E) => {
    if (!lightboxOpen || !lightbox) return;
    if (E.key !== "Tab") return;

    const focusables = getFocusable(lightbox);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (E.shiftKey && active === first) {
      E.preventDefault();
      last.focus();
    } else if (!E.shiftKey && active === last) {
      E.preventDefault();
      first.focus();
    }
  };

  const openLightbox = (imgEl) => {
    if (!lightbox || !lightboxImg || !imgEl) return;

    const fullSrc = imgEl.dataset.full || imgEl.src;
    const alt = imgEl.alt || "Expanded gallery image";

    lightboxImg.src = fullSrc;
    lightboxImg.alt = alt;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("open");
    document.body.classList.add("no-scroll");

    lightboxLastFocus = document.activeElement;
    lightboxOpen = true;

    const closeBtn = $(".lightbox-close", lightbox);
    closeBtn?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;

    lightbox.setAttribute("aria-hidden", "true");
    lightbox.classList.remove("open");
    document.body.classList.remove("no-scroll");

    lightboxImg.src = "";
    lightboxImg.alt = "";

    lightboxOpen = false;
    lightboxLastFocus?.focus?.();
  };

  galleryImages.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => openLightbox(img));
    img.addEventListener("keydown", (E) => {
      if (E.key === "Enter" || E.key === " ") {
        E.preventDefault();
        openLightbox(img);
      }
    });
    if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
  });

  lightboxCloseEls.forEach((el) => el.addEventListener("click", closeLightbox));

  // ------------------------------
  // Global keyboard handling
  // ------------------------------
  document.addEventListener("keydown", (E) => {
    if (E.key === "Escape") {
      if (lightboxOpen) {
        closeLightbox();
        return;
      }
      if (drawerOpen) {
        closeDrawer();
      }
    }

    trapFocus(E);
  });

  // ------------------------------
  // Optional: smooth scroll for same-page links
  // ------------------------------
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (E) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = $(id);
      if (!target) return;
      E.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
