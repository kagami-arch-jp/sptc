# SPTC - Simple Pretreat Toolkit CLI

軽量なテンプレートエンジンとHTTPサーバーフレームワーク。

## 機能概要

SPTCはPHP类似的テンプレートエンジンで、`<?js ... ?>`構文を使用してテンプレートファイルにJavaScriptコードを埋め込んで実行できます。また組み込みのFastCGI HTTPサーバーも提供します。

## インストール

```bash
npm install -g sptc
```

またはローカルインストール:

```bash
npm install
```

## クイックスタート

### 1. コマンドラインで単一ファイル実行

```bash
sptc filename.s
sptc filename.s -d DEFINE1,DEFINE2  # マクロ定義を渡す
```

### 2. HTTPサーバー起動

```bash
sptcd -p 9090 -w ./public
```

## ファイル形式

SPTCテンプレートファイルは`<?js`と`?>`でJavaScriptコードを囲み、残りの内容をテキスト出力として使用します。

```sptc
<?js
  const name = 'World';
  const now = new Date();
?>
<!DOCTYPE html>
<html>
<head>
  <title>Hello <?js echo(name) ?></title>
</head>
<body>
  <h1>Hello, <?js echo(name) ?>!</h1>
  <p>Current time: <?js echo(now.toISOString()) ?></p>
</body>
</html>
```

### 同等形式

```sptc
<?js echo('Hello, World!') ?>
```

`<?js ... ?>`タグ間のコードはJavaScriptとして実行され、タグ外のテキストは文字列として`echo()`関数に渡されます。

## 組み込み関数と変数

### 出力

```sptc
<?js
echo('Hello World');           // テキスト出力
flush();                   // 直ちに出力バッファをフラッシュ
var_dump(obj);             // オブジェクト構造をデバッグ出力
?>
```

### ファイルインクルード

```sptc
<?js
// 別のSPTCテンプレートファイルをインクルード
const data = include('./footer.s');

// JavaScriptファイルをインクルード
// include_jsはmodule.exportsだけでなく、全域変数とexports.xxxもエクスポートします
const utils = include_js('./utils.js');
// utils.add()      <- module.exports由来
// utils.sub()      <- 全域関数由来
// utils.mul()      <- exports.mul由来
?>
```

**include_jsの特殊性**

`include_js(filename, payload?)`は指定したJSファイルをロードし、マージされたオブジェクトを返します:
- `module.exports`でエクスポートされたプロパティ
- ファイル内の全域関数/変数宣言
- `exports.xxx`でエクスポートされたプロパティ

これにより、インクルードされたJSファイルは複数の方法でコンテンツをエクスポートできます:

```javascript
// utils.js の例

// 1. module.exports エクスポート
module.exports = {
  add: (a, b) => a + b,
};

// 2. 全域関数宣言 (全域変数になります)
function sub(a, b) {
  return a - b;
}

// 3. exports.xxx エクスポート
exports.mul = (x, y) => x * y;
```

`include_js`を使用すると、すべてのメソッドがエクスポートされます:
```sptc
<?js
const utils = include_js('./utils.js');
utils.add(1, 2);  // 3
utils.sub(3, 1);  // 2
utils.mul(2, 3);  // 6
?>
```

### マクロ定義

```sptc
<?js
// 定数を定義（重複定義はエラーをスロー）
define('MY_CONST', 'value');

// 定義した定数を取得
echo(MY_CONST);
?>
```

### 非同期同期キュー (Sync.Push)

デフォルトでは、非同期ロジックは応答をブロックしません - メロジック実行完了後 直ちにレスポンスを返し、効率を向上させます。

非同期ロジック完了後にレスポンスを返す必要がある場合は、`Sync.Push`を使用してPromiseを同期キューに追加します。システムはレスポンス送信前にキュー内のすべてのPromiseの完了を待ちます。

```sptc
<?js
// デフォルト：非同期操作はレスポンスをブロックしない
setTimeout(_ => console.log('async'), 1000);
// メロジック実行完了後 直ちにレスポンスを返す、setTimeoutを待ちません

// 非同期完了を待つ必要がある場合：
Sync.Push((async () => {
  await new Promise(r => setTimeout(r, 1000));
  echo('Async done');
})());
//  теперь будет ждать завершения Promise перед отправкой ответа
?>
```

### 非同期ロック (Sync.Lock)

レスポンス送信タイミングを制御するために使用します。`release()`を呼び出した後、システムはレスポンスを送信します。

```sptc
<?js
// release 関数を取得
const release = Sync.Lock();

// 非同期操作を実行
(async () => {
  await doSomething();
  // 完了後 release() を呼び出してレスポンスを送信
  release();
})();

// キューに複数のタスクを追加，也可以添加到队列中
Sync.Push((async () => {
  await anotherTask();
})());

echo('Response will be sent after release() is called');
?>
```

使用场景：データベースクエリ、外部API呼び出しなどの非同期タスクの結果をフロントに返す必要がある場合に使用します。

### 遅延実行

```sptc
<?js
defer(() => {
  // メロジック実行完了後に実行
  console.log('Cleanup here');
});
?>
```

### キャッシュ設定

```sptc
<?js
// キャッシュバージョンと有効期限を設定
configSptcFileCache('v1', 60);
?>
```

### オートロード

```sptc
<?js
// オートロード関数を設定
__autoload(name => {
  if (name.startsWith('Model_')) {
    return './models/' + name + '.s';
  }
});

// 使用時にロード
const user = Model_User;
?>
```

### 動的実行

```sptc
<?js
// JSコードを動的に実行
eval('const x = 1 + 1');
echo(x);
?>
```

### モジュールインポート

```sptc
<?js
// ES Module インポート
const pkg = await import('./package.json');
?>
```

## ビルドイン変数 (Context)

### リクエスト関連

```sptc
<?js
echo($_RAW_REQUEST.url);           // 要求オブジェクト
echo($_REQUEST_FILE.fullname);    // 要求ファイルのフルパス
echo($_REQUEST_FILE.pathname);     // 要求パス
echo($_QUERY.param);              // クエリパラメータ
echo($_PATHNAME);               //現在のパス
echo($_WORKDIR);                 // ワークディレクトリ
echo($_GLOBAL.x);                // 全域変数
echo($_ENV.NODE_ENV);            // 環境変数
?>
```

### レスポンス関連

```sptc
<?js
setStatus(404, 'Not Found');              // HTTPステータスコードを設定
setResponseHeaders({'X-Custom': 'value'}); // レスポンスヘッダーを設定
flushHeader();                          // 直ちにレスポンスヘッダーを送信
sendFile('./file.pdf');                   // ファイルを送信
echo(getResponseStatus());                // ステータスを取得
echo(getResponseHeaders());              // レスポンスヘッダーを取得
?>
```

### デバッグ関連

```sptc
<?js
setDebug(true);   // デバッグモードを有効化
isDebug();        // デバッグモードかどうかを確認
?>
```

### キャッシュ

```sptc
<?js
// キャッシュストレージを作成
const cached = withCache(() => {
  return computeExpensiveValue();
}, 'cache_key', 'v1');
?>
```

### エクスポート

```sptc
<?js
// モジュールをエクスポート（includeで使用）
exports({
  getData: () => 'data',
  version: '1.0',
});
?>
```

### 全域オブジェクト

```sptc
<?js
// アプリケーション全域オブジェクト
Application.myData = 'value';
?>
```

### ユーティリティ関数

```sptc
<?js
// アサーション
assert(condition, 'error message');

// Utils モジュール
Utils.generate_uuid();
Utils.fileExists(path);
Utils.md5(content);
?>
```

### 定数

```sptc
<?js
echo(__SPTC_VERSION__);      // SPTC バージョン
echo(__SPTC_INSTALL_PATH__);  // インストールパス
echo(__filename);            // 現在のファイル名
echo(__dirname);           // 現在のディレクトリ
echo(__filefullname);       // フルパス
?>
```

## マクロプリプロセス指示

ファイルの先頭でマクロ指示を使用:

```sptc
#def DEBUG

#ifdef DEBUG
console.log('Debug mode');
#endif

#ifndef PROD
echo('Development mode');
#else
echo('Production mode');
#endif
```

### 指示リスト

| 指示 | 説明 |
|------|------|
| `#def name` | マクロを定義 |
| `#undef name` | マクロを解除 |
| `#ifdef name` | マクロが定義されている場合 |
| `#ifndef name` | マクロが定義されていない場合 |
| `#else` | その他 |
| `#endif` | 条件終了 |
| `#include file` | ファイルをインクルード |
| `#include_once file` | 一度だけインクルード |
| `#define CONST value` | 定数を定義 |
| `@CONST()` | 定義した定数/関数を呼び出し |

### マクロ批量定義

```bash
sptc file.s -d DEBUG,VERBOSE
```

## コマンドラインツール

### sptc

```
Usage: sptc [options]

Options:
  -V, --version           バージョン番号を出力
  -d, --defines <string>  マクロ定義_switches。複数のスイッチはカンマで区切ります。 (default: "")
  -h, --help              ヘルプを表示
```

### sptcd (HTTPサーバー)

```
Usage: sptc http server [options]

Options:
  -V, --version           バージョン番号を出力
  -p, --port <number>     ポート番号 (default: 9090)
  -l, --locally           ローカル接続のみ受け入れ
  -w, --workdir <string>  ワークディレクトリ (default: ".")
  -r, --router <string>   ルーターとして使用す文件
  -e, --exts <string>     有効な拡張子 (default: ".s, .sjs, .sptc")
  -n, --workers <number>   ワーカープロセス数 (default: 1)
  -s, --silent            サイレントモードを有効化
  -t, --traverse          パス名がディレクトリの場合、ディレクトリ内のインデックスファイルを実行
  -d, --debug             デバッグモードを有効化
  -h, --help              ヘルプを表示
```

### 使用例

```bash
# サーバー起動
sptcd -p 9090 -w ./public

# ルーターファイルを使用
sptcd -p 9090 -r ./router.s

# マルチプロセスモード
sptcd -p 9090 -n 4

# ローカルモード
sptcd -p 9090 -l

# デバッグモード
sptcd -p 9090 -d
```

## プログラミングAPI

### NodeCGI

```javascript
const {NodeCGI} = require('sptc/dist/httpServer');

NodeCGI('./template.s', 'DEFINE1,DEFINE2');
```

### executeSptcFile

```javascript
const {executeSptcFile} = require('sptc/engine');

const ctx = executeSptcFile('./template.s', payload, options);
```

### executeSptcFileEx (Promiseバージョン)

```javascript
const {executeSptcFileEx} = require('sptc/engine');

const result = await executeSptcFileEx('./template.s', payload, {
  write: (data) => process.stdout.write(data),
  end: () => console.log('Done'),
});
```

### 完全オプション

```javascript
const result = await executeSptcFileEx('./template.s', {
  // テンプレートに渡す変数
  user: { name: 'John' },
}, {
  write: (data) => process.stdout.write(data),
  end: () => console.log('Done'),
  onError: (e) => console.error(e),
  isEntry: true,
  __DEV__: true,
  macroOption: {
    defs: ['DEBUG'],
  },
});
```

### マクロプリプロセス

```javascript
const {executeSptcMacroFile} = require('sptc/engine');

const result = executeSptcMacroFile('./template.s', {
  defs: ['DEBUG', 'VERBOSE'],
}, 'content');
```

## ルーター例

```sptc
<?js
const path = $_QUERY.path || '/index';

if (path === '/api/users') {
  setResponseHeaders({'Content-Type': 'application/json'});
  echo(JSON.stringify({users: []}));
} else if (path === '/api/posts') {
  setResponseHeaders({'Content-Type': 'application/json'});
  echo(JSON.stringify({posts: []}));
} else {
  include($_WORKDIR + '/views/404.s');
}
?>
```

## 他のフレームワークとの統合

### Webpack Loader

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(jsx?)$/,
        exclude: /node_modules/,
        loader: 'sptc/dist/webpack.loader.js',
        options: {
          file: path.resolve(__dirname, 'sptc.inject.js'),
        },
      },
    ],
  },
};
```

```javascript
// sptc.inject.js
module.exports = {
  EXTENDS: (ctx) => ({
    get_module_dir: () => {
      return ctx.fn.replace(/\\+/g, '/').replace(/(^.*?src\/modules\/[^/]+).*$/, '$1') + '/';
    },
    IS_NODE_TARGET: ctx.webpackLoaderThis.target === 'node',
  }),
  TPLS: [
    /\.jsx?$/,
    (ctx) => {
      let { str, fn } = ctx;
      return `console.log("// ${fn}")\n` + str;
    },
  ],
};
```

## ファイル拡張子

デフォルトでサポート: `.s`, `.sjs`, `.sptc`

サーバー起動時に`-e`パラメータで他の拡張子を指定可能:

```bash
sptcd -p 9090 -e ".s,.html,.xtpl"
```

## パフォーマンス特性

- 非デバッグモードでは宏 preprocessとコンテンツラッパーを使用しない、最高のパフォーマンスのため
- テンプレートファイルはコンパイルされキャッシュされる
- マルチプロセスFPM��ードサポート

## 完全な例

### hello.s

```sptc
<?js
configSptcFileCache('v1', 60);
const time = new Date().toISOString();
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SPTC Demo</title>
</head>
<body>
  <h1>Hello, SPTC!</h1>
  <p>Server Time: <?js echo(time) ?></p>
  <p>Request: <?js echo($_PATHNAME) ?></p>
</body>
</html>
```

実行:

```bash
sptcd -p 9090 -w .
```

次に `http://localhost:9090/hello.s` にアクセス
