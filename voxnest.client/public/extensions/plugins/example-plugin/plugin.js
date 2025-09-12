// 示例插件脚本
console.log('示例插件脚本已加载');

// 为插件按钮添加交互
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.example-plugin-button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      alert('示例插件按钮被点击了！');
    });
  });
});
