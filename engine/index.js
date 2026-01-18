const Compiler=require('./compiler')
const Interpreter=require('./interpreter')
const CompilerMacro=require('./compiler-macro')
const InterpreterMacro=require('./interpreter-macro')

const {md5, formatOutput}=require('../utils')

function executeSptcFile(filename, payload, option={}) {
	const {__DEV__, macroOption, mockFileContent}=option

	// using macro preprocessor or provides a mock content will critically degrade the performance
	// if you really want to use them, specified the option.__DEV__ as true
	const _option=__DEV__!==true? {}: {
	  mockFileContent,
		contentWrapper: macroOption?
		  content=>executeSptcMacroFile(filename, macroOption, content):
		  undefined,
  }

  if(option.isEntry) {
  	_option.isEntry=option.isEntry
  }

	const [ctx0, vm]=Compiler.compileSptcFile(filename, _option)
  const [ctx, priv]=Interpreter.buildContext({...payload, ...ctx0}, option)
  Interpreter.executeVm(vm, ctx, priv)
  return ctx
}

function executeSptcFileEx(...x) {
	const e=new Promise((resolve, reject)=>{
  	const {end, onError}=(x[2]=x[2] || {})
  	const buf=[]
  	x[2].write=(...x)=>{
  		buf.push(...x)
  	}
  	x[2].end=_=>{
  		end && end()
  		resolve(formatOutput(buf))
  	}
  	x[2].onError=e=>{
  		onError && onError(e)
  		reject(e)
  	}
	  executeSptcFile(...x)
	})
	e.catch(_=>null)
	return e
}

function executeSptcMacroFile(filename, config, mockContent) {
	const ast=CompilerMacro.compileSptcMacroFile(filename, mockContent)
	const ctx=InterpreterMacro.buildMacroContext({filename, ...config})
	return InterpreterMacro.executeMacroContext(ctx, ast)
}

function includeJsFile(filename, payload) {
  return Interpreter.buildContext({}, {})[0].include_js(filename, payload)
}

function includeSptcFile(filename, payload) {
	return executeSptcFile(filename, payload)
}

module.exports={
	...Compiler,
	...Interpreter,
	...CompilerMacro,
	...InterpreterMacro,
	executeSptcFile,
	executeSptcFileEx,
	executeSptcMacroFile,
	includeSptcFile,
	includeJsFile,
	version: require('../package.json').version
}
