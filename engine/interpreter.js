const _module=require('module')
const vm=require('vm')
const path=require('path')
const Compiler=require('./compiler')
const Utils=require('../utils')
const {generate_uuid, PromiseWithResolvers, formatOutput}=Utils

/*
  const tt={x: 2, b: [2, 5], c: _=>2, d: /xx/ig}
  tt.y=tt
  tt.qq=[{r: tt}]
  const r1={zzz: 44}
  r1.rrr=r1
  tt.H=r1
  console.log(var_dump(tt))
 */
function var_dump(...x) {
  return x.map(_var_dump).join('\n')
}
function _var_dump(x) {
  let i=new WeakSet, b=0, K=generate_uuid('VAR_DUMP__'), ls=[]
  JSON.stringify(x, (k, v)=>{
    if(v && typeof v==='object') {
      if(!i.has(v)) {
        v[K]=b++
        i.add(v)
        ls.push(v)
      }else return 0
    }
    return v
  })

  i=new WeakSet
  b=0
  ls=[]

  const e=JSON.stringify(x, (k, v)=>{
    if(v && typeof v==='object') {
      if(!i.has(v)) {
        v[K]=b++
        i.add(v)
        ls.push(v)
      }else{
        return `[Circular] #`+v[K]
      }
    }
    if(k===K) {
      return '[*Ref] #'+v
    }
    if(typeof v==='function') {
      return `[Function] ${v.toString()}`
    }
    if(v && v.constructor===RegExp) {
      return `[RegExp] ${v.toString()}`
    }
    return v
  }, 2)

  for(let o of ls) {
    delete o[K]
  }

  return e && e.replace(new RegExp(K, 'g'), '__ref_key__')
}

function buildGlobal() {
  const ctx={
    console,
    setTimeout, clearTimeout,
    setInterval, clearInterval,
    setImmediate, clearImmediate,
    queueMicrotask,
    Buffer,
    process,
    TextEncoder, TextDecoder,
    URL, URLSearchParams,
  }
  ctx.global=ctx
  ctx.globalThis=ctx
  return ctx
}

const NOOP=_=>null
const Application={}
function buildContext(ctx0, option) {

  const {
    write=NOOP,
    end=NOOP,
    onError=NOOP,
    masterPriv=null,
    isEntry=false,
  }=option

  const ctx=buildGlobal()

  const priv=masterPriv || {
    isEnd: false,
    echos: [],
    syncs: [],
    _defers: [],
    __autoload_func: null,
    __autoload_vars: {},
    _defined: {},
    cacheVersion: '',
    statExpires: -1,
  }

  Object.assign(ctx, {
    end,
    onError,
    isMaster: !masterPriv,
  })

  ctx.Application=Application

  ctx.Utils=Utils

  ctx.__SPTC_VERSION__=Utils.__SPTC_VERSION__
  ctx.__SPTC_INSTALL_PATH__=Utils.__SPTC_INSTALL_PATH__

  ctx.assert=Utils.assert

  // Dynamically set the cache configuration.
  ctx.configSptcFileCache=(cacheVersion, cacheSeconds)=>{
    if(!isEntry) {
      console.log('Warning: this function only works in the entry file.')
      return
    }
    priv.cacheVersion=cacheVersion
    priv.statExpires=cacheSeconds
  }

  ctx.echo=(...x)=>{
    if(priv.isEnd) return;
    priv.echos.push(...x)
  }

  ctx.readEchoed=as_str=>{
    const {echos}=priv
    const buf=[]
    echos.splice(0).map(x=>buf.push(toWritable(x)))
    return formatOutput(buf, as_str)
  }

  ctx.flush=_=>{
    if(priv.isEnd) return;
    const {echos}=priv
    echos.splice(0).map(x=>write(toWritable(x)))
  }

  ctx.var_dump=(...x)=>{
    for(let o of x) {
      ctx.echo(var_dump(o))
    }
  }

  ctx.Sync={
    Push: (...x)=>{
      if(priv.isEnd) return;
      for(let i=x.length; i--; ) {
        if(typeof x[i]==='function') x[i]=x[i]()
      }
      priv.syncs.push(...x)
    },
    Lock: _=>{
      const lock=PromiseWithResolvers()
      priv.syncs.push(lock.promise)
      return _=>lock.resolve()
    },
  }

  ctx.defer=fn=>{
    if(priv.isEnd) return;
    priv._defers.push(fn)
  }

  ctx.define=(k, v)=>{
    if(k in priv._defined) {
      throw new Error(`duplicate key: ${k}`)
    }
    priv._defined[k]=v
  }

  try{
    ctx.require=_module.createRequire(ctx0.__filefullname)
    ctx.importESModule=x=>import(ctx.require.resolve(x))
  }catch(e) {
    ctx.require=require
    ctx.importESModule=x=>import(x)
  }

  ctx._exports={}
  ctx.exports=o=>{
    if('__getter__' in o) {
      throw new Error('`__getter__` cannot be overrided')
    }
    Object.assign(ctx._exports, o)
  }

  ctx.eval=code=>(new vm.Script(code)).runInNewContext(ctx)

  ctx.include=(inc_filename, inc_payload={})=>{
    const inc=path.resolve(ctx0.__dirname, inc_filename)
    const [_ctx0, _vm]=Compiler.compileSptcFile(inc, {
      statExpires: priv.statExpires,
      cacheVersion: priv.cacheVersion,
    })
    const [_ctx, _]=buildContext({
      ...ctx0,
      ...inc_payload,
      ..._ctx0,
    }, {
      write: option.write,
      onError: option.onError,
      masterPriv: priv,
      isEntry: false,
    })
    const ret=executeVm(_vm, _ctx, priv)
    return new Proxy(_ctx._exports, {
      get: (target, prop, receiver)=>{
        if(false===prop in target) {
          try{
            return ret.constructor('return '+prop)()
          }catch(e) {
            return undefined
          }
        }
        return target[prop]
      },
    })
  }

  ctx.include_js=(inc_filename, inc_payload={})=>{
    const inc=path.resolve(ctx0.__dirname, inc_filename)
    const jsvm=Utils.compileFile(inc, {
      compileFunc: code=>new vm.Script(code+'; Symbol()[0]=_=>0', inc)
    })

    /*
    const jsctx={
      ...inc_payload,
    }*/

    const [jsctx]=buildContext({
      ...ctx0,
      ...inc_payload,
    }, {
      isEntry: false,
      masterPriv: priv,
    })

    jsvm.runInNewContext(jsctx)
    return jsctx
  }

  ctx.__autoload=fn=>{
    priv.__autoload_func=fn
  }

  let pctx=Object.assign({}, ctx0, ctx)
  pctx=new Proxy(pctx, {
    get: (target, prop, receiver)=>{
      if(false===prop in target) {
        if(prop in priv._defined) {
          return priv._defined[prop]
        }
        if(prop in priv.__autoload_vars) {
          return priv.__autoload_vars[prop]
        }
        if(priv.__autoload_func) {
          let inc_fn=priv.__autoload_func(prop)
          if(inc_fn) {
            return priv.__autoload_vars[prop]=ctx.include(inc_fn)[prop]
          }
        }
        if(global[prop]) return global[prop]
      }
      return Reflect.get(target, prop, receiver)
    },
  })

  return [pctx, priv]
}

function toWritable(x) {
  if(x && [Uint8Array, Buffer].includes(x.constructor)) {
    return x
  }
  if(typeof x==='string') return x
  if(typeof x==='undefined') return 'undefined'
  if(typeof x==='number') {
    if(isNaN(x))return 'NaN'
    if(x===Infinity) return 'Infinity'
    if(x===-Infinity) return '-Infinity'
  }
  return JSON.stringify(x)+''
}

function executeVm(vm, ctx, priv) {
  const {onError, end, flush, isMaster}=ctx
  let ret
  try{
    ret=vm.runInNewContext(ctx)
  }catch(e) {
    onError(e)
  }
  ; (async _=>{

    try{
      const syncs=priv.syncs.length? Promise.all(priv.syncs): null
      await Promise.resolve(syncs)
      flush()
      end()
      if(isMaster) priv.isEnd=true
    }catch(e) {
      onError(e)
    }

    if(!isMaster) return;
    for(let fn of priv._defers.splice(0)) {
      try{
        fn()
      }catch(e) {
        onError(e)
      }
    }

  })()
  return ret
}


module.exports={
  buildContext,
  executeVm,
}
