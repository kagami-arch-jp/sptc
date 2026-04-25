<?js
// 简单路由器示例
// 根据请求路径返回不同的响应

const path = $_PATHNAME;
const query = $_QUERY;

setResponseHeaders({'Content-Type': 'text/html; charset=utf-8'});

if (path === '/' || path === '/index') {
  echo('<h1>Welcome to Home</h1>');
  echo('<p><a href="/about">About</a></p>');
  echo('<p><a href="/api/users">API</a></p>');
} else if (path === '/about') {
  echo('<h1>About Page</h1>');
  echo('<p>This is a Simple Page.</p>');
  echo('<p><a href="/">Back</a></p>');
} else if (path === '/api/users') {
  setResponseHeaders({'Content-Type': 'application/json'});
  echo(JSON.stringify([
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'},
  ]));
} else {
  setStatus(404, 'Not Found');
  echo('<h1>404 - Page Not Found</h1>');
  echo('<p><a href="/">Go Home</a></p>');
}
?>