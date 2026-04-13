(function () {
  "use strict";

  var HEADER_OFFSET = 88;
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /** Hero: Lottie “hello” — data from hello-animation.data.js (file:// safe) or JSON over http */
  function initHeroLottie() {
    var container = document.getElementById("hero-lottie");
    if (!container) return;
    if (typeof lottie === "undefined") {
      if (!initHeroLottie._waitLoad) {
        initHeroLottie._waitLoad = true;
        window.addEventListener("load", initHeroLottie, { once: true });
      }
      return;
    }

    if (container.getAttribute("data-lottie-init") === "1") return;
    container.setAttribute("data-lottie-init", "1");

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animOpts = {
      container: container,
      renderer: "svg",
      loop: !reduced,
      autoplay: !reduced,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    };
    if (typeof window.__HERO_LOTTIE_DATA !== "undefined") {
      animOpts.animationData = window.__HERO_LOTTIE_DATA;
    } else {
      animOpts.path = new URL("assets/lottie/hello-animation.json", document.baseURI || window.location.href).href;
    }
    var anim = lottie.loadAnimation(animOpts);

    var reducedStillFrame = 45;

    function freezeStillFrame() {
      try {
        anim.goToAndStop(reducedStillFrame, true);
      } catch (e) {}
    }

    if (reduced) {
      anim.addEventListener("DOMLoaded", freezeStillFrame);
      anim.addEventListener("data_ready", freezeStillFrame);
    }

    document.addEventListener("visibilitychange", function () {
      if (reduced) return;
      if (document.hidden) anim.pause();
      else anim.play();
    });
  }

  initHeroLottie();

  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.getElementById("nav-menu");
  var headerNav = document.querySelector(".site-header .nav");
  var header = document.querySelector(".site-header");
  var backToTop = document.getElementById("back-to-top");
  var toast = document.getElementById("toast");
  var toastTimer;
  var scrollTicking = false;
  var resizeTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("toast--visible");
    }, 2800);
  }

  function closeMobileNav() {
    if (!toggle || !navLinks) return;
    navLinks.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
    toggle.focus();
  }

  function openMobileNav() {
    if (!toggle || !navLinks) return;
    navLinks.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(function () {
      var first = navLinks.querySelector("a[href]");
      if (first) first.focus();
    });
  }

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      if (navLinks.classList.contains("open")) closeMobileNav();
      else openMobileNav();
    });

    navLinks.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        closeMobileNav();
      });
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMobileNav();
  });

  /** Same-folder asset URL even when the page is /folder (no trailing slash) — avoids /assets/... 404 */
  function absoluteAssetUrl(rel) {
    var clean = (rel || "").replace(/^\.\//, "");
    if (!clean) return "";
    if (window.location.protocol === "file:") {
      try {
        return new URL(clean, document.baseURI || window.location.href).href;
      } catch (err) {
        return clean;
      }
    }
    var path = window.location.pathname || "/";
    if (/\.html?$/i.test(path)) path = path.replace(/\/[^/]+$/, "/");
    else if (!path.endsWith("/")) path = path + "/";
    if (!path.startsWith("/")) path = "/" + path;
    try {
      return new URL(clean, window.location.origin + path).href;
    } catch (err2) {
      try {
        return new URL(clean, window.location.href).href;
      } catch (err3) {
        return clean;
      }
    }
  }

  /**
   * Hero “Download” → correct PDF URL + native open in new tab (http).
   * Custom iframe / window.open PDF often shows an empty viewer; the browser handles PDF tabs better by default.
   * file: — same tab only (new tab + local PDF is unreliable).
   */
  var resumePdfBtn = document.querySelector(".btn-resume-download");
  if (resumePdfBtn) {
    var resumeRel = resumePdfBtn.getAttribute("href");
    if (resumeRel && /\.pdf($|\?|#)/i.test(resumeRel)) {
      resumePdfBtn.setAttribute("href", absoluteAssetUrl(resumeRel));
    }
    resumePdfBtn.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.location.protocol !== "file:") return;
      e.preventDefault();
      var h = resumePdfBtn.getAttribute("href");
      if (h) window.location.href = h;
    });
  }

  /** Single scroll frame: header state, back-to-top, scroll-spy */
  var sectionIds = ["hero", "experience", "skills", "projects", "education", "achievements", "contact"];
  var navAnchors = document.querySelectorAll("[data-nav-link]");

  function setActiveNav(id) {
    navAnchors.forEach(function (a) {
      var match = a.getAttribute("data-nav-link") === id;
      a.classList.toggle("is-active", match);
      var inMainNav = headerNav && headerNav.contains(a);
      if (inMainNav) {
        if (match) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function getActiveSectionId() {
    var y = window.scrollY + HEADER_OFFSET;
    var active = "hero";
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y + 40) active = id;
    });
    return active;
  }

  function onScrollFrame() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 80);
    if (backToTop) backToTop.classList.toggle("back-to-top--visible", y > 480);
    setActiveNav(getActiveSectionId());
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(requestScrollUpdate, 120);
  });
  requestScrollUpdate();

  function syncFromHash() {
    var h = (location.hash || "").replace("#", "");
    if (h && sectionIds.indexOf(h) !== -1) setActiveNav(h);
    else setActiveNav(getActiveSectionId());
  }
  window.addEventListener("hashchange", syncFromHash);
  syncFromHash();
  window.addEventListener("load", syncFromHash);

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      var prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      var hero = document.getElementById("hero");
      if (hero) hero.focus({ preventScroll: true });
    });
  }

  /** Smooth in-page navigation */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (HEADER_OFFSET - 24);
      var prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced ? "auto" : "smooth" });
      history.pushState(null, "", href);
      setActiveNav(href.replace("#", ""));
      if (target.getAttribute("tabindex") == null) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showToast(successMsg);
        },
        function () {
          showToast("Could not copy — select manually");
        }
      );
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(successMsg);
    } catch (err) {
      showToast("Could not copy — select manually");
    }
    document.body.removeChild(ta);
  }

  var contactLinksEl = document.querySelector(".contact-links");
  if (contactLinksEl) {
    contactLinksEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".contact-copy");
      if (!btn || !contactLinksEl.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      var text = btn.getAttribute("data-copy") || "";
      var msg = btn.getAttribute("data-toast") || "Copied to clipboard";
      copyText(text, msg);
    });
  }

  var ghMeta = document.querySelector('meta[name="github-profile"]');
  var ghUrl = ghMeta ? (ghMeta.getAttribute("content") || "").trim() : "";
  if (/^https?:\/\//i.test(ghUrl)) {
    var contactLinks = document.querySelector(".contact-links");
    if (contactLinks) {
      var ghRow = document.createElement("div");
      ghRow.className = "contact-row";
      var ghA = document.createElement("a");
      ghA.href = ghUrl;
      ghA.className = "contact-link";
      ghA.target = "_blank";
      ghA.rel = "noopener noreferrer";
      var ghIcon = document.createElement("span");
      ghIcon.className = "contact-link-icon";
      ghIcon.setAttribute("aria-hidden", "true");
      ghIcon.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>';
      var ghLabel = document.createElement("span");
      ghLabel.className = "contact-link-text";
      ghLabel.textContent = "GitHub";
      ghA.appendChild(ghIcon);
      ghA.appendChild(ghLabel);
      var ghCopy = document.createElement("button");
      ghCopy.type = "button";
      ghCopy.className = "contact-copy";
      ghCopy.setAttribute("data-copy", ghUrl);
      ghCopy.setAttribute("data-toast", "GitHub URL copied");
      ghCopy.setAttribute("aria-label", "Copy GitHub profile URL");
      ghCopy.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      ghRow.appendChild(ghA);
      ghRow.appendChild(ghCopy);
      contactLinks.appendChild(ghRow);
    }
    var ldEl = document.querySelector('script[type="application/ld+json"]');
    if (ldEl && ldEl.textContent) {
      try {
        var person = JSON.parse(ldEl.textContent);
        if (person && person["@type"] === "Person") {
          person.sameAs = person.sameAs || [];
          if (person.sameAs.indexOf(ghUrl) === -1) person.sameAs.push(ghUrl);
          ldEl.textContent = JSON.stringify(person);
        }
      } catch (e2) {}
    }
  }

  /** Hero: one rotating line after “I am a …” (includes full‑stack style roles) */
  var HERO_ROLES = [
    "software engineer",
    "full‑stack builder",
    "end‑to‑end product engineer",
    "web & mobile craftsperson",
    "product‑minded engineer",
    "real‑time UI specialist",
  ];

  function initHeroBannerRotate() {
    var roleEl = document.getElementById("hero-rotate-role");
    if (!roleEl || !HERO_ROLES.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var idx = 0;
    var swapMs = 300;
    var intervalMs = 4000;

    function advance() {
      idx = (idx + 1) % HERO_ROLES.length;
      roleEl.classList.add("hero-rotating--exit");
      window.setTimeout(function () {
        roleEl.textContent = HERO_ROLES[idx];
        roleEl.classList.remove("hero-rotating--exit");
      }, swapMs);
    }

    var timer = window.setInterval(advance, intervalMs);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearInterval(timer);
        timer = 0;
      } else if (!timer) {
        timer = window.setInterval(advance, intervalMs);
      }
    });
  }

  initHeroBannerRotate();

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { rootMargin: "0px 0px -48px 0px", threshold: 0.06 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }
})();
