(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- THEME (dark / light) ---------- */
  const themeButtons = document.querySelectorAll("[data-theme-set]");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeButtons.forEach((btn) =>
      btn.setAttribute("aria-pressed", String(btn.dataset.themeSet === theme)),
    );
  }

  function setTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
    if (root.getAttribute("data-theme") === theme) return;

    // Smooth cross-fade where supported, instant switch elsewhere
    if (document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(() => applyTheme(theme));
    } else {
      applyTheme(theme);
    }
  }

  applyTheme(root.getAttribute("data-theme") || "light");
  themeButtons.forEach((btn) =>
    btn.addEventListener("click", () => setTheme(btn.dataset.themeSet)),
  );

  /* ---------- NAVBAR: active section + sliding indicator ---------- */
  const navbar = document.querySelector(".navbar");
  const navList = document.querySelector(".nav-links");
  const indicator = document.querySelector(".nav-indicator");
  const links = [...document.querySelectorAll(".nav-links a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
  const NAV_HEIGHT = 68;

  let activeIndex = -2; // -1 = hero (no link active)
  let locked = false; // true while a nav click is smooth-scrolling
  let lockTimer;

  function moveIndicator() {
    const link = links[activeIndex];
    if (!link) {
      indicator.style.opacity = "0";
      return;
    }
    const l = link.getBoundingClientRect();
    const p = navList.getBoundingClientRect();
    indicator.style.width = `${l.width}px`;
    indicator.style.transform = `translateX(${l.left - p.left}px)`;
    indicator.style.opacity = "1";
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    links.forEach((a, i) => {
      a.classList.toggle("active", i === index);
      if (i === index) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    moveIndicator();
  }

  function spy() {
    if (locked) return;
    const y = window.scrollY + NAV_HEIGHT + window.innerHeight * 0.3;
    let index = -1;
    sections.forEach((s, i) => {
      if (s && s.offsetTop <= y) index = i;
    });
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) index = sections.length - 1;
    setActive(index);
  }

  // While a click-triggered smooth scroll runs, keep the clicked link active
  function lock(index, fallbackMs = 700) {
    locked = true;
    setActive(index);
    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      locked = false;
      spy();
    }, fallbackMs);
  }

  links.forEach((a, i) => a.addEventListener("click", () => lock(i)));
  document
    .querySelectorAll(".logo, .back-to-top")
    .forEach((a) => a.addEventListener("click", () => lock(-1)));

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("is-scrolled", window.scrollY > 8);
      if (locked) {
        clearTimeout(lockTimer);
        lockTimer = setTimeout(() => {
          locked = false;
          spy();
        }, 150);
        return;
      }
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          spy();
          ticking = false;
        });
      }
    },
    { passive: true },
  );

  window.addEventListener("resize", moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

  // First placement without sliding in from the left
  indicator.classList.add("no-anim");
  spy();
  navbar.classList.toggle("is-scrolled", window.scrollY > 8);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => indicator.classList.remove("no-anim")),
  );

  /* ---------- MOBILE MENU ---------- */
  const toggle = document.querySelector(".nav-toggle");

  function closeMenu() {
    navbar.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const open = navbar.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.forEach((a) => a.addEventListener("click", closeMenu));
  document.querySelector(".logo").addEventListener("click", closeMenu);
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });

  /* ---------- SCROLL REVEAL ---------- */
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

  const targets = document.querySelectorAll(
    ".section-heading, .about-card, .skill-card, .project-card, .career-container, .certificate-card, .contact-item, .contact-form-container",
  );
  const staggered = ".skill-card, .project-card, .certificate-card, .contact-item";

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        el.classList.add("is-visible");
        // Hand control back to the normal hover styles once the entrance is done
        const delay = parseFloat(el.style.getPropertyValue("--d")) * 1000 || 0;
        setTimeout(() => {
          el.classList.remove("reveal", "is-visible");
          el.style.removeProperty("--d");
        }, 1400 + delay);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  targets.forEach((el) => {
    el.classList.add("reveal");
    if (el.matches(staggered)) {
      const i = [...el.parentElement.children].indexOf(el);
      el.style.setProperty("--d", `${Math.min(i, 4) * 0.09}s`);
    }
    observer.observe(el);
  });
})();

// Typing Animation
const changingText = document.querySelector(".changing-text");

const descriptions = [
  "Web Development",
  "IT Support",
  "Aspiring IT Professional"
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const currentText = descriptions[textIndex];

  if (isDeleting) {
    changingText.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    changingText.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }

  let speed = isDeleting ? 50 : 100;

  if (!isDeleting && charIndex === currentText.length) {
    speed = 1500;
    isDeleting = true;
  } 
  else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % descriptions.length;
    speed = 500;
  }

  setTimeout(typeEffect, speed);
}

typeEffect();
