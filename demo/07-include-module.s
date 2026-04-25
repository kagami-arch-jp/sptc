<?js
// 引用导出的模块
// 使用 include() 引用 .s 文件，获取导出数据

const userModule = include(__dirname + '/07-user-list.s');

echo('Loaded module with count: ' + userModule.count);
?>
<!DOCTYPE html>
<html>
<head>
  <title>User Module</title>
</head>
<body>
  <h1>User Module Test</h1>
  <?js echo(userModule.users[0].name) ?>
  <p>Get user 2: <?js echo(userModule.getUser(2).name) ?></p>
</body>
</html>
