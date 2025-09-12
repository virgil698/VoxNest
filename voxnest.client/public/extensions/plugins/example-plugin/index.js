// 示例插件主入口文件
const ExamplePlugin = {
  name: 'example-plugin',
  
  // 注册插件到框架的方法
  register: function(framework) {
    console.log('正在注册示例插件到扩展框架...');
    
    // 创建插件组件
    const PluginComponent = function(props) {
      return React.createElement('div', {
        className: 'example-plugin'
      }, [
        React.createElement('h3', { key: 'title' }, '🎉 示例插件'),
        React.createElement('p', { key: 'desc' }, '这是一个从前端扩展目录加载的插件'),
        React.createElement('button', {
          key: 'btn',
          className: 'example-plugin-button',
          onClick: () => {
            alert('示例插件功能正常工作！');
            console.log('示例插件按钮被点击');
          }
        }, '点击测试')
      ]);
    };
    
    // 注册组件到header.right槽位
    framework.slots.register('header.right', {
      component: PluginComponent,
      source: 'example-plugin',
      name: '示例插件组件',
      priority: 5
    });
    
    console.log('示例插件注册完成');
  }
};

// 导出插件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExamplePlugin;
} else if (typeof exports !== 'undefined') {
  exports.default = ExamplePlugin;
} else {
  // 全局变量方式
  window.ExamplePlugin = ExamplePlugin;
}

ExamplePlugin;
