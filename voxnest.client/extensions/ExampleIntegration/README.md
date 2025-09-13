# VoxNest 示例主题

这是一个展示 VoxNest 扩展框架主题功能的示例主题。

## 功能

- ✅ 头部通知按钮 (带Badge计数)
- ✅ 首页功能亮点横幅 (可关闭)
- ✅ 快速操作侧边栏面板
- ✅ 底部框架状态指示器
- ✅ 完整的生命周期钩子支持

## 文件结构

```
example-theme/
├── ExampleIntegration.tsx    # 主主题文件（TypeScript/React）
├── manifest.json            # 主题配置清单
└── README.md               # 说明文档
```

## 主题配置

```json
{
  "id": "voxnest-example-theme",
  "name": "VoxNest 示例主题",
  "type": "theme",
  "version": "1.0.0",
  "main": "ExampleIntegration.tsx"
}
```

## 使用的槽位

- `header.right`: 通知按钮
- `footer.right`: 状态指示器
- `content.before`: 功能亮点横幅（首页）
- `sidebar.top`: 快速操作面板（已登录用户）

## 权限申请

- `slots:register`: 注册组件到槽位
- `storage:local`: 访问本地存储
- `ui:message`: 显示用户消息
- `lifecycle:hooks`: 使用生命周期钩子

## 组件特性

### 通知按钮
- Badge 样式的计数显示
- 点击减少未读数量
- 响应式设计

### 功能亮点横幅
- 渐变背景设计
- 可关闭功能（今日不再显示）
- 仅在首页显示
- 响应式布局

### 快速操作面板
- 卡片式设计
- 仅对已登录用户显示
- 包含常用操作快捷方式

### 状态指示器
- 动态脉冲动画
- 实时显示框架状态

## 生命周期钩子

```typescript
hooks: {
  'framework:ready': (context) => { /* 框架就绪 */ },
  'components:ready': (context) => { /* 组件系统就绪 */ },
  'app:start': (context) => { /* 应用启动 */ },
  'app:started': (context) => { /* 应用已启动 */ },
  'app:destroy': (context) => { /* 应用销毁清理 */ }
}
```

## 样式系统

- 主色调: #1890ff
- 圆角: 12px
- 渐变色: #667eea -> #764ba2
- 支持暗色模式、响应式、动画

这个主题展示了如何创建一个功能丰富的 VoxNest 主题扩展，包括多个UI组件、条件渲染、本地存储、生命周期管理等高级功能。
