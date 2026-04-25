// module.exports 会通过 include_js 的返回值被导出
module.exports = {
  add: (a, b) => a + b,
  random: () => Math.random().toFixed(4),
  greet: (name) => `Hello, ${name}!`,
};

// 声明式函数会成为全局变量，同样会被 include_js 导出
function sub(a, b) {
  return a-b
}

// exports.xxx 也会被 include_js 导出 (exports === module.exports)
exports.mul=(x, y)=>{
  return x*y
}
