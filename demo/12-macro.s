<?js
// 宏预处理示例
// 在文件开头使用宏指令进行条件编译

#def DEBUG

#ifdef DEBUG
configSptcFileCache('debug_v1', 10);
console.log('Debug mode enabled');
#endif

#ifdef PROD
configSptcFileCache('prod_v1', 3600);
#endif

#ifndef PROD
const isProduction = false;
#else
const isProduction = true;
#endif
?>
<!DOCTYPE html>
<html>
<head>
  <title>Macro Demo</title>
</head>
<body>
  <h1>Macro Preprocessing Demo</h1>
  <p>Is Production: <?js echo(String(isProduction)) ?></p>
  <p>View source to see the macro directives at the top.</p>
</body>
</html>
