<?js
// 同步队列示例 (Sync.Push)
// 使用 Sync.Push 添加 Promise 到同步队列，系统会等待 Promise 完成后再发送响应

echo('Start...');

// 使用 Sync.Push 将异步任务加入同步队列
// 系统会等待此 Promise 完成后再发送响应
Sync.Push((async _ => {
  await new Promise(r => setTimeout(r, 2000));
  echo('Async task completed after 2 seconds');
})());

echo('This will appear after the async task completes');
?>
<!DOCTYPE html>
<html>
<body>
  <p>Page rendered</p>
</body>
</html>