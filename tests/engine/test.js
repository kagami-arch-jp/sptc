const {
	executeSptcFile,
	executeSptcFileEx,

  securityPatch,
}=require('../../engine')

global.XXX=22

securityPatch()

global.YYY=22

/*
executeSptcFile(__dirname+'/a.sjs', {aa: 'AAA', GLOBAL: global, THIS: this, TOP: globalThis}, {
	write: x=>process.stdout.write(x),
	end: _=>console.log('>>end'),
	onError: e=>console.log(e),
})
*/

const option={
	__DEV__: true,
	macroOption: {
		//defs: ['W1'],
	},
}
executeSptcFileEx(__dirname+'/a.sjs', {aa: 'AAA', GLOBAL: global, THIS: this, TOP: globalThis}, option).then(out=>{
	console.log(out, '<<END')
}, e=>{
	console.log(e)
})

