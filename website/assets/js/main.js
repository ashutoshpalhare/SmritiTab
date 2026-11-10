(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#year").textContent = new Date().getFullYear();
  if (window.lucide) window.lucide.createIcons();

  // Live, locale-aware dashboard preview.
  const updateClock = () => {
    const now = new Date();
    const time = new Intl.DateTimeFormat(undefined, {hour:"2-digit", minute:"2-digit", hour12:true}).formatToParts(now);
    const hour = now.getHours();
    $("#dashClock").innerHTML = time.filter(part => part.type === "hour" || part.type === "minute").map(part => part.value).join(":") + " <em>" + (time.find(part => part.type === "dayPeriod")?.value || "") + "</em>";
    $("#dashDate").textContent = new Intl.DateTimeFormat(undefined, {weekday:"long", month:"long", day:"numeric"}).format(now);
    $("#dashGreeting").textContent = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  };
  updateClock();
  window.setInterval(updateClock, 30_000);

  // Sticky header, reading progress and back-to-top.
  const nav = $(".nav"), progress = $("#scrollProgress"), backTop = $("#backTop");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + "%";
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
    backTop.classList.toggle("visible", window.scrollY > 500);
  };
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
  backTop.addEventListener("click", () => window.scrollTo({top:0, behavior:reducedMotion ? "auto" : "smooth"}));

  // Accessible compact navigation on mobile.
  const menuToggle = $("#menuToggle"), primaryNav = $("#primaryNav");
  menuToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.innerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    if (window.lucide) window.lucide.createIcons();
  });
  $$("a", primaryNav).forEach(link => link.addEventListener("click", () => {
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.innerHTML = '<i data-lucide="menu"></i>';
    if (window.lucide) window.lucide.createIcons();
  }));

  // Theme switch, persisted only as a website preference.
  const themeToggle = $("#themeToggle");
  const setTheme = theme => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.innerHTML = theme === "dark" ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    if (window.lucide) window.lucide.createIcons();
  };
  let savedTheme = "dark";
  try { savedTheme = localStorage.getItem("smrititab-site-theme") || "dark"; } catch (_) {}
  setTheme(savedTheme);
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("smrititab-site-theme", next); } catch (_) {}
  });

  // Motion is progressive enhancement; content remains visible without CDNs.
  if (!reducedMotion && window.gsap && window.ScrollTrigger) {
    document.documentElement.classList.add("js-ready");
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".eyebrow", {y:16, opacity:0, duration:.7, ease:"power3.out", delay:.1});
    gsap.from(".hero h1", {y:28, opacity:0, duration:.9, ease:"power3.out", delay:.18});
    gsap.from(".hero-copy,.hero-actions,.microcopy", {y:18, opacity:0, duration:.7, stagger:.12, ease:"power2.out", delay:.35});
    gsap.from(".preview", {y:42, opacity:0, scale:.97, duration:1.1, ease:"power3.out", delay:.45});
    $$(".section-head,.feature,.split > *, .step,.faq details,.cta-band").forEach(element => {
      element.classList.add("reveal");
      gsap.to(element, {y:0, opacity:1, duration:.75, ease:"power2.out", scrollTrigger:{trigger:element,start:"top 88%",once:true}});
    });
    gsap.to(".preview", {y:-12, ease:"none", scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:1}});
  }
})();