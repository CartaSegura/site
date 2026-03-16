(function () {
  "use strict";

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", !expanded);
      navToggle.setAttribute("aria-label", expanded ? "Abrir menu" : "Fechar menu");
      nav.classList.toggle("is-open", !expanded);
      document.body.style.overflow = expanded ? "" : "hidden";
    });
  }

  // Close mobile menu when clicking an anchor link (smooth scroll is via CSS)
  var navLinks = document.querySelectorAll('.nav__list a[href^="#"]');
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        if (navToggle) {
          navToggle.setAttribute("aria-expanded", "false");
          navToggle.setAttribute("aria-label", "Abrir menu");
        }
        document.body.style.overflow = "";
      }
    });
  });
})();
