// vendor の js/plugins.js ・ js/bootstrap.min.js が提供するプラグインのうち、 src/ で使う部分の型です。
// skipLibCheck の対象外にして型検査するため、 .d.ts ではなく .ts で宣言します。

declare global {
  interface OwlCarouselOptions {
    items: number;
    margin: number;
    loop: boolean;
    dots: boolean;
    autoplay: boolean;
    autoplayTimeout: number;
    smartSpeed: number;
    animateIn?: string;
    animateOut?: string;
    center?: boolean;
    nav?: boolean;
    navText?: string[];
    responsive?: Record<number, { items: number }>;
  }

  interface IsotopeOptions {
    itemSelector?: string;
    percentPosition?: boolean;
    masonry?: { columnWidth: string };
    filter?: string | undefined;
  }

  interface ScrollUpOptions {
    scrollSpeed: number;
    easingType: string;
    scrollText: string;
  }

  interface JQuery {
    tooltip(): this;
    owlCarousel(options: OwlCarouselOptions): this;
    imagesLoaded(callback: () => void): this;
    isotope(options: IsotopeOptions): this;
    magnificPopup(options: { type: 'image' | 'iframe' }): this;
    matchHeight(options: { byRow: boolean; property: string }): this;
    counterUp(options: { delay: number; time: number }): this;
  }

  interface JQueryStatic {
    scrollUp(options: ScrollUpOptions): void;
  }

  interface Window {
    WOW: new () => { init(): void };
  }
}

export {};
