
function formatOutput(buf, as_str=undefined) {
  const xbuf=[]
  const is_str=as_str===undefined?
    typeof buf[0]==='string':
    as_str
  for(let x of buf) {
    if(is_str && typeof x!=='string') x=x.toString('utf8')
    if(!is_str && typeof x==='string') x=Buffer.from(x)
    xbuf.push(x)
  }
  return is_str? xbuf.join(''): Buffer.concat(xbuf)
}

module.exports={
  formatOutput,
}
