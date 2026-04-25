<?js
const name = 'World';
const now = new Date();
?>
<!DOCTYPE html>
<html>
<head>
  <title>Hello <?js echo(name) ?></title>
</head>
<body>
  <h1>Hello, <?js echo(name) ?>!</h1>
  <p>Current time: <?js echo(now.toISOString()) ?></p>
</body>
</html>