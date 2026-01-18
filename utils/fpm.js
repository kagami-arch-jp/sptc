const cluster=require('cluster')
function fpm(n, handler) {
  if(cluster.isWorker) {
    handler()
		return
  }
  function _fork() {
    cluster.fork()
  }
  cluster.on('exit', _fork)
  for(let i=n; i--; ) _fork()
}
module.exports={
  fpm,
}
