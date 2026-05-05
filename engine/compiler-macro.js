
const vm=require('vm')
const {compileFile}=require('../utils')

const Tokens={
  T_IFDEF: '#ifdef',
  T_ELSE: '#else',
  T_ENDIF: '#endif',
  T_IFNDEF: '#ifndef',

  T_DEF: '#def',
  T_UNDEF: '#undef',

  T_INCLUDE: '#include',
  T_INCLUDE_ONCE: '#include_once',

  T_DEFINE: '#define',
}

function lexer(content) {
  const {
    T_IFDEF,
    T_ELSE,
    T_ENDIF,
    T_IFNDEF,

    T_DEF,
    T_UNDEF,

    T_INCLUDE,
    T_INCLUDE_ONCE,

    T_DEFINE,

  }=Tokens

  const tokens=[]
  const lines=content.split('\n')
  let reStr='((?:'+[
    T_IFDEF,
    T_ELSE,
    T_ENDIF,
    T_IFNDEF,
    T_DEF,
    T_UNDEF,
    T_INCLUDE_ONCE,
    T_INCLUDE,
    T_DEFINE,
  ].join('|')+')\\b)((?:\\s+).+)?|(.+)'
  const re=new RegExp('^'+reStr, 'g')

  for(let i=0; i<lines.length; i++) {
    if(!lines[i]) {
      tokens.push({frags: true, str: '\n'})
      continue
    }
    lines[i].replace(re, (_, tk, tk_params, subline)=>{
      if(tk) {
        tokens.push({tk, tk_params: (tk_params || '').trim()})
      }else if(subline) {
        tokens.push({frags: true, str: subline+'\n'})
      }
    })
  }
  const v=tokens.pop()
  if(!(v.frags===true && v.str==='\n')) {
    tokens.push(v)
  }
  return tokens
}

const O_IFDEF=Symbol()
const O_STR=Symbol()
const O_DEFINE_CONST=Symbol()
const O_DEFINE_CALL=Symbol()
const O_CALL_CONST=Symbol()
const O_CALL_DEFINE=Symbol()
const O_DEF=Symbol()
const O_INCLUDE=Symbol()
const O_UNDEF=Symbol()
function transformToAst(tokens) {
  const {
    T_IFDEF,
    T_ELSE,
    T_ENDIF,
    T_IFNDEF,

    T_DEF,
    T_UNDEF,

    T_INCLUDE,
    T_INCLUDE_ONCE,

    T_DEFINE,

  }=Tokens

  const tree=[]
  const if_stacks=[]
  function _get_if_stack() {
    if(!if_stacks.length) return;
    const p=if_stacks[if_stacks.length-1]
    const {_push_consequent, _reverse, consequent, alternate}=p
    let cd=[consequent, alternate]
    if(_reverse) cd.reverse()
    return cd[_push_consequent? 0: 1] // .push(if_statement)
  }

  for(let i=0; i<tokens.length; i++) {
    const x=tokens[i]
    if(x.tk===T_IFDEF || x.tk===T_IFNDEF) {
      const if_statement={
        type: O_IFDEF,
        match: x.tk_params,
        consequent: [],
        alternate: [],
        _push_consequent: true,
        _reverse: x.tk===T_IFNDEF,
      }
      const _cur_if_stack=_get_if_stack()
      _cur_if_stack && _cur_if_stack.push(if_statement)
      if_stacks.push(if_statement)
    }else if(x.tk===T_ELSE) {
      const t=if_stacks[if_stacks.length-1]
      if(!t || t.type!==O_IFDEF) throw new Error('not match '+T_ELSE)
      t._push_consequent=false
    }else if(x.tk===T_ENDIF) {
      const t=if_stacks[if_stacks.length-1]
      if(!t || t.type!==O_IFDEF) throw new Error('not match '+T_ENDIF)
      const p=if_stacks.pop()
      if(!if_stacks.length) {
        tree.push(p)
      }
    }else{
      let d={}
      if(x.tk===T_DEF) {
        Object.assign(d, {
          type: O_DEF,
          def: x.tk_params,
        })
      }else if(x.tk===T_UNDEF) {
        Object.assign(d, {
          type: O_UNDEF,
          def: x.tk_params,
        })
      }else if(x.tk===T_INCLUDE || x.tk===T_INCLUDE_ONCE) {
        Object.assign(d, {
          type: O_INCLUDE,
          include: x.tk_params.replace(/^"|\\"|"$/gi, ''),
          once: x.tk===T_INCLUDE_ONCE,
        })
      }else if(x.tk===T_DEFINE) {
        const re_define_func=/^([A-Za-z\d_]+)\(([^)]+)\)\s+(.+)/
        const re_define_const=/^([A-Za-z\d_]+)\s+(.+)/
        const matched_func=x.tk_params.match(re_define_func)
        const matched_const=x.tk_params.match(re_define_const)
        if(matched_func) {
          const [, funcname, argv, func_body]=matched_func
          Object.assign(d, {
            type: O_DEFINE_CALL,
            fname: funcname,
            fcall: new vm.Script(`(${argv})=>(${func_body})`).runInNewContext({require, console}),
          })
        }else if(matched_const) {
          const [, constant, value]=matched_const
          Object.assign(d, {
            type: O_DEFINE_CONST,
            cname: constant,
            cvalue: JSON.parse(value || ''),
          })
        }else{
          throw new Error('unsupported token: '+JSON.stringify(x))
        }
      }else if(x.call_define) {
        if(x.call_define_params) {
          const argv=x.call_define_params.substr(1, x.call_define_params.length-2).split(',').map(a=>a.trim())
          Object.assign(d, {
            type: O_CALL_DEFINE,
            call: x.call_define,
            argv,
            source: x.source,
          })
        }else{
          Object.assign(d, {
            type: O_CALL_CONST,
            call: x.call_define,
            source: x.source,
          })
        }
      }else if(x.frags) {
        Object.assign(d, {
          type: O_STR,
          str: x.str,
        })
      }else{
        throw new Error('unsupported token: '+JSON.stringify(x))
      }
      const ad=_get_if_stack() || tree
      const _f=ad[ad.length-1]
      if(d.type===O_STR && _f && _f.type===O_STR) {
        _f.str+=d.str
      }else{
        ad.push(d)
      }
    }
  }
  return tree
}

const caches={}
function compileSptcMacroFile(filename, mockFileContent) {
  return compileFile(filename, {
    customCache: caches,
    compileFunc: content=>transformToAst(lexer(content)),
    mockFileContent,
  })
}


module.exports={
  compileSptcMacroFile,
  MACRO_TYPES: {
    O_IFDEF,
    O_STR,
    O_DEFINE_CONST,
    O_DEFINE_CALL,
    O_CALL_CONST,
    O_CALL_DEFINE,
    O_DEF,
    O_INCLUDE,
    O_UNDEF,
  },
}
