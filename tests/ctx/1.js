const sptc=require('../..')
const {sub}=sptc.includeSptcFile(__dirname+'/a.s', {w: 100})
const {add}=sptc.includeJsFile(__dirname+'/a.js', {w: 500})

console.log('add', add(3, 4))
console.log('sub', sub(10, 7))
