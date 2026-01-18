<?js
exports({
	ee: 444,
})
echo('---EE--', P*1e8)
defer(_=>{
	console.log("::EE<<")
})

echo('----------->', TestModel.test())

Sync.Push(new Promise(r=>{
	setTimeout(_=>{
  	echo('xxxxxxxxx')
  	r()
	}, 2e3)
}))
