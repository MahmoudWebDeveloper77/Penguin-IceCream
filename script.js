/* =========================================================
   Penguin — interactions & animations
   Vanilla JS + GSAP / ScrollTrigger
   ========================================================= */
(function () {
  "use strict";

  // Mark JS as available (drives pre-animation hidden states in CSS)
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     1. Custom cursor (dot + expanding ring) — fine pointers only
  --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const dot  = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    document.body.classList.add("has-cursor");

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // Ring eases toward the cursor for a smooth trailing feel
    (function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    // Expand ring over interactive elements
    const hoverSel = 'a, button, [data-cursor], input, .menu-item';
    document.querySelectorAll(hoverSel).forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });

    // Hide cursor when it leaves the window
    document.addEventListener("mouseleave", () => { dot.style.opacity = ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { dot.style.opacity = ring.style.opacity = "1"; });
  }

  /* ---------------------------------------------------------
     2. Navbar: glassmorphism on scroll
  --------------------------------------------------------- */
  const navInner = document.getElementById("navInner");
  const onScroll = () => {
    navInner.classList.toggle("nav-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------
     3. Mobile menu toggle
  --------------------------------------------------------- */
  const toggle    = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const openIcon  = document.getElementById("menuOpenIcon");
  const closeIcon = document.getElementById("menuCloseIcon");

  const setMenu = (open) => {
    mobileMenu.classList.toggle("hidden", !open);
    openIcon.classList.toggle("hidden", open);
    closeIcon.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  if (toggle) {
    toggle.addEventListener("click", () => setMenu(mobileMenu.classList.contains("hidden")));
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }

  /* ---------------------------------------------------------
     4. Menu tabs (Ice Cream / Coffee)
  --------------------------------------------------------- */
  const tabs   = document.querySelectorAll(".menu-tab");
  const panels = document.querySelectorAll(".menu-panel");

  const inactiveTextClass = "text-cream/70";

  function selectTab(name) {
    tabs.forEach((t) => {
      const isActive = t.dataset.tab === name;
      t.classList.toggle("is-active", isActive);
      t.classList.toggle("bg-cream", isActive);
      t.classList.toggle("text-espresso-deep", isActive);
      t.classList.toggle("shadow-soft", isActive);
      t.classList.toggle(inactiveTextClass, !isActive);
    });

    panels.forEach((p) => {
      const show = p.dataset.panel === name;
      p.classList.toggle("is-hidden", !show);
      if (show && !reduceMotion && window.gsap) {
        gsap.fromTo(p.querySelectorAll(".menu-item"),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.06, overwrite: true });
      }
    });
  }
  tabs.forEach((t) => t.addEventListener("click", () => selectTab(t.dataset.tab)));

  /* ---------------------------------------------------------
     5. GSAP animations
  --------------------------------------------------------- */
  if (window.gsap) {
    if (reduceMotion) {
      // Make sure everything is simply visible
      gsap.set("[data-reveal], .hero-anim, [data-feature]", { clearProps: "all", opacity: 1 });
    } else {
      gsap.registerPlugin(ScrollTrigger);

      // -- Hero load timeline (text slides up + fades in, staggered) --
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl.fromTo(".hero-anim",
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, delay: 0.15 });

      // -- Gentle parallax drift on hero images --
      gsap.utils.toArray("figure.hero-anim").forEach((fig, i) => {
        gsap.to(fig, {
          y: i % 2 === 0 ? -40 : -70,
          ease: "none",
          scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      // -- Generic reveal-on-scroll --
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.fromTo(el,
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          });
      });

      // -- Vibe feature cards: staggered fade-in on scroll --
      gsap.fromTo("[data-feature]",
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.16,
          scrollTrigger: { trigger: "#vibe", start: "top 70%", toggleActions: "play none none none" },
        });

      // -- Menu items: stagger in for the initially-visible panel --
      gsap.fromTo('[data-panel="icecream"] .menu-item',
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.07,
          scrollTrigger: { trigger: "#menu", start: "top 60%", toggleActions: "play none none none" },
        });
    }
  }
})();
