<?js


$_GLOBAL['x']='999x'
configSptcFileCache('eob0', 100)

echo($_REQUEST_FILE)

define('DDD', 2)
include(__dirname+'/cc.s')


const p=include(__dirname+'/dd.s')
console.log('p.aaa=', p.aaa)

echo('oaawecR=>'+RRR, Math.random())

/*

echo('aaaa<pre>')
var_dump($_GLOBAL, this)

function sleep(t) {
	return new Promise(r=>setTimeout(r, t))
}

Sync.Push((async _=>{
	for(let i=0; i<10; i++) {
  	echo(i*1e8+'<br/>')
  	flush()
  	await sleep(1e3)
	}
	echo('--done--')
})())
*/