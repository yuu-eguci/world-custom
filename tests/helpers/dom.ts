import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const jquerySource = readFileSync(new URL('../../js/jquery/jquery-2.2.4.min.js', import.meta.url), 'utf8');

export type TestWindow = Window & typeof globalThis & { jQuery: JQueryStatic };

/**
 * 本番と同じ vendor の jQuery 2.2.4 を読み込んだ jsdom の window を作ります。
 */
export function createWindow(body: string): TestWindow {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${body}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.eval(jquerySource);
  const win = dom.window as unknown as TestWindow;
  // アニメーションを即時に完了させます。
  win.jQuery.fx.off = true;
  return win;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
