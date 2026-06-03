/* =========================================================
   Penguin — interactions & animations
   Vanilla JS + GSAP / ScrollTrigger
   ========================================================= */
(function () {
  "use strict";

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

    (function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    const hoverSel = 'a, button, [data-cursor], input, .menu-item';
    document.querySelectorAll(hoverSel).forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });

    document.addEventListener("mouseleave", () => { dot.style.opacity = ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { dot.style.opacity = ring.style.opacity = "1"; });
  }

  /* ---------------------------------------------------------
     2. Navbar: glassmorphism on scroll
  --------------------------------------------------------- */
  const navInner = document.getElementById("navInner");
  const onScroll = () => navInner.classList.toggle("nav-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------
     3. Scroll progress bar
  --------------------------------------------------------- */
  const progressBar = document.getElementById("scroll-progress");
  if (progressBar && !reduceMotion) {
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = total > 0 ? `${(window.scrollY / total) * 100}%` : "0%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------------------------------------------------------
     4. Mobile menu toggle (GSAP-animated)
  --------------------------------------------------------- */
  const toggle     = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const openIcon   = document.getElementById("menuOpenIcon");
  const closeIcon  = document.getElementById("menuCloseIcon");

  const setMenu = (open) => {
    openIcon.classList.toggle("hidden", open);
    closeIcon.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    if (!reduceMotion && window.gsap) {
      if (open) {
        mobileMenu.classList.remove("hidden");
        gsap.fromTo(mobileMenu,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.24, ease: "power2.out" }
        );
      } else {
        gsap.to(mobileMenu, {
          opacity: 0, y: -8, duration: 0.18, ease: "power2.in",
          onComplete() {
            mobileMenu.classList.add("hidden");
            gsap.set(mobileMenu, { clearProps: "opacity,y" });
          }
        });
      }
    } else {
      mobileMenu.classList.toggle("hidden", !open);
    }
  };

  if (toggle) {
    toggle.addEventListener("click", () => setMenu(mobileMenu.classList.contains("hidden")));
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }

  /* ---------------------------------------------------------
     5. Menu tabs with panel exit animation
  --------------------------------------------------------- */
  const tabs            = document.querySelectorAll(".menu-tab");
  const inactiveTextCls = "text-cream/70";
  let tabAnimating      = false;

  function selectTab(name) {
    if (tabAnimating) return;

    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.classList.toggle("bg-cream", on);
      t.classList.toggle("text-espresso-deep", on);
      t.classList.toggle("shadow-soft", on);
      t.classList.toggle(inactiveTextCls, !on);
    });

    const currentPanel = document.querySelector(".menu-panel:not(.is-hidden)");
    const nextPanel    = document.querySelector(`[data-panel="${name}"]`);
    if (!nextPanel || currentPanel === nextPanel) return;

    const showNext = () => {
      if (currentPanel) {
        currentPanel.classList.add("is-hidden");
        if (window.gsap) gsap.set(currentPanel, { clearProps: "opacity,y" });
      }
      nextPanel.classList.remove("is-hidden");
      if (!reduceMotion && window.gsap) {
        gsap.fromTo(nextPanel.querySelectorAll(".menu-item"),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.38, ease: "power2.out", stagger: 0.06, overwrite: true }
        );
      }
      tabAnimating = false;
    };

    if (!reduceMotion && window.gsap && currentPanel) {
      tabAnimating = true;
      gsap.to(currentPanel, {
        opacity: 0, y: 8, duration: 0.15, ease: "power2.in",
        onComplete: showNext,
      });
    } else {
      showNext();
    }
  }

  tabs.forEach((t) => t.addEventListener("click", () => selectTab(t.dataset.tab)));

  /* ---------------------------------------------------------
     6. GSAP animations
  --------------------------------------------------------- */
  if (window.gsap) {
    if (reduceMotion) {
      gsap.set("[data-reveal], .hero-anim, [data-feature], [data-footer-col]",
        { clearProps: "all", opacity: 1 });
    } else {
      gsap.registerPlugin(ScrollTrigger);

      // -- Hero load timeline --
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .fromTo(".hero-anim",
          { y: 34, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, delay: 0.15 })
        .add(() => {
          // Gentle perpetual float on the badge once it has landed
          const badge = document.getElementById("hero-badge");
          if (badge) {
            gsap.to(badge, { y: -9, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
          }
        }, "+=0.1");

      // -- Hero image parallax drift --
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

      // -- Vibe feature cards: staggered fade-in --
      gsap.fromTo("[data-feature]",
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.16,
          scrollTrigger: { trigger: "#vibe", start: "top 70%", toggleActions: "play none none none" },
        });

      // -- Feature card icon scale on hover --
      document.querySelectorAll("[data-feature]").forEach((card) => {
        const icon = card.querySelector("span:first-child");
        if (!icon) return;
        card.addEventListener("mouseenter", () =>
          gsap.to(icon, { scale: 1.12, duration: 0.2, ease: "power2.out" }));
        card.addEventListener("mouseleave", () =>
          gsap.to(icon, { scale: 1, duration: 0.25, ease: "power2.out" }));
      });

      // -- Menu items: stagger in for the initially-visible panel --
      gsap.fromTo('[data-panel="icecream"] .menu-item',
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.07,
          scrollTrigger: { trigger: "#menu", start: "top 60%", toggleActions: "play none none none" },
        });

      // -- Footer columns stagger --
      gsap.fromTo("[data-footer-col]",
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.1,
          scrollTrigger: { trigger: "footer", start: "top 88%", toggleActions: "play none none none" },
        });
    }
  }
})();
