import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  'my-index.html',
  'my-post-list.html',
  'my-single-blog.html',
  'index.html',
  'catagory.html',
  'single-blog.html',
  'regular-page.html',
  'contact.html',
];

/**
 * google.maps の必要な部分だけを持つモックです。呼び出しを window.__mapsMock に記録します。
 */
const MAPS_MOCK = `
window.__mapsMock = { maps: [], markers: [], mapTypeIds: [] };
window.google = { maps: {
  LatLng: class { constructor(lat, lng) { this.lat = lat; this.lng = lng; } },
  Map: class {
    constructor(element, options) {
      this.mapTypes = { set: () => undefined };
      window.__mapsMock.maps.push({ elementId: element.id, zoom: options.zoom });
    }
    setCenter(center) { this.center = center; }
    getCenter() { return this.center; }
    setMapTypeId(id) { window.__mapsMock.mapTypeIds.push(id); }
  },
  Geocoder: class {
    geocode(request, callback) {
      callback([{ geometry: { location: { lat: 56.9496, lng: 24.1052 } } }], 'OK');
      return Promise.resolve();
    }
  },
  Marker: class { constructor(options) { window.__mapsMock.markers.push(options.position); } },
  StyledMapType: class {},
  MapTypeId: { ROADMAP: 'roadmap' },
  GeocoderStatus: { OK: 'OK' },
  Animation: { BOUNCE: 1 },
} };
`;

interface PageWatch {
  readonly blocked: string[];
  readonly errors: string[];
}

/**
 * サイト以外へのリクエストをすべて遮断し、ページの JavaScript エラーを記録します。
 */
async function watchPage(page: Page, baseURL: string): Promise<PageWatch> {
  const origin = new URL(baseURL).origin;
  const watch: PageWatch = { blocked: [], errors: [] };
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) {
      await route.continue();
      return;
    }
    watch.blocked.push(url);
    await route.abort('blockedbyclient');
  });
  page.on('pageerror', (error) => {
    watch.errors.push(error.message);
  });
  return watch;
}

test.describe('静的サイト', () => {
  let watch: PageWatch;

  test.beforeEach(async ({ page, baseURL }) => {
    watch = await watchPage(page, baseURL ?? '');
  });

  test.afterEach(() => {
    // 遮断したリクエストは記録だけ行い、サイト外へは送りません。
    expect(watch.errors).toEqual([]);
  });

  for (const path of PAGES) {
    test(`${path} を表示してプリローダーを消します`, async ({ page }) => {
      const response = await page.goto(`/${path}`);

      expect(response?.status()).toBe(200);
      await expect(page.locator('#preloader')).toHaveCount(0);
      await expect(page.locator('.header-area')).toBeVisible();
      expect(await page.evaluate(() => typeof (window as unknown as { jQuery: unknown }).jQuery)).toBe('function');
    });
  }

  test('ルートで index.html を返します', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('World - Blog &amp; Magazine Template');
  });

  test('CSS ・フォント・画像・ vendor ファイルを配信します', async ({ request }) => {
    for (const path of [
      '/style.css',
      '/css/bootstrap.min.css',
      '/fonts/fontawesome-webfont.woff2',
      '/fonts/themify.woff',
      '/img/core-img/logo.png',
      '/img/sample/1920x1280.jpg',
      '/favicon.ico',
      '/vendor/github-markdown.css',
      '/vendor/highlight/highlight.pack.js',
      '/js/plugins.js',
      '/js/active.js',
      '/js/map-active.js',
    ]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });

  test('外部のフォントへのリクエストを遮断します', async ({ page }) => {
    await page.goto('/my-index.html');

    expect(watch.blocked.some((url) => url.startsWith('https://fonts.googleapis.com/'))).toBe(true);
  });

  test('スクロールするとヘッダーを固定表示します', async ({ page }) => {
    await page.goto('/my-post-list.html');
    await expect(page.locator('.header-area')).not.toHaveClass(/sticky/);

    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });

    await expect(page.locator('.header-area')).toHaveClass(/sticky/);
  });

  test('検索欄をフォーカスで展開し、ブラーで閉じます', async ({ page }) => {
    await page.goto('/my-index.html');
    const wrapper = page.locator('#search-wrapper');

    await page.locator('#search').focus();
    await expect(wrapper).toHaveClass(/search-expanded/);
    await expect(page.locator('#close-icon')).toBeVisible();

    await page.locator('#search').blur();
    await expect(wrapper).not.toHaveClass(/search-expanded/);
    await expect(page.locator('#close-icon')).toBeHidden();
  });

  test('href="#" のリンクを押してもページを移動しません', async ({ page }) => {
    await page.goto('/my-index.html');

    await page.locator('a[href="#"]:visible').first().click();

    expect(new URL(page.url()).hash).toBe('');
  });

  test('index.html のカルーセルを初期化します', async ({ page }) => {
    await page.goto('/index.html');

    await expect(page.locator('.hero-slides')).toHaveClass(/owl-loaded/);
    await expect(page.locator('.hero-post-slide')).toHaveClass(/owl-loaded/);
    await expect(page.locator('.world-catagory-slider')).toHaveClass(/owl-loaded/);
  });

  test('my-single-blog.html のコードをハイライトします', async ({ page }) => {
    await page.goto('/my-single-blog.html');

    await expect(page.locator('pre code.hljs').first()).toBeVisible();
  });

  test('contact.html は初期状態で Google Maps を読み込みません', async ({ page }) => {
    await page.goto('/contact.html');

    await expect(page.locator('#googleMap')).toHaveCount(0);
    expect(watch.blocked.filter((url) => url.includes('maps.googleapis.com'))).toEqual([]);
    expect(await page.content()).toContain('maps/api/js?key=YOUR_API_KEY');
  });

  test('map-active.js はモックの Google Maps で地図とマーカーを作ります', async ({ page }) => {
    await page.goto('/contact.html');
    // contact.html のコメントアウトを外した状態を再現します。
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('beforeend', '<div class="map-area"><div id="googleMap" class="googleMap"></div></div>');
    });

    await page.addScriptTag({ content: MAPS_MOCK });
    await page.addScriptTag({ url: '/js/map-active.js' });

    expect(await page.evaluate(() => (window as unknown as { __mapsMock: unknown }).__mapsMock)).toEqual({
      maps: [{ elementId: 'googleMap', zoom: 15 }],
      markers: [{ lat: 56.9496, lng: 24.1052 }],
      mapTypeIds: ['gMap'],
    });
  });
});
