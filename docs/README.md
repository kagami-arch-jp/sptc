# SPTC - Simple Pretreat Toolkit CLI

一个轻量级的模板引擎和 HTTP 服务器框架。

## 功能概述

SPTC 是一个类似 PHP 的模板引擎，使用 `<?js ... ?>` 语法将 JavaScript 代码嵌入到模板文件中运行，同时提供内置的 FastCGI HTTP 服务器。

## 安装

```bash
npm install -g sptc
```

或者本地安装:

```bash
npm install
```

## 快速开始

### 1. 命令行运行单个文件

```bash
sptc filename.s
sptc filename.s -d DEFINE1,DEFINE2  # 传入宏定义
```

### 2. 启动 HTTP 服务器

```bash
sptcd -p 9090 -w ./public
```

## 文件格式

SPTC 模板文件使用 `<?js` 和 `?>` 包裹 JavaScript 代码，其余内容作为文本输出。

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

### 等价形式

```sptc
<?js echo('Hello, World!') ?>
```

`<?js ... ?>` 标签之间的代码作为 JavaScript 执行，标签外的文本作为字符串传递给 `echo()` 函数。

## 内置函数和变量

### 输出

```sptc
<?js
echo('Hello World');           // 输出文本
flush();                   // 立即刷新输出缓冲
var_dump(obj);             // 调试打印对象结构
?>
```

### 文件包含

```sptc
<?js
// 包含另一个 SPTC 模板文件
const data = include('./footer.s');

// 包含 JavaScript 文件
// include_js 不仅导出 module.exports，还会导出全局变量和 exports.xxx
const utils = include_js('./utils.js');
// utils.add()      <- 来自 module.exports
// utils.sub()      <- 来自全局函数
// utils.mul()      <- 来自 exports.mul
?>
```

**include_js 的特殊性**

`include_js(filename, payload?)` 会加载指定的 JS 文件并返回合并后的对象:
- `module.exports` 导出的属性
- 文件中的全局函数/变量声明
- `exports.xxx` 导出的属性

这使得被包含的 JS 文件可以用多种方式导出内容:

```javascript
// utils.js 示例

// 1. module.exports 导出
module.exports = {
  add: (a, b) => a + b,
};

// 2. 全局函数声明 (会成为全局变量)
function sub(a, b) {
  return a - b;
}

// 3. exports.xxx 导出
exports.mul = (x, y) => x * y;
```

使用 `include_js` 后，所有这些方法都会被导出:
```sptc
<?js
const utils = include_js('./utils.js');
utils.add(1, 2);  // 3
utils.sub(3, 1);  // 2
utils.mul(2, 3);  // 6
?>
```

### 宏定义

```sptc
<?js
// 定义常量（重复定义会报错）
define('MY_CONST', 'value');

// 获取已定义的常量
echo(MY_CONST);
?>
```

### 异步同步队列 (Sync.Push)

默认情况下，异步逻辑不会阻止响应 - 主逻辑执行完毕后立即返回响应，以提高效率。

如需等待异步逻辑完成后再返回响应，使用 `Sync.Push` 将 Promise 添加到同步队列。系统会在响应发送前等待所有队列中的 Promise 完成。

```sptc
<?js
// 默认：异步操作不会阻塞响应
setTimeout(_ => console.log('async'), 1000);
// 主逻辑执行完立即返回，不会等待 setTimeout

// 如需等待异步完成：
Sync.Push((async () => {
  await new Promise(r => setTimeout(r, 1000));
  echo('Async done');
})());
// 现在会等待 Promise 完成后再发送响应
?>
```

### 异步锁 (Sync.Lock)

用于控制响应的发送时机。当调用 `release()` 后，系统才会发送响应。

```sptc
<?js
// 获取 release 函数
const release = Sync.Lock();

// 执行异步操作
(async () => {
  await doSomething();
  // 完成后调用 release() 发送响应
  release();
})();

// 也可以添加多个任务到队列
Sync.Push((async () => {
  await anotherTask();
})());

echo('Response will be sent after release() is called');
?>
```

使用场景：异步任务（如数据库查询、外部 API 调用）的结果需要返回给前端时使用。

### 延迟执行

```sptc
<?js
defer(() => {
  // 在主逻辑执行完毕后执行
  console.log('Cleanup here');
});
?>
```

### 缓存配置

```sptc
<?js
// 配置缓存版本和过期时间
configSptcFileCache('v1', 60);
?>
```

### 自动加载

```sptc
<?js
// 设置自动加载函数
__autoload__(name => {
  if (name.startsWith('Model_')) {
    return './models/' + name + '.s';
  }
});

// 使用时才加载
const user = Model_User;
?>
```

### 动态执行

```sptc
<?js
// 动态执行 JS 代码
eval('const x = 1 + 1');
echo(x);
?>
```

### 模块导入

```sptc
<?js
// ES Module 导入
const pkg = await import('./package.json');
?>
```

## 内置变量 (Context)

### 请求相关

```sptc
<?js
echo($_RAW_REQUEST.url);           // 原始请求对象
echo($_REQUEST_FILE.fullname);    // 请求文件的完整路径
echo($_REQUEST_FILE.pathname);     // 请求路径
echo($_QUERY.param);              // 查询参数
echo($_PATHNAME);               // 当前路径
echo($_WORKDIR);                 // 工作目录
echo($_GLOBAL.x);                // 全局变量
echo($_ENV.NODE_ENV);            // 环境变量
?>
```

### 响应相关

```sptc
<?js
setStatus(404, 'Not Found');              // 设置 HTTP 状态码
setResponseHeaders({'X-Custom': 'value'}); // 设置响应头
flushHeader();                          // 立即发送响应头
sendFile('./file.pdf');                   // 发送文件
echo(getResponseStatus());                // 获取��态码
echo(getResponseHeaders());              // 获取响应头
?>
```

### 调试相关

```sptc
<?js
setDebug(true);   // 开启调试模式
isDebug();        // 检查是否调试模式
?>
```

### 缓存

```sptc
<?js
// 创建缓存存储
const cached = withCache(() => {
  return computeExpensiveValue();
}, 'cache_key', 'v1');
?>
```

### 导出

```sptc
<?js
// 导出模块（供 include 使用）
exports({
  getData: () => 'data',
  version: '1.0',
});
?>
```

### 全局对象

```sptc
<?js
// 应用级全局对象
Application.myData = 'value';
?>
```

### 工具函数

```sptc
<?js
// 断言
assert(condition, 'error message');

// Utils 模块
Utils.generate_uuid();
Utils.fileExists(path);
Utils.md5(content);
?>
```

### 常量

```sptc
<?js
echo(__SPTC_VERSION__);      // SPTC 版本
echo(__SPTC_INSTALL_PATH__);  // 安装路径
echo(__filename);            // 当前文件名
echo(__dirname);           // 当前目录
echo(__filefullname);       // 完整路径
?>
```

## 宏预处理指令

在文件开头使用宏指令:

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

### 指令列表

| 指令 | 说明 |
|------|------|
| `#def name` | 定义宏 |
| `#undef name` | 取消定义宏 |
| `#ifdef name` | 如果定义了宏 |
| `#ifndef name` | 如果未定义宏 |
| `#else` | 否则 |
| `#endif` | 结束条件 |
| `#include file` | 包含文件 |
| `#include_once file` | 只包含一次 |
| `#define CONST value` | 定义常量 |
| `@CONST()` | 调用定义的常量/函数 |

### 批量定义宏

```bash
sptc file.s -d DEBUG,VERBOSE
```

## 命令行工具

### sptc

```
Usage: sptc [options] 

Options:
  -V, --version           output the version number
  -d, --defines <string>  Macro definition switches. Separate multiple switches with a comma. (default: "")
  -h, --help              display help for command
```

### sptcd (HTTP 服务器)

```
Usage: sptc http server [options]

Options:
  -V, --version           output the version number
  -p, --port <number>     The port to serve on. (default: 9090)
  -l, --locally           Only accepts local connections.
  -w, --workdir <string>  Specifies the working directory. (default: ".")
  -r, --router <string>   Specifies a file to use as a router entry.
  -e, --exts <string>     Specifies the valid extensions. (default: ".s, .sjs, .sptc")
  -n, --workers <number>   The number of worker processes. (default: 1)
  -s, --silent            Enables silent mode.
  -t, --traverse          If the pathname is a directory, executes the index file.
  -d, --debug             Enables debug mode.
  -h, --help              display help for command
```

### 使用示例

```bash
# 启动服务器
sptcd -p 9090 -w ./public

# 使用路由器文件
sptcd -p 9090 -r ./router.s

# 多进程模式
sptcd -p 9090 -n 4

# 本地模式
sptcd -p 9090 -l

# 调试模式
sptcd -p 9090 -d
```

## 编程接口

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

### executeSptcFileEx (Promise 版本)

```javascript
const {executeSptcFileEx} = require('sptc/engine');

const result = await executeSptcFileEx('./template.s', payload, {
  write: (data) => process.stdout.write(data),
  end: () => console.log('Done'),
});
```

### 完整选项

```javascript
const result = await executeSptcFileEx('./template.s', {
  // 传递给模板的变量
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

### 宏预处理

```javascript
const {executeSptcMacroFile} = require('sptc/engine');

const result = executeSptcMacroFile('./template.s', {
  defs: ['DEBUG', 'VERBOSE'],
}, 'content'); // 也可以直接传 content
```

## 路由器示例

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

## 与其他框架集成

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

## 文件扩展名

默认支持: `.s`, `.sjs`, `.sptc`

可以在服务器启动时通过 `-e` 参数指定其他扩展名:

```bash
sptcd -p 9090 -e ".s,.html,.xtpl"
```

## 性能特性

- 非调试模式下不启用宏预处理和内容包装器，以获得最佳性能
- 模板文件会被编译并缓存
- 支持多进程 FPM 模式

## 完整示例

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

运行:

```bash
sptcd -p 9090 -w .
```

然后访问 `http://localhost:9090/hello.s`