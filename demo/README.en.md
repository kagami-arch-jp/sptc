# SPTC Demo Examples

Usage:

```bash
# Using HTTP server
sptcd -d -p 9090 -w ./demo

# Or run a single file directly
sptc filename.s
```

Visit `http://localhost:9090/filename.s`

## Demo List

| File | Description |
|------|-------------|
| `01-basic.s` | Basic output - Hello World |
| `02-include.s` | Using include to embed template files |
| `03-include-js.s` | Using include_js to embed JS modules |
| `04-async-default.s` | Default async without blocking response |
| `05-async-sync-push.s` | Sync.Push waits for async completion |
| `06-async-lock.s` | Sync.Lock controls response timing |
| `07-user-list.s` | exports to export data |
| `07-include-module.s` | include to get exported data |
| `08-context.s` | Request context variables |
| `09-response.s` | Response control |
| `10-router.s` | Simple routing |
| `11-defer.s` | defer for delayed execution |
| `12-macro.s` | Macro preprocessing |

## Demo Dependencies

```
02-include.s -> header.s, footer.s
07-include-module.s -> 07-user-list.s
```
