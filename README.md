# Simple Pretreat Toolkit CLI

---

## Documentation

- [English](./docs/README.en.md)
- [Japanese / 日本語](./docs/README.jp.md)
- [Chinese / 中文](./docs/README.md)

---

### sptc

```
Usage: sptc [options] <filename>

sptc

Options:
  -V, --version           output the version number
  -d, --defines <string>  Macro definition switches. Separate multiple switches with a comma. (default: "")
  -h, --help              display help for command
```

### sptcd
```
Usage: sptc http server [options]

A simple HTTP server

Options:
  -V, --version           output the version number
  -p, --port <number>     The port to serve on. (default: 9090)
  -l, --locally           Only accepts local connections.
  -w, --workdir <string>  Specifies the working directory. (default: ".")
  -r, --router <string>   Specifies a file to use as a router entry. If specified, all requests will be routed to
                          this file.
  -e, --exts <string>     Specifies the valid extensions for executable SPTC files. (default: ".s, .sjs, .sptc")
  -n, --workers <number>  The number of worker processes. (default: 1)
  -s, --silent            Enables silent mode.
  -t, --traverse          If the pathname is a directory, executes the index file under the pathname directory if
                          one exists. If no index file is found, traverses the directory. This option is ignored
                          if a router file is specified.
  -d, --debug             Enables debug mode.
  -h, --help              display help for command
```

### webpack loader
```
Usage:

Webpack configuration:

{
  test: /\.(jsx?)$/,
  exclude: /node_modules/,
  options: {
    file: path.resolve(__dirname+'/sptc.inject.js'),
  },
  loader: 'sptc/dist/webpack.loader.js',
}



**sptc.inject.js**

module.exports={
  EXTENDS: (ctx)=>({
    get_module_dir: _=>{
      return ctx.fn.replace(/\\+/g, '/').replace(/(^.*?src\/modules\/[^/]+).*$/, '$1')+'/'
    },
    IS_NODE_TARGET: ctx.webpackLoaderThis.target==='node',
  }),
  TPLS: [
    /\.jsx?$/, ctx=>{
      let {str, fn}=ctx
      return `console.log("// ${fn}")\n`+str
    }
  ],
}


```
