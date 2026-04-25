<?js
// 异步锁示例 (Sync.Lock)
// 使用 Sync.Lock 控制响应发送时机，调用 release() 后才发送响应

const release = Sync.Lock();

// 模拟异步操作（如数据库查询）
(async _ => {
  // 模拟耗时操作
  await new Promise(r => setTimeout(r, 2000));
  
  // 完成后调用 release() 发送响应
  release();
})();

echo('Wait for async task to complete before sending response...');
?>Done! Response sent after async task.