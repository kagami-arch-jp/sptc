# SPTC デモ例

実行方法：

```bash
# HTTPサーバーを使用
sptcd -d -p 9090 -w ./demo

# または単一ファイルを直接実行
sptc filename.s
```

`http://localhost:9090/filename.s` にアクセス

## デモリスト

| ファイル | 機能 |
|---------|------|
| `01-basic.s` | 基本出力 - Hello World |
| `02-include.s` | includeを使用してテンプレートファイルを埋め込む |
| `03-include-js.s` | include_jsを使用してJSモジュールを埋め込む |
| `04-async-default.s` | デフォルト非同期（レスポンスをブロックしない） |
| `05-async-sync-push.s` | Sync.Pushで非同期完了を待機 |
| `06-async-lock.s` | Sync.Lockでレスポンスのタイミングを制御 |
| `07-user-list.s` | exportsでデータをエクスポート |
| `07-include-module.s` | includeでエクスポートされたデータを取得 |
| `08-context.s` | リクエストコンテキスト変数 |
| `09-response.s` | レスポンス制御 |
| `10-router.s` | 簡単なルーティング |
| `11-defer.s` | deferで遅延実行 |
| `12-macro.s` | マクロ前処理 |

## デモの依存関係

```
02-include.s -> header.s, footer.s
07-include-module.s -> 07-user-list.s
```
