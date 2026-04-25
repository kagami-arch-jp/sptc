<?js
// 响应控制示例
// 使用 setStatus, setResponseHeaders, sendFile 等函数控制响应

// 设置 HTTP 状态码
setStatus(200, 'OK');

// 设置响应头
setResponseHeaders({
  'Content-Type': 'application/json; charset=utf-8',
  'X-Custom-Header': 'value',
});

// 返回 JSON 数据
echo(JSON.stringify({
  status: 'success',
  data: { message: 'Hello World' },
  timestamp: Date.now(),
}));
// 注意: sendFile 会覆盖上面的 echo 内容
// sendFile('./files/data.json');
?>
<!DOCTYPE html>
<html>
<body>
  <p>This content will be replaced by JSON above if uncommented.</p>
</body>
</html>