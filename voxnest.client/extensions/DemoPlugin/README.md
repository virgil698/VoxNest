# VoxNest 演示插件

这是一个展示 VoxNest 扩展框架基本功能的演示插件。

## 功能

- ✅ 在页面头部右侧显示"演示"按钮
- ✅ 点击按钮显示成功消息
- ✅ 在页面底部显示框架版本信息
- ✅ 集成日志系统记录用户操作

## 文件结构

```
demo-plugin/
├── DemoPlugin.tsx     # 主插件文件（TypeScript/React）
├── manifest.json      # 插件配置清单
└── README.md         # 说明文档
```

## 插件配置

```json
{
  "id": "voxnest-demo-plugin",
  "name": "VoxNest 演示插件",
  "type": "plugin",
  "version": "1.0.0",
  "main": "DemoPlugin.tsx"
}
```

## 使用的槽位

- `header.right`: 演示按钮
- `footer.right`: 版本信息

## 权限申请

- `slots:register`: 注册组件到槽位
- `logs:write`: 写入操作日志
- `ui:message`: 显示用户消息

## 技术特性

- 使用 React Hooks 和 TypeScript
- 集成 Ant Design 组件库
- 支持响应式设计
- 使用 VoxNest 日志系统

这个插件展示了如何创建一个完整的 VoxNest 扩展，包括UI组件、用户交互、日志记录等核心功能。
