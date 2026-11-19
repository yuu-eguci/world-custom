const RESIZE_END_DELAY_MS = 300;
const STICKY_SCROLL_TOP = 20;
const WOW_MIN_WIDTH = 767;
const CLOSE_ICON_CLOSING_MS = 1000;

/**
 * 全ページ共通の UI (プリローダー・固定ヘッダー・各プラグイン・検索欄) を初期化します。
 * プラグインは、そのページで読み込まれているものだけを初期化します。
 */
export function initActive($: JQueryStatic, win: Window & typeof globalThis): void {
  const $window = $(win);

  // プリローダー
  $window.on('load', () => {
    $('#preloader').fadeOut('slow', function () {
      $(this).remove();
    });
  });

  // フルスクリーン: リサイズが落ち着いたら .full_height をウィンドウの高さに揃えます。
  $window.on('resizeEnd', () => {
    const height = $window.height();
    if (height !== undefined) {
      $('.full_height').height(height);
    }
  });
  let resizeTimer: number | undefined;
  $window
    .on('resize', () => {
      win.clearTimeout(resizeTimer);
      resizeTimer = win.setTimeout(() => {
        $window.trigger('resizeEnd');
      }, RESIZE_END_DELAY_MS);
    })
    .trigger('resize');

  // 固定ヘッダー
  $window.on('scroll', () => {
    const scrollTop = $window.scrollTop() ?? 0;
    $('.header-area').toggleClass('sticky', scrollTop > STICKY_SCROLL_TOP);
  });

  // ツールチップ
  $('[data-toggle="tooltip"]').tooltip();

  // Owl Carousel
  if ('owlCarousel' in $.fn) {
    $('.hero-slides').owlCarousel({
      items: 1,
      margin: 0,
      loop: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 7000,
      smartSpeed: 2000,
      animateIn: 'fadeIn',
      animateOut: 'fadeOut',
    });

    $('.hero-post-slide').owlCarousel({
      items: 3,
      margin: 30,
      loop: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 3500,
      smartSpeed: 1000,
      center: true,
      responsive: {
        0: { items: 1 },
        768: { items: 3 },
      },
    });

    $('.world-catagory-slider, .world-catagory-slider2').owlCarousel({
      items: 1,
      margin: 0,
      loop: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 3500,
      smartSpeed: 2000,
      nav: true,
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
    });
  }

  // ギャラリーのメニュー
  $('.portfolio-menu button.btn').on('click', (event) => {
    $('.portfolio-menu button.btn').removeClass('active');
    $(event.currentTarget).addClass('active');
  });

  // Masonry ギャラリー
  if ('imagesLoaded' in $.fn) {
    $('.sonar-portfolio').imagesLoaded(() => {
      const $grid = $('.sonar-portfolio').isotope({
        itemSelector: '.single_gallery_item',
        percentPosition: true,
        masonry: { columnWidth: '.single_gallery_item' },
      });
      $('.portfolio-menu').on('click', 'button', (event) => {
        $grid.isotope({ filter: $(event.currentTarget).attr('data-filter') });
      });
    });
  }

  // Magnific Popup
  if ('magnificPopup' in $.fn) {
    $('.gallery-img').magnificPopup({ type: 'image' });
    $('.video-btn').magnificPopup({ type: 'iframe' });
  }

  // MatchHeight
  if ('matchHeight' in $.fn) {
    $('.equalize').matchHeight({ byRow: true, property: 'height' });
  }

  // CounterUp
  if ('counterUp' in $.fn) {
    $('.counter').counterUp({ delay: 10, time: 2000 });
  }

  // ScrollUp
  if ('scrollUp' in $.fn) {
    $.scrollUp({
      scrollSpeed: 1000,
      easingType: 'easeInOutQuart',
      scrollText: '<i class="fa fa-angle-up" aria-hidden="true"></i>',
    });
  }

  // href="#" のリンクではページ先頭へ移動しません。
  $("a[href='#']").on('click', (event) => {
    event.preventDefault();
  });

  // WOW
  if (($window.width() ?? 0) > WOW_MIN_WIDTH) {
    new win.WOW().init();
  }

  initSearch(win);
}

/**
 * 検索欄をフォーカスで展開し、ブラーで閉じます。
 */
function initSearch(win: Window & typeof globalThis): void {
  const doc = win.document;
  const search = doc.getElementById('search');
  const searchWrapper = doc.getElementById('search-wrapper');
  const closeIcon = doc.getElementById('close-icon');
  if (search === null || searchWrapper === null || closeIcon === null) {
    return;
  }

  search.addEventListener('focus', () => {
    searchWrapper.classList.add('search-expanded');
  });
  search.addEventListener('blur', () => {
    searchWrapper.classList.remove('search-expanded');
    closeIcon.classList.add('closing');
  });
  // 展開・収納のトランジションが終わってから、閉じるアイコンを表示・非表示にします。
  search.addEventListener('transitionend', () => {
    if (searchWrapper.classList.contains('search-expanded')) {
      closeIcon.style.display = 'block';
    } else {
      closeIcon.classList.remove('closing');
      closeIcon.style.display = 'none';
    }
  });
  closeIcon.addEventListener('click', () => {
    closeIcon.classList.add('closing');
    const active = doc.activeElement;
    if (active instanceof win.HTMLElement) {
      active.blur();
    }
    win.setTimeout(() => {
      closeIcon.classList.remove('closing');
    }, CLOSE_ICON_CLOSING_MS);
  });
}
