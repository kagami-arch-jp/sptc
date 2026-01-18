const fs=require('fs')
const {safe_path}=require('./base')

function fsize(b) {
  const u=['b', 'kb', 'mb', 'gb']
  let i=0;
  for(; i<u.length-1; i++) {
    if(b<1024) break
    b/=1024
  }
  return b.toFixed(1)+u[i]
}

function listdir(ref, dir) {
  const ret={
    dirs: [],
    files: [],
  }
  try{
    const ls=fs.readdirSync(safe_path(ref, dir))
    for(let a of ls) try{
      const fn=safe_path(ref, dir+'/'+a)
      const stat=fs.statSync(fn)
      const dfn=safe_path(dir.substr(1), a)
      if(stat.isFile()) {
        ret.files.push({
          dfn,
          fn: a,
          size: fsize(stat.size),
        })
      }else{
        ret.dirs.push({
          dfn,
          fn: a,
        })
      }
    }catch(e) {}
  }catch(e) {
    ret.error=new Error('`'+dir+'` permission denied')
  }
  return ret
}

module.exports={
  listdir,
}