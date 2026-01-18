const {compileSptcMacroFile, MACRO_TYPES}=require('./compiler-macro')
const path=require('path')

const {
  O_IFDEF,
  O_STR,
  O_DEFINE_CONST,
  O_DEFINE_CALL,
  O_CALL_CONST,
  O_CALL_DEFINE,
  O_DEF,
  O_INCLUDE,
  O_UNDEF,
}=MACRO_TYPES

function buildMacroContext({filename, ...inherits}) {
  const ctx=Object.assign({
    defs: new Set,
    defines: {},
    filename: filename || '',
  }, inherits || {})
  if(filename) {
    ctx.filename=filename
  }
  if(Array.isArray(ctx.defs)) {
    ctx.defs=new Set(ctx.defs)
    for(const x of ctx.defs) ctx.defines[x]=true
  }
  return ctx
}

function evalExpression(exp, defs) {
  let ret={
    value: true,
    symbol: 'and',
  }
  const stack=[]
  for(let i=0; i<exp.length; i++) {
    const c=exp[i]
    if(c==='(') {
      stack.push({...ret})
      ret.value=true
      ret.symbol='and'
    }else if(c===')') {
      const val=stack.pop()
      if(val.symbol==='and') {
        ret.value=val.value && ret.value
      }else if(val.symbol==='or') {
        ret.value=val.value || ret.value
      }
      ret.symbol=val.symbol
    }else if(c===' ') {
      while(exp[i+1]===' ') ++i;
    }else{
      let r=c
      for(;;) {
        const a=exp[i+1]
        if(a && '() '.indexOf(a)===-1) {
          r+=exp[++i]
        }else{
          break
        }
      }
      if(r==='and' || r==='or') {
        ret.symbol=r
      }else{
        if(ret.symbol==='and') {
          ret.value=ret.value && defs.has(r)
        }else if(ret.symbol==='or') {
          ret.value=ret.value || defs.has(r)
        }
      }
    }
  }
  return ret.value
}

function execute(ctx, ast) {
  let ret=''
  for(let i=0; i<ast.length; i++) {
    const p=ast[i]
    if(p.type===O_IFDEF) {
      const {match, consequent, alternate}=p
      const sub_tree=evalExpression(match, ctx.defs)? consequent: alternate
      ret+=execute(ctx, sub_tree)
    }else if(p.type===O_STR) {
      ret+=p.str
    }else if(p.type===O_DEFINE_CONST) {
      ctx.defines[p.cname]=p.cvalue
    }else if(p.type===O_DEFINE_CALL) {
      ctx.defines[p.fname]=p.fcall
    }else if([O_CALL_CONST, O_CALL_DEFINE].includes(p.type)) {
      if(!(p.call in ctx.defines)) {
        ret+=p.source
      }else{
        if(p.type===O_CALL_CONST) {
          ret+=ctx.defines[p.call]
        }else{
          ret+=ctx.defines[p.call](...p.argv)
        }
      }
    }else if(p.type===O_DEF) {
      ctx.defs.add(p.def)
    }else if(p.type===O_UNDEF) {
      ctx.defs.delete(p.def)
    }else if(p.type===O_INCLUDE) {
      const filename=path.resolve(ctx.filename+'/..', p.include)
      ctx.include_files=ctx.include_files || {}
      if(!p.once || !ctx.include_files[filename]) {
        const nctx=Object.assign({}, ctx, {filename})
        nctx.parentCtx=ctx
        ctx.include_files[filename]=true
        ret+=executeMacroContext(nctx)
      }
    }else{
      throw new Error('unsupported node: '+JSON.stringify(p))
    }
  }
  return ret
}

function executeMacroContext(ctx, ast) {
  const {filename}=ctx
  try{
    return execute(ctx, ast || compileSptcMacroFile(filename))
  }catch(e) {
    if(ctx.parentCtx) {
      console.log("Error in compile:", ctx.parentCtx.filename)
    }
    throw e
  }
}

module.exports={
  buildMacroContext,
  executeMacroContext,
}
