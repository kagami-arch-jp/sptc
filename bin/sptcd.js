#!/usr/bin/env node

const {FastCGI, FastCGI_FPM}=require('../dist/httpServer')
const {Command}=require('commander')
const version=require('../package.json').version
const program=new Command()
  .name(`sptc http server`)
  .description(`A simple HTTP server`)
  .version(version)
  .requiredOption('-p, --port <number>', 'The port to serve on.', 9090)
  .option('-l, --locally', 'Only accepts local connections.')
  .option('-w, --workdir <string>', 'Specifies the working directory.', '.')
  .option('-r, --router <string>', 'Specifies a file to use as a router entry. If specified, all requests will be routed to this file.')
  .option('-e, --exts <string>', 'Specifies the valid extensions for executable SPTC files.', '.s, .sjs, .sptc')
  .option('-n, --workers <number>', 'The number of worker processes.', 1)
  .option('-s, --silent', 'Enables silent mode.')
  .option('-t, --traverse', 'If the pathname is a directory, executes the index file under the pathname directory if one exists. If no index file is found, traverses the directory. This option is ignored if a router file is specified.')
  .option('-d, --debug', 'Enables debug mode.')
  .action(({
    port,
    locally,
    workdir,
    router,
    exts,
    workers,
    slient,
    traverse,
    debug,
  })=>{
    const disableLog=slient || require('cluster').isWorker

    if(router && traverse) {
      traverse=false
      if(!disableLog) {
        console.log('`--traverse` option has been ignored due to the router file has been specified.')
      }
    }

    const argv=[port, locally, {
      serverDir: workdir,
      routerEntry: router,
      exts: exts.split(',').map(x=>{
        const r=x.trim()
        return r.indexOf('.')===0? r: '.'+r
      }).filter(x=>x),
      debug,
      traverse,
    }]

    if(workers>1) {
      FastCGI_FPM(workers, ...argv)
    }else{
      FastCGI(...argv)
    }

    if(disableLog) return;
  	const {getLocalIpv4Addresses}=require('../utils')
    console.log('`sptc-http-server` has been launched with the following option:')
    const o={
      debug,
      workdir,
      routerEntry: router || null,
    }
    o.traverse=traverse? true: false
    if(locally) {
      o.serve='127.0.0.1:'+port
    }else{
      o.serves=getLocalIpv4Addresses().map(x=>x+':'+port)
    }
    o.runtime=workers>1? 'FastCGI_FPM': 'FastCGI'
    if(workers>1) {
      o.workers=workers
    }
    console.log(o)


  })
  .parse()
