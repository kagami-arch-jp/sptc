<?js
// 模板嵌套包含示例
// 使用 include() 包含其他 SPTC 模板文件

define('SITE_NAME', 'My Site');
?>
<!DOCTYPE html>
<html>
<head>
  <title><?js echo(SITE_NAME) ?></title>
</head>
<body>
  <header><?js include(__dirname + '/header.s') ?></header>
  <main>
    <p>Welcome to <?js echo(SITE_NAME) ?>!</p>
  </main>
  <footer><?js include(__dirname + '/footer.s') ?></footer>
</body>
</html>