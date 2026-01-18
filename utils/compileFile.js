const {mtime, readTextFile}=require('./base')

const _caches={}
function compileFile(filename, option={}) {
  const {
    contentWrapper=x=>x,
    mockFileContent=null,
    compileFunc=x=>x,
    statExpires=-1, cacheVersion='',
    customCache,
  }=option

  const cacheKeyWrapper=statExpires>0?
    fn=>(option.cacheVersion || '')+'-'+fn:
    fn=>fn

  if(mockFileContent) {
    return compileFunc(contentWrapper(mockFileContent))
  }

  const caches=customCache || _caches
  const cacheKey=cacheKeyWrapper(filename)
  let _e=caches[filename]
  const file_mt=(!_e || statExpires<=0 || Date.now()-_e.modify_t>statExpires*1e3)?
    mtime(filename):
    _e.file_mt

  if(!_e || _e.cacheKey!==cacheKey || _e.file_mt!==file_mt) {
    const c=contentWrapper(readTextFile(filename))
    const opcode=compileFunc(c)
    caches[filename]=(_e={
      modify_t: Date.now(),
      cacheKey,
      file_mt,
      opcode,
    })
  }

  return _e.opcode
}

module.exports={
  compileFile,
}
