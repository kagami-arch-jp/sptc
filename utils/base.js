
const fs=require('fs')
const crypto=require('crypto')
const path=require('path')

function readTextFile(filename) {
  return fs.readFileSync(filename, 'utf8')
}

function sleep(t, f=null) {
  return new Promise(r=>{
    let x=setTimeout(r, t)
    if(f) Promise.resolve(f).finally(_=>{
      clearTimeout(x)
    })
  })
}

function mtime(filename) {
  return fs.statSync(filename).mtime.getTime()
}

let _g=0
function generate_uuid(prefix='') {
  return [
    prefix,
    (_g=(_g+1)%1e8).toString(36),
    (Date.now()+Math.random()).toString(36),
  ].join('_')
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

function safe_path(ref, dir) {
  return path.normalize((ref? ref+'/': '')+path.normalize(dir))
}

function fileExists(fn) {
  try{
    return fs.statSync(fn).isFile()
  }catch(e) {}
}

function getExtension(filename) {
	return path.parse(filename).ext
}

function getLocalIpv4Addresses() {
  const os=require('os')
  let rr={'127.0.0.1': 1}
  try{
    const ii=os.networkInterfaces()
    for(let a in ii) {
      ii[a].map(x=>{
        if(!x.family.match(/IPV4/i)) return;
        rr[x.address]=1
      })
    }
  }catch(e) {}
  return Object.keys(rr)
}

function PromiseWithResolvers() {
  let _resolve, _reject
  const promise=new Promise((resolve, reject)=>{
    _resolve=resolve
    _reject=reject
  })
  return {promise, resolve: _resolve, reject: _reject}
}

function assert(x) {
  if(!x) throw new Error('Uncaught AssertionError [ERR_ASSERTION]: '+x+' == true')
}

async function rs2Buffer(rs) {
  const def=PromiseWithResolvers()
  const buf=[]
  rs.on('data', b=>buf.push(b))
  rs.on('end', _=>{
    def.resolve(Buffer.concat(buf))
  })
  rs.on('error', e=>{
    def.reject(e)
  })
  return def.promise
}

module.exports={
  readTextFile,
  sleep,
  mtime,
  md5,
  safe_path,
  fileExists,
  generate_uuid,
  getExtension,
  getLocalIpv4Addresses,
  PromiseWithResolvers,
  assert,
  rs2Buffer,
}
