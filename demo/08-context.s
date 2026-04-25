<?js
// 请求上下文变量示例
// 使用内置的 $_ 变量获取请求信息

echo('Request URL: ' + $_PATHNAME);
echo('<br>Query: ' + JSON.stringify($_QUERY));
echo('<br>Request File: ' + $_REQUEST_FILE.fullname);
echo('<br>Work Dir: ' + $_WORKDIR);
echo('<br>SPTC Version: ' + __SPTC_VERSION__);
?>
<!DOCTYPE html>
<html>
<head>
  <title>Request Context</title>
</head>
<body>
  <h1>Request Context</h1>
  <pre><?js echo(JSON.stringify($_RAW_REQUEST.headers)) ?></pre>
</body>
</html>