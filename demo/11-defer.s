<?js
// 延迟执行示例 (defer)
// 使用 defer() 注册在响应发送后执行的清理函数

echo('<h1>Processing...</h1>');

// 模拟数据库连接
let dbConnected = true;

// 使用 defer 在响应发送后执行清理
defer(() => {
  if (dbConnected) {
    console.log('Closing database connection...');
  }
});

echo('<p>Response sent. Check console for cleanup.</p>');
?>