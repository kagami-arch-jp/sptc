exports.A=_=>'m1 -> A'

console.log('global.XXX - global.YYY', global.XXX, global.YYY)

function test(key, fn) {
	console.log('--> '+key+' :')
	try{
    console.log(fn())
	}catch(e) {
		console.log(' -- pass --')
	}
}

test('nodeGlobal', _=>parseInt.constructor('return global')())
test('nodeGlobalThis', _=>parseInt.constructor('return this')())
test('realGlobal', _=>Function('return global')())
test('realGlobalThis', _=>Function('return this')())
test('controllableGlobal', _=>global)
test('currentContext', _=>globalThis)
test('currentThis', _=>this)
