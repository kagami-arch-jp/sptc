const {executeSptcFileEx}=require('../engine')
const path=require(`path`)

module.exports=async function(str) {
  let query=this.query || {}
  if(this.query) {
    const {file}=this.query
    if(file) {
      query=Object.assign({}, require(file))
    }
  }

  const {
    EXTENDS=(wCtx=>({})),
    TPLS=[],
  }=query

  let wCtx={
    str: str,
    fn: path.resolve(this.resourcePath).replace(/\\+/g, '/'),
    webpackLoaderThis: this,
  }

  const E=EXTENDS(wCtx)
  const globals=Object.assign({}, E, {wCtx})
  wCtx.runtimeGlobals=globals

  let callback=this.async()
  try{
    const EX={
      __DEV__: false,
      macroOption: {
        defs: [],
      },
    }
    for(let k in E) {
      if(k.match(/^[A-Z_\d]+$/) && typeof E[k]==='boolean' && E[k]) {
        EX.macroOption.defs.push(k)
        EX.__DEV__=true
      }
    }

    const output=await executeSptcFileEx(wCtx.fn, globals, {
      ...EX,
      mockFileContent: wCtx.str,
    })

    wCtx.str=output

    for(let i=0; i<TPLS.length; i+=2){
      const [_match, _handler]=[TPLS[i], TPLS[i+1]]
      if(wCtx.fn.match(_match)) wCtx.str=_handler(wCtx, globals)
    }
    callback(null, wCtx.str)
  }catch(e) {
    callback(e)
  }

}
