world-custom
===

Colorlib の World テンプレート (ブログ・マガジン向け) をカスタマイズした静的サイトです。

- Docker: 対応!
- Node.js: 26 (TypeScript のビルド・ lint ・テスト用)
- TypeScript: 6.0
- Linter: ESLint 10 + typescript-eslint 8
- Test: Vitest 5 + jsdom (ユニットテスト), Playwright 1.65 (e2e テスト)
- jQuery 2.2.4 ・ Bootstrap 4.0.0 (どちらも vendor ファイルとして同梱)

## パッと実行してみたい

ホストに Node.js は不要です。 Docker だけで動きます。

```bash
# ビルドして起動します (ヘルスチェックが通るまで待ちます)
docker compose up --build --detach --wait web

# ブラウザで http://localhost:8080/my-index.html を開きます

# 停止します
docker compose down
```

ポートを変えたいときは `WEB_PORT=8081 docker compose up --build --detach --wait web` のように指定します。

## ページ

| パス | 内容 |
| --- | --- |
| `/my-index.html` | カスタマイズしたトップページ |
| `/my-post-list.html` | カスタマイズした記事一覧 |
| `/my-single-blog.html` | カスタマイズした記事ページ (highlight.js でコードをハイライトします) |
| `/index.html` ( `/` ) | テンプレートのトップページ |
| `/catagory.html` ・ `/single-blog.html` ・ `/regular-page.html` ・ `/contact.html` | テンプレートの各ページ |

## ディレクトリ構成

| パス | 内容 |
| --- | --- |
| `src/` | first-party の TypeScript です。 `npm run build` で `js/active.js` ・ `js/map-active.js` を生成します |
| `js/active.js` ・ `js/map-active.js` | `src/` から生成したファイルです。 HTML を直接開いても動くようにコミットしています。直接編集しません |
| `js/` のその他 ・ `css/` ・ `fonts/` ・ `vendor/` | vendor ファイルです |
| `style.css` | サイトのスタイルです。直接編集しています。 `scss/` はテンプレート由来のソースで、ビルドには使いません |
| `tests/` | Vitest のユニットテストです。 jsdom 上で vendor の jQuery を読み込んで検証します |
| `e2e/` | Playwright の e2e テストです |
| `Bulk.py` | HTML のインデントを一括置換したときのスクリプトです。ビルドには使いません |

## 開発

コマンドはすべて Docker で実行します。

```bash
# lint ・型チェック・ユニットテストを実行します
docker compose run --rm --build dev npm run check

# src/ をビルドして js/active.js ・ js/map-active.js を更新します
docker compose run --rm --build dev npm run build

# e2e テストを実行します (web を起動してからブラウザで検証します)
docker compose --profile e2e run --rm --build e2e
docker compose --profile e2e down
```

e2e テストのコンテナは外部へ通信できない Docker ネットワークで動きます。テスト内でもサイト以外へのリクエストを遮断し、 Google Maps はローカルのモックに置き換えます。

## Google Maps

`contact.html` の地図は、テンプレートと同じく初期状態では無効です。使うときは `contact.html` にある Google Maps 用の 2 か所のコメントアウト (地図の `div` と script タグ) を外し、 `YOUR_API_KEY` を自分の Maps JavaScript API キーに置き換えます。 API キーには HTTP リファラ制限をかけておきます。
