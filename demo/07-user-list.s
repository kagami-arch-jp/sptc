<?js
// 模块导出示例
// 使用 exports() 导出数据，供 include() 的调用者使用

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

const getUser = (id) => users.find(u => u.id === id);

// 导出模块
exports({
  users: users,
  getUser: getUser,
  count: users.length,
});
?>

<h1>User List</h1>
<p>Total users: <?js echo(count) ?></p>
<ul>
<?js for (const u of users) { ?>
  <li><?js echo(u.name) ?></li>
<?js } ?>
</ul>