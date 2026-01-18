<?js
/*
function test(key, fn) {
  console.log('--> '+key+' :')
  try{
    const p=[GLOBAL, THIS, TOP].indexOf(o)
    console.log(p<0? '-- pass --': ('  -->'+['GLOBAL', 'this', 'globalThis'][p]))
  }catch(e) {
    console.log('-- pass --')
  }
}


test('nodeGlobal', _=>parseInt.constructor('return global')())
test('nodeGlobalThis', _=>parseInt.constructor('return this')())
test('realGlobal', _=>Function('return global')())
test('realGlobalThis', _=>Function('return this')())
test('controllableGlobal', _=>global)
test('currentContext', _=>globalThis)
test('currentThis', _=>this)

*/


#ifdef W1
console.log('W1 defined!')
process.exit()
#endif


console.log(_x)
       function sleep(t) {
         return new Promise(r=>setTimeout(r, t))
       }

__autoload(varname=>{
	if(varname==='TestModel') return './TestModel.sjs'
})

const v=include('./ee.sjs', {P: 55})
echo('['+v.ee+']')

Sync.Push((async _=>{
  echo(aa, 'LLL')
  flush()
  echo(1919)
  var_dump({x: 3})
  console.log(">>", eval+'')
  defer(_=>{
    console.log('defer')
  })
  flush()
	await sleep(2e3)
	echo('SLEEP=1e3')
	setTimeout(_=>{
	  echo(2929)
	}, 2e3)
})())
