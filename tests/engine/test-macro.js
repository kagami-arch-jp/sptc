const {
	executeSptcMacroFile,
}=require('../../engine')

console.log(executeSptcMacroFile('aa.js', {defs: ['XX']}, `
#ifdef XX
mkmk
#def yy
#endif

#ifdef yy
yy is defined
#else
yy is undefined
#endif
`))
