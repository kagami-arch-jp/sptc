# SPTC - Simple Pretreat Toolkit CLI

A lightweight template engine and HTTP server framework.

## Overview

SPTC is a PHP-like template engine that embeds JavaScript code into template files using `<?js ... ?>` syntax, and also provides a built-in FastCGI HTTP server.

## Installation

```bash
npm install -g sptc
```

Or local installation:

```bash
npm install
```

## Quick Start

### 1. Run a single file from command line

```bash
sptc filename.s
sptc filename.s -d DEFINE1,DEFINE2  # pass macro definitions
```

### 2. Start HTTP server

```bash
sptcd -p 9090 -w ./public
```

## File Format

SPTC template files use `<?js` and `?>` to wrap JavaScript code, with the rest as text output.

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

### Equivalent form

```sptc
<?js echo('Hello, World!') ?>
```

Code between `<?js ... ?>` tags is executed as JavaScript, while text outside tags is passed to `echo()` as a string.

## Built-in Functions and Variables

### Output

```sptc
<?js
echo('Hello World');           // output text
flush();                   // flush output buffer immediately
var_dump(obj);             // debug print object structure
?>
```

### File Include

```sptc
<?js
// include another SPTC template file
const data = include('./footer.s');

// include JavaScript file
// include_js exports both module.exports and global variables and exports.xxx
const utils = include_js('./utils.js');
// utils.add()      <- from module.exports
// utils.sub()      <- from global function
// utils.mul()      <- from exports.mul
?>
```

**Special behavior of include_js**

`include_js(filename, payload?)` loads the specified JS file and returns a merged object:
- Properties exported via `module.exports`
- Global function/variable declarations in the file
- Properties exported via `exports.xxx`

This allows the included JS file to export content in multiple ways:

```javascript
// utils.js example

// 1. module.exports export
module.exports = {
  add: (a, b) => a + b,
};

// 2. Global function declaration (becomes global variable)
function sub(a, b) {
  return a - b;
}

// 3. exports.xxx export
exports.mul = (x, y) => x * y;
```

After using `include_js`, all these methods will be exported:
```sptc
<?js
const utils = include_js('./utils.js');
utils.add(1, 2);  // 3
utils.sub(3, 1);  // 2
utils.mul(2, 3);  // 6
?>
```

### Macro Definition

```sptc
<?js
// define constant (duplicate definition throws error)
define('MY_CONST', 'value');

// get defined constant
echo(MY_CONST);
?>
```

### Async Sync Queue (Sync.Push)

By default, async logic does not block the response - it returns immediately after main logic execution for efficiency.

To wait for async logic completion before returning response, use `Sync.Push` to add Promise to the sync queue. The system will wait for all Promises in the queue before sending response.

```sptc
<?js
// default: async operations don't block response
setTimeout(_ => console.log('async'), 1000);
// main logic completes and returns immediately, doesn't wait for setTimeout

// to wait for async completion:
Sync.Push((async () => {
  await new Promise(r => setTimeout(r, 1000));
  echo('Async done');
})());
// now will wait for Promise completion before sending response
?>
```

### Async Lock (Sync.Lock)

Used to control response sending timing. The system sends the response after `release()` is called.

```sptc
<?js
// get release function
const release = Sync.Lock();

// perform async operation
(async () => {
  await doSomething();
  // call release() to send response after completion
  release();
})();

// can also add multiple tasks to queue
Sync.Push((async () => {
  await anotherTask();
})());

echo('Response will be sent after release() is called');
?>
```

Use case: when async tasks (like database queries, external API calls) need to return results to the frontend.

### Deferred Execution

```sptc
<?js
defer(() => {
  // executes after main logic completes
  console.log('Cleanup here');
});
?>
```

### Cache Configuration

```sptc
<?js
// configure cache version and expiration
configSptcFileCache('v1', 60);
?>
```

### Autoload

```sptc
<?js
// set autoload function
__autoload(name => {
  if (name.startsWith('Model_')) {
    return './models/' + name + '.s';
  }
});

// loads when used
const user = Model_User;
?>
```

### Dynamic Execution

```sptc
<?js
// dynamically execute JS code
eval('const x = 1 + 1');
echo(x);
?>
```

### Module Import

```sptc
<?js
// ES Module import
const pkg = await import('./package.json');
?>
```

## Built-in Variables (Context)

### Request Related

```sptc
<?js
echo($_RAW_REQUEST.url);           // raw request object
echo($_REQUEST_FILE.fullname);    // full path of request file
echo($_REQUEST_FILE.pathname);     // request path
echo($_QUERY.param);              // query parameter
echo($_PATHNAME);               // current path
echo($_WORKDIR);                 // working directory
echo($_GLOBAL.x);                // global variable
echo($_ENV.NODE_ENV);            // environment variable
?>
```

### Response Related

```sptc
<?js
setStatus(404, 'Not Found');              // set HTTP status code
setResponseHeaders({'X-Custom': 'value'}); // set response headers
flushHeader();                          // send response headers immediately
sendFile('./file.pdf');                   // send file
echo(getResponseStatus());                // get status code
echo(getResponseHeaders());              // get response headers
?>
```

### Debug Related

```sptc
<?js
setDebug(true);   // enable debug mode
isDebug();        // check if debug mode
?>
```

### Cache

```sptc
<?js
// create cached storage
const cached = withCache(() => {
  return computeExpensiveValue();
}, 'cache_key', 'v1');
?>
```

### Export

```sptc
<?js
// export module (for use with include)
exports({
  getData: () => 'data',
  version: '1.0',
});
?>
```

### Global Object

```sptc
<?js
// application-level global object
Application.myData = 'value';
?>
```

### Utility Functions

```sptc
<?js
// assertion
assert(condition, 'error message');

// Utils module
Utils.generate_uuid();
Utils.fileExists(path);
Utils.md5(content);
?>
```

### Constants

```sptc
<?js
echo(__SPTC_VERSION__);      // SPTC version
echo(__SPTC_INSTALL_PATH__);  // install path
echo(__filename);            // current filename
echo(__dirname);           // current directory
echo(__filefullname);       // full path
?>
```

## Macro Preprocessor Directives

Use macro directives at the beginning of the file:

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

### Directive List

| Directive | Description |
|------|------|
| `#def name` | Define macro |
| `#undef name` | Undefine macro |
| `#ifdef name` | If macro is defined |
| `#ifndef name` | If macro is not defined |
| `#else` | Else |
| `#endif` | End condition |
| `#include file` | Include file |
| `#include_once file` | Include once |
| `#define CONST value` | Define constant |
| `@CONST()` | Call defined constant/function |

### Batch Define Macros

```bash
sptc file.s -d DEBUG,VERBOSE
```

## Command Line Tools

### sptc

```
Usage: sptc [options]

Options:
  -V, --version           output the version number
  -d, --defines <string>  Macro definition switches. Separate multiple switches with a comma. (default: "")
  -h, --help              display help for command
```

### sptcd (HTTP Server)

```
Usage: sptc http server [options]

Options:
  -V, --version           output the version number
  -p, --port <number>     The port to serve on. (default: 9090)
  -l, --locally           Only accepts local connections.
  -w, --workdir <string>  Specifies the working directory. (default: ".")
  -r, --router <string>   Specifies a file to use as a router entry.
  -e, --exts <string>    Specifies the valid extensions. (default: ".s, .sjs, .sptc")
  -n, --workers <number>  The number of worker processes. (default: 1)
  -s, --silent           Enables silent mode.
  -t, --traverse         If the pathname is a directory, executes the index file.
  -d, --debug           Enables debug mode.
  -h, --help            display help for command
```

### Usage Examples

```bash
# start server
sptcd -p 9090 -w ./public

# use router file
sptcd -p 9090 -r ./router.s

# multi-process mode
sptcd -p 9090 -n 4

# local mode
sptcd -p 9090 -l

# debug mode
sptcd -p 9090 -d
```

## Programming API

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

### executeSptcFileEx (Promise version)

```javascript
const {executeSptcFileEx} = require('sptc/engine');

const result = await executeSptcFileEx('./template.s', payload, {
  write: (data) => process.stdout.write(data),
  end: () => console.log('Done'),
});
```

### Full Options

```javascript
const result = await executeSptcFileEx('./template.s', {
  // variables passed to template
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

### Macro Preprocess

```javascript
const {executeSptcMacroFile} = require('sptc/engine');

const result = executeSptcMacroFile('./template.s', {
  defs: ['DEBUG', 'VERBOSE'],
}, 'content');
```

## Router Example

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

## Integration with Other Frameworks

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

## File Extensions

Default support: `.s`, `.sjs`, `.sptc`

Can specify other extensions with `-e` parameter when starting server:

```bash
sptcd -p 9090 -e ".s,.html,.xtpl"
```

## Performance Features

- In non-debug mode, macro preprocess and content wrapper are disabled for best performance
- Template files are compiled and cached
- Supports multi-process FPM mode

## Complete Example

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

Run:

```bash
sptcd -p 9090 -w .
```

Then access `http://localhost:9090/hello.s`
