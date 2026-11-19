import { describe, expect, it, vi } from 'vitest';
import { initActive } from '../src/lib/active';
import { createWindow, wait, type TestWindow } from './helpers/dom';

const body = `
<div id="preloader"></div>
<header class="header-area"></header>
<div class="full_height"></div>
<div class="hero-slides"></div>
<div class="hero-post-slide"></div>
<div class="world-catagory-slider"></div>
<div class="world-catagory-slider2"></div>
<span data-toggle="tooltip" title="tip"></span>
<div class="portfolio-menu">
  <button class="btn active" data-filter="*">All</button>
  <button class="btn" data-filter=".news">News</button>
</div>
<div class="sonar-portfolio"></div>
<a class="gallery-img" href="img/sample/95x95.jpg"></a>
<a class="video-btn" href="https://www.youtube.com/watch?v=example"></a>
<div class="equalize"></div>
<span class="counter">100</span>
<a href="#" id="hash-link">hash</a>
<a href="other.html" id="normal-link">normal</a>
<div id="search-wrapper"><input id="search"><span id="close-icon"></span></div>
`;

interface PluginCall {
  readonly plugin: string;
  readonly selectorTargets: string[];
  readonly options: unknown;
}

/**
 * plugins.js と bootstrap.min.js が提供するプラグインを記録用のスタブに置き換えます。
 */
function installPluginStubs(win: TestWindow): { calls: PluginCall[]; wowInit: ReturnType<typeof vi.fn> } {
  const $ = win.jQuery;
  const calls: PluginCall[] = [];
  const targetsOf = (elements: JQuery): string[] =>
    elements.toArray().map((element) => element.className || element.id || element.tagName);
  const stub = (plugin: string) =>
    function (this: JQuery, options?: unknown): JQuery {
      calls.push({ plugin, selectorTargets: targetsOf(this), options });
      return this;
    };
  const fn = $.fn as unknown as Record<string, unknown>;
  for (const plugin of ['owlCarousel', 'tooltip', 'magnificPopup', 'matchHeight', 'counterUp', 'isotope']) {
    fn[plugin] = stub(plugin);
  }
  fn.imagesLoaded = function (this: JQuery, callback: () => void): JQuery {
    callback();
    return this;
  };
  fn.scrollUp = () => undefined;
  ($ as unknown as Record<string, unknown>).scrollUp = (options: unknown) => {
    calls.push({ plugin: 'scrollUp', selectorTargets: [], options });
  };
  const wowInit = vi.fn();
  win.WOW = class {
    init = wowInit;
  };
  return { calls, wowInit };
}

function setViewport(win: TestWindow, width: number, height: number): void {
  Object.defineProperty(win.document.documentElement, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(win.document.documentElement, 'clientHeight', { configurable: true, value: height });
}

// jsdom は scrollTo を実装していないため、 jQuery が参照する pageYOffset を直接設定します。
function setScrollY(win: TestWindow, y: number): void {
  Object.defineProperty(win, 'pageYOffset', { configurable: true, value: y });
}

function setup(width = 1280, height = 720) {
  const win = createWindow(body);
  setViewport(win, width, height);
  const stubs = installPluginStubs(win);
  initActive(win.jQuery, win);
  return { win, $: win.jQuery, ...stubs };
}

function optionsOf(calls: PluginCall[], plugin: string, target: string): unknown {
  return calls.find((call) => call.plugin === plugin && call.selectorTargets.includes(target))?.options;
}

describe('initActive', () => {
  it('load イベントでプリローダーを削除します', () => {
    const { win, $ } = setup();
    expect($('#preloader')).toHaveLength(1);

    $(win).trigger('load');

    expect($('#preloader')).toHaveLength(0);
  });

  it('リサイズ後 300 ms で .full_height をウィンドウの高さに揃えます', async () => {
    const { $ } = setup(1280, 640);
    expect($('.full_height').height()).toBe(0);

    await wait(350);

    expect($('.full_height').height()).toBe(640);
  });

  it('スクロール量が 20 px を超えるとヘッダーを固定表示します', () => {
    const { win, $ } = setup();

    setScrollY(win, 21);
    $(win).trigger('scroll');
    expect($('.header-area').hasClass('sticky')).toBe(true);

    setScrollY(win, 20);
    $(win).trigger('scroll');
    expect($('.header-area').hasClass('sticky')).toBe(false);
  });

  it('ツールチップとカルーセルを従来の設定で初期化します', () => {
    const { calls } = setup();

    expect(calls.some((call) => call.plugin === 'tooltip' && call.selectorTargets.length === 1)).toBe(true);
    expect(optionsOf(calls, 'owlCarousel', 'hero-slides')).toEqual({
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
    expect(optionsOf(calls, 'owlCarousel', 'hero-post-slide')).toEqual({
      items: 3,
      margin: 30,
      loop: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 3500,
      smartSpeed: 1000,
      center: true,
      responsive: { 0: { items: 1 }, 768: { items: 3 } },
    });
    const sliderOptions = {
      items: 1,
      margin: 0,
      loop: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 3500,
      smartSpeed: 2000,
      nav: true,
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
    };
    expect(optionsOf(calls, 'owlCarousel', 'world-catagory-slider')).toEqual(sliderOptions);
    expect(optionsOf(calls, 'owlCarousel', 'world-catagory-slider2')).toEqual(sliderOptions);
  });

  it('その他のプラグインを従来の設定で初期化します', () => {
    const { calls } = setup();

    expect(optionsOf(calls, 'isotope', 'sonar-portfolio')).toEqual({
      itemSelector: '.single_gallery_item',
      percentPosition: true,
      masonry: { columnWidth: '.single_gallery_item' },
    });
    expect(optionsOf(calls, 'magnificPopup', 'gallery-img')).toEqual({ type: 'image' });
    expect(optionsOf(calls, 'magnificPopup', 'video-btn')).toEqual({ type: 'iframe' });
    expect(optionsOf(calls, 'matchHeight', 'equalize')).toEqual({ byRow: true, property: 'height' });
    expect(optionsOf(calls, 'counterUp', 'counter')).toEqual({ delay: 10, time: 2000 });
    expect(calls.find((call) => call.plugin === 'scrollUp')?.options).toEqual({
      scrollSpeed: 1000,
      easingType: 'easeInOutQuart',
      scrollText: '<i class="fa fa-angle-up" aria-hidden="true"></i>',
    });
  });

  it('プラグインが読み込まれていないページでもエラーになりません', () => {
    const win = createWindow(body);
    const fn = win.jQuery.fn as unknown as Record<string, unknown>;
    fn.tooltip = function (this: JQuery): JQuery {
      return this;
    };
    win.WOW = class {
      init = vi.fn();
    };

    expect(() => {
      initActive(win.jQuery, win);
    }).not.toThrow();
  });

  it('ポートフォリオのボタンを押すと active を切り替えて Isotope で絞り込みます', () => {
    const { $, calls } = setup();

    $('.portfolio-menu button[data-filter=".news"]').trigger('click');

    expect($('.portfolio-menu button.active').attr('data-filter')).toBe('.news');
    expect(calls.filter((call) => call.plugin === 'isotope').at(-1)?.options).toEqual({ filter: '.news' });
  });

  it('href="#" のリンクだけクリック時の既定動作を止めます', () => {
    const { win } = setup();
    const click = (id: string): boolean => {
      const event = new win.MouseEvent('click', { bubbles: true, cancelable: true });
      win.document.getElementById(id)?.dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(click('hash-link')).toBe(true);
    expect(click('normal-link')).toBe(false);
  });

  it('幅が 767 px を超えるときだけ WOW を初期化します', () => {
    expect(setup(768).wowInit).toHaveBeenCalledTimes(1);
    expect(setup(767).wowInit).not.toHaveBeenCalled();
  });

  it('検索欄のフォーカスで展開し、ブラーで閉じます', () => {
    const { win } = setup();
    const search = win.document.getElementById('search');
    const wrapper = win.document.getElementById('search-wrapper');
    const closeIcon = win.document.getElementById('close-icon');
    if (search === null || wrapper === null || closeIcon === null) throw new Error('検索欄がありません。');

    search.dispatchEvent(new win.FocusEvent('focus'));
    search.dispatchEvent(new win.Event('transitionend'));
    expect(wrapper.classList.contains('search-expanded')).toBe(true);
    expect(closeIcon.style.display).toBe('block');

    search.dispatchEvent(new win.FocusEvent('blur'));
    expect(wrapper.classList.contains('search-expanded')).toBe(false);
    expect(closeIcon.classList.contains('closing')).toBe(true);
    search.dispatchEvent(new win.Event('transitionend'));
    expect(closeIcon.classList.contains('closing')).toBe(false);
    expect(closeIcon.style.display).toBe('none');
  });

  it('閉じるアイコンを押すとフォーカスを外し、 1 秒後に closing を外します', async () => {
    const { win } = setup();
    const search = win.document.getElementById('search');
    const closeIcon = win.document.getElementById('close-icon');
    if (search === null || closeIcon === null) throw new Error('検索欄がありません。');
    search.focus();
    expect(win.document.activeElement).toBe(search);

    closeIcon.dispatchEvent(new win.MouseEvent('click'));

    expect(win.document.activeElement).not.toBe(search);
    expect(closeIcon.classList.contains('closing')).toBe(true);
    await wait(1050);
    expect(closeIcon.classList.contains('closing')).toBe(false);
  });
});
