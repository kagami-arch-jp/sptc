<?js
// 异步不阻塞响应示例
// 默认情况下，异步操作不会等待完成就返回响应

echo('Start...');

// 设置定时器（不会阻塞响应）
setTimeout(_ => console.log('Async task done'), 1000);

// 主逻辑执行完立即返回响应，不等待 setTimeout
echo('End - response sent immediately');
?>
<p>This response was sent without waiting for the async task.</p>