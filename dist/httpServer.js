const {
	fpm,
	safe_path,
	fileExists,
	getExtension,
	listdir,
	assert,
}=require('../utils')
const {executeSptcFile}=require('../engine')

process.on('uncaughtException', e=>{
  console.log('uncaughtException:', e)
})

function FastCGI_FPM(n, port, locally, option={}) {
	option.env={
		RUNTIME: 'FastCGI_FPM',
	}
	option.workers=n
	fpm(n, _=>FastCGI(port, locally, option))
}

function FastCGI(port, locally, option) {
	const http=require('http')
	const path=require('path')
	const {
		serverDir='.',
		routerEntry=null,
		..._option
	}=option
	_option.env=_option.env || {
		RUNTIME: 'FastCGI',
	}
	_option.srvDir=path.resolve(serverDir)
	_option.router=routerEntry? safe_path(_option.srvDir, routerEntry): null
	http.createServer((req, res)=>{
		CGI(req, res, _option)
	}).listen(port, locally? '127.0.0.1': '0.0.0.0')
}

function CGI(req, res, option) {
	const {
		srvDir,
		exts=['.s', '.sptc', '.sjs'],
		debug=false,
		router=null,
		traverse=false,
		env,
	}=option
	const [reqCtx, handler]=buildRequestContext(req, res, {
		srvDir,
		debug,
		env,
		isRouterMode: router,
	})
	const file=reqCtx.$_REQUEST_FILE || {}
	const fn=router || file.fullname

  function _executeFile(fn) {
	  const ext=getExtension(fn)
  	if(!exts.includes(ext)) {
			if(!debug) {
  	  	res.writeHead(403, {'content-type': 'text/plain'})
    		res.end(`extensions does not match: \`${ext}\``)
			}else{
				fsResponse(fn, res)
			}
		  return
	  }
  	executeSptcFile(fn, reqCtx, handler)
  }

	if(fileExists(fn)) {
		_executeFile(fn)
		return
	}

  if(!debug && !traverse) {
  	res.writeHead(404, {'content-type': 'text/html'})
	  res.end(`<h3>File does not exist: \`${router || file.pathname}\`</h3>`)
	  return
  }

	for(let e of exts) {
	  if(!fileExists(fn+'/index'+e)) continue
    _executeFile(fn+'/index'+e)
	  return
	}

  res.writeHead(404, {'content-type': 'text/html'})
	res.end(traverseDirectory(srvDir, file.pathname, exts, debug))

}

function NodeCGI(filename, defines) {
	const [reqCtx]=buildRequestContext({
		url: filename,
		headers: {},
	}, null, {
		srvDir: __dirname,
		debug: true,
		env: {
			RUNTIME: 'NodeCGI',
		},
		isRouterMode: true,
	})
	executeSptcFile(reqCtx.$_REQUEST_FILE.pathname, reqCtx, {
		write: x=>process.stdout.write(x),
		onError: e=>console.log(e),
		__DEV__: true,
		macroOption: {
			defs: defines.split(',').map(x=>x.trim()).filter(x=>x),
		},
	})
}

function buildRequestContext(req, res, {srvDir, debug, env, isRouterMode}) {
	const {fullname, pathname, query}=getRequestFile(req, srvDir)
	const reqCtx={
		$_RAW_REQUEST: req,
		$_RAW_RESPONSE: res,
		$_ENV: env,
		$_REQUEST_FILE: {
			fullname,
			pathname,
		},
		$_WORKDIR: srvDir,
		$_QUERY: query,
		$_PATHNAME: pathname,
	}
	reqCtx.$_GLOBAL=reqCtx

	const state={
		statusCode: 200,
		statusText: 'OK',
		responseHeaders: {'content-type': 'text/html; charset=utf8'},
		error: null,
		headerFlushed: false,
		isSendFile: false,

		is_debug: debug,
	}
	function flushHeader() {
		if(state.headerFlushed) return;
		state.headerFlushed=true
		res.writeHead(state.statusCode, state.statusText, state.responseHeaders)
	}

	reqCtx.setStatus=(code, text)=>{
		state.statusCode=code
		if(text!==undefined) state.statusText=text
	}
  reqCtx.sendFile=(fn, headers)=>{
  	state.headerFlushed=true
  	state.isSendFile=true
  	const ws=fsResponse(fn, res, headers)
  	ws.on('error', e=>handler.onError(e))
  	ws.on('end', _=>res.end())
  }
	reqCtx.setResponseHeaders=headers=>{
		Object.assign(state.responseHeaders, headers)
	}
	reqCtx.getResponseStatus=_=>{
		return [state.statusCode, state.statusText]
	}
	reqCtx.getResponseHeaders=_=>{
		return state.responseHeaders
	}

	reqCtx.flushHeader=_=>{
		flushHeader()
	}
	reqCtx.setDebug=x=>{
		state.is_debug=x
	}
	reqCtx.isDebug=_=>state.is_debug
	reqCtx.withCache=createWithCacheStore()

	const handler={
		write: x=>{
			flushHeader()
			res.write(x)
		},
		end: _=>{
			if(state.isSendFile) return;
			flushHeader()
			res.end()
		},
		onError: e=>{
			if(state.is_debug) console.log(e)
			flushHeader()
			res.end(state.is_debug? e.stack: '')
		},
		isEntry: true,
		__DEV__: debug? true: false,
	}

	return [reqCtx, handler]
}
function getRequestFile(req, srvDir) {
	const _url=req.url
	const url=require('url')
  const qs=require('querystring')
  const {pathname, query}=url.parse(_url)
	return {
		fullname: safe_path(srvDir, pathname),
		pathname,
    query: qs.parse(query) || {},
	}
}
const cacheStore={}
function createWithCacheStore() {
	const withCache=(fn, k, v)=>{
		assert(k)
		assert(v)
		assert(typeof fn==='function')
	  const o=cacheStore
		if(!o.hasOwnProperty(k) || o[k].v!==v) {
			o[k]={v, x: fn()}
		}
		return o[k].x
	}
	return withCache
}

function fsResponse(fn, res, headers={}) {
	const fs=require('fs')
	const ext=getExtension(fn)
	res.writeHead(200, {
		'content-type': ({
			'.js': 'text/javascript',
			'.css': 'text/css',
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
			'.html': 'text/html',
		})[ext] || 'application/octet-stream',
		...headers,
	})
	const ws=fs.createReadStream(fn)
	ws.pipe(res)
	return ws
}

function traverseDirectory(ref, dir, exts, debug) {
  let ret=`
<!doctype html>
<meta charset=utf8 />
<style>*{line-height: 1.8;}b{font-size: 16px;}a{font-size: 18px; color: #2222ff; cursor: pointer;}a.dir{color: #555555;}</style>`
  const {dirs, files, error}=listdir(ref, dir)
  ret+=`<a style="font-size: 22px;" href="${dir!=='/'? '../': ''}">back</a>`
  ret+=`<h3>${dir}</h3>`
  if(error) {
  	ret+=`<h3>${error.message}</h3>`
  }else{
    for(let i=0; i<dirs.length; i++) {
		  ret+=`<a class="dir" href="${encodeURIComponent(dirs[i].fn)}/">${dirs[i].fn}</a> <br/>`
  	}
  	for(let i=0; i<files.length; i++) {
  		if(debug || exts.includes(getExtension(files[i].fn))) {
  			ret+=`<a href="${encodeURIComponent(files[i].fn)}">${files[i].fn}</a> <br/>`
  		}else{
  	  	ret+=`<b>${files[i].fn}</b> ${files[i].size} <br/>`
  		}
	  }
  }
  return ret
}

module.exports={
	FastCGI,
	FastCGI_FPM,
	NodeCGI,
}
