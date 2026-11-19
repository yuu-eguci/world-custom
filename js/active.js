/* src/ から npm run build で生成したファイルです。直接編集しません。 */
"use strict";
(() => {
  // src/lib/active.ts
  var RESIZE_END_DELAY_MS = 300;
  var STICKY_SCROLL_TOP = 20;
  var WOW_MIN_WIDTH = 767;
  var CLOSE_ICON_CLOSING_MS = 1e3;
  function initActive($, win) {
    const $window = $(win);
    $window.on("load", () => {
      $("#preloader").fadeOut("slow", function() {
        $(this).remove();
      });
    });
    $window.on("resizeEnd", () => {
      const height = $window.height();
      if (height !== void 0) {
        $(".full_height").height(height);
      }
    });
    let resizeTimer;
    $window.on("resize", () => {
      win.clearTimeout(resizeTimer);
      resizeTimer = win.setTimeout(() => {
        $window.trigger("resizeEnd");
      }, RESIZE_END_DELAY_MS);
    }).trigger("resize");
    $window.on("scroll", () => {
      const scrollTop = $window.scrollTop() ?? 0;
      $(".header-area").toggleClass("sticky", scrollTop > STICKY_SCROLL_TOP);
    });
    $('[data-toggle="tooltip"]').tooltip();
    if ("owlCarousel" in $.fn) {
      $(".hero-slides").owlCarousel({
        items: 1,
        margin: 0,
        loop: true,
        dots: false,
        autoplay: true,
        autoplayTimeout: 7e3,
        smartSpeed: 2e3,
        animateIn: "fadeIn",
        animateOut: "fadeOut"
      });
      $(".hero-post-slide").owlCarousel({
        items: 3,
        margin: 30,
        loop: true,
        dots: false,
        autoplay: true,
        autoplayTimeout: 3500,
        smartSpeed: 1e3,
        center: true,
        responsive: {
          0: { items: 1 },
          768: { items: 3 }
        }
      });
      $(".world-catagory-slider, .world-catagory-slider2").owlCarousel({
        items: 1,
        margin: 0,
        loop: true,
        dots: false,
        autoplay: true,
        autoplayTimeout: 3500,
        smartSpeed: 2e3,
        nav: true,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
      });
    }
    $(".portfolio-menu button.btn").on("click", (event) => {
      $(".portfolio-menu button.btn").removeClass("active");
      $(event.currentTarget).addClass("active");
    });
    if ("imagesLoaded" in $.fn) {
      $(".sonar-portfolio").imagesLoaded(() => {
        const $grid = $(".sonar-portfolio").isotope({
          itemSelector: ".single_gallery_item",
          percentPosition: true,
          masonry: { columnWidth: ".single_gallery_item" }
        });
        $(".portfolio-menu").on("click", "button", (event) => {
          $grid.isotope({ filter: $(event.currentTarget).attr("data-filter") });
        });
      });
    }
    if ("magnificPopup" in $.fn) {
      $(".gallery-img").magnificPopup({ type: "image" });
      $(".video-btn").magnificPopup({ type: "iframe" });
    }
    if ("matchHeight" in $.fn) {
      $(".equalize").matchHeight({ byRow: true, property: "height" });
    }
    if ("counterUp" in $.fn) {
      $(".counter").counterUp({ delay: 10, time: 2e3 });
    }
    if ("scrollUp" in $.fn) {
      $.scrollUp({
        scrollSpeed: 1e3,
        easingType: "easeInOutQuart",
        scrollText: '<i class="fa fa-angle-up" aria-hidden="true"></i>'
      });
    }
    $("a[href='#']").on("click", (event) => {
      event.preventDefault();
    });
    if (($window.width() ?? 0) > WOW_MIN_WIDTH) {
      new win.WOW().init();
    }
    initSearch(win);
  }
  function initSearch(win) {
    const doc = win.document;
    const search = doc.getElementById("search");
    const searchWrapper = doc.getElementById("search-wrapper");
    const closeIcon = doc.getElementById("close-icon");
    if (search === null || searchWrapper === null || closeIcon === null) {
      return;
    }
    search.addEventListener("focus", () => {
      searchWrapper.classList.add("search-expanded");
    });
    search.addEventListener("blur", () => {
      searchWrapper.classList.remove("search-expanded");
      closeIcon.classList.add("closing");
    });
    search.addEventListener("transitionend", () => {
      if (searchWrapper.classList.contains("search-expanded")) {
        closeIcon.style.display = "block";
      } else {
        closeIcon.classList.remove("closing");
        closeIcon.style.display = "none";
      }
    });
    closeIcon.addEventListener("click", () => {
      closeIcon.classList.add("closing");
      const active = doc.activeElement;
      if (active instanceof win.HTMLElement) {
        active.blur();
      }
      win.setTimeout(() => {
        closeIcon.classList.remove("closing");
      }, CLOSE_ICON_CLOSING_MS);
    });
  }

  // src/active.ts
  initActive(jQuery, window);
})();
