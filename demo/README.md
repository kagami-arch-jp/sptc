# SPTC Demo Examples

运行方式：

```bash
# 使用 HTTP 服务器
sptcd -d -p 9090 -w ./demo

# 或直接运行单个文件
sptc filename.s
```

访问 `http://localhost:9090/filename.s`

## Demo 列表

| 文件 | 功能 |
|------|------|
| `01-basic.s` | 基础输出 - Hello World |
| `02-include.s` | 使用 include 包含模板文件 |
| `03-include-js.s` | 使用 include_js 包含 JS 模块 |
| `04-async-default.s` | 默认异步不阻塞响应 |
| `05-async-sync-push.s` | Sync.Push 等待异步完成 |
| `06-async-lock.s` | Sync.Lock 控制响应时机 |
| `07-user-list.s` | exports 导出数据 |
| `07-include-module.s` | include 获取导出数据 |
| `08-context.s` | 请求上下文变量 |
| `09-response.s` | 响应控制 |
| `10-router.s` | 简单路由 |
| `11-defer.s` | defer 延迟执行 |
| `12-macro.s` | 宏预处理 |

## Demo 依赖关系

```
02-include.s -> header.s, footer.s
07-include-module.s -> 07-user-list.s
```
