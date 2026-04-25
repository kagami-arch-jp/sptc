<?js
// 使用 include_js() 包含 JavaScript 文件

// 包含工具函数文件
const utils = include_js('./utils.js');

// 使用工具函数
const result = utils.add(10, 20);
echo('Result: ' + result);
?>
<p>Random: <?js echo(utils.random()) ?></p>

<p>Sub: <?js echo(utils.sub(5, 3)) ?></p>

<p>Mul: <?js echo(utils.mul(5, 3)) ?></p>
