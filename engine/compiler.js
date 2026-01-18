
const vm=require('vm')
const path=require('path')

const {compileFile}=require('../utils')

const T_JS=Symbol()
const T_TEXT=Symbol()
function lexer(content) {
  const FLAG_OPEN='<?js'
  const FLAG_CLOSE='?>'
  const tokens=[]
  const _t_flags=[]
  let c1=-1, c2=-1
  function _append_token(tk, left, right) {
    const tk_params=content.substr(left, right-left)
    if(!tk_params.length) return;
    tokens.push({tk, tk_params})
  }
  for(;;) {
    c1=content.indexOf(FLAG_OPEN, c1)
    c2=content.indexOf(FLAG_CLOSE, c2)
    if(c1===-1 && c1===-1) break
    if(c1>-1) {
      _t_flags.push({fk: FLAG_OPEN, idx: c1})
      c1+=FLAG_OPEN.length
    }
    if(c2>-1) {
      _t_flags.push({fk: FLAG_CLOSE, idx: c2})
      c2+=FLAG_CLOSE.length
    }
  }
  if(_t_flags.length) {
    const p=_t_flags[_t_flags.length-1]
    if(p.fk!==FLAG_CLOSE) _t_flags.push({
      fk: FLAG_CLOSE,
      idx: content.length,
    })
    for(let i=0; i<_t_flags.length; i+=2) {
      _append_token(T_TEXT, i>0? _t_flags[i-1].idx+FLAG_CLOSE.length: 0, _t_flags[i].idx)
      _append_token(T_JS, _t_flags[i].idx+FLAG_OPEN.length, _t_flags[i+1].idx)
    }
    _append_token(T_TEXT, _t_flags[_t_flags.length-1].idx+FLAG_CLOSE.length, content.length)
  }else{
    tokens.push({
      tk: T_TEXT,
      tk_params: content,
    })
  }
  return tokens
}

function transformToAst(tokens, filename) {
  let ret=''

  const __filefullname=path.resolve(filename)
  const {dir: __dirname, base: __filename}=path.parse(__filefullname)
  const ctx0={__dirname, __filename, __filefullname}
  for(let k in ctx0) {
    ret+=`const ${k}=${JSON.stringify(ctx0[k])};`
  }
  for(let i=0; i<tokens.length; i++) {
    if(tokens[i].tk===T_JS) {
      ret+=tokens[i].tk_params+'\n'
    }else if(tokens[i].tk===T_TEXT) {
      ret+='\necho('+JSON.stringify(tokens[i].tk_params)+');\n'
    }
  }
  return [ctx0, new vm.Script(ret+'; Symbol()[0]=_=>0', filename)]
}

function compileSptcFile(filename, option) {
  return compileFile(filename, {
    compileFunc: content=>transformToAst(lexer(content), filename),
    ...(option || {}),
  })
}

module.exports={
  compileSptcFile,
}
