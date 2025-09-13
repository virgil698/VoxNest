# VoxNest 统一扩展系统

这是 VoxNest 的新一代统一扩展系统，将所有插件和主题整合在同一个目录下进行管理。

## 🏗️ 目录结构

```
extensions-unified/
├── extensions.json          # 统一扩展清单文件
├── README.md               # 本文件
├── demo-plugin/            # 演示插件
│   ├── DemoPlugin.tsx      # 插件主文件
│   ├── manifest.json       # 插件清单
│   └── README.md          # 插件说明
└── example-theme/          # 示例主题
    ├── ExampleIntegration.tsx  # 主题主文件
    ├── manifest.json          # 主题清单
    └── README.md             # 主题说明
```

## 📋 扩展清单 (extensions.json)

统一扩展清单文件包含以下信息：
- **元数据**: 版本、描述、更新时间等
- **扩展列表**: 所有可用扩展的完整信息
- **类型标识**: plugin（插件）或 theme（主题）
- **启用状态**: 可动态启用/禁用扩展
- **权限声明**: 扩展所需的权限
- **插槽声明**: 扩展使用的 UI 插槽

## 🔧 扩展类型

### 插件 (Plugin)
- **功能导向**: 提供具体的功能增强
- **UI 组件**: 通常添加按钮、工具栏等小型 UI 元素
- **示例**: 演示插件（添加设置按钮和版本信息）

### 主题 (Theme) 
- **视觉导向**: 提供整体的视觉和交互改进
- **布局组件**: 通常添加卡片、面板、高亮等大型 UI 组件
- **生命周期**: 支持应用生命周期钩子
- **示例**: 示例主题（添加通知、快速操作、功能高亮等）

## 🎯 插槽系统

扩展可以注册到以下插槽位置：

### 头部插槽
- `header.left` - 头部左侧
- `header.right` - 头部右侧

### 侧边栏插槽  
- `sidebar.top` - 侧边栏顶部
- `sidebar.bottom` - 侧边栏底部

### 内容插槽
- `content.before` - 内容区域前
- `content.after` - 内容区域后

### 页脚插槽
- `footer.left` - 页脚左侧
- `footer.right` - 页脚右侧

## 📦 扩展开发

### 创建新扩展

1. 在此目录下创建扩展文件夹：`mkdir my-extension`
2. 创建主文件：`touch my-extension/MyExtension.tsx`
3. 创建清单：`touch my-extension/manifest.json` 
4. 在 `extensions.json` 中注册扩展
5. 重启应用以加载新扩展

### 扩展清单格式

```json
{
  "id": "my-extension",
  "name": "我的扩展", 
  "version": "1.0.0",
  "type": "plugin|theme",
  "description": "扩展描述",
  "author": "作者",
  "main": "主文件.tsx",
  "enabled": true,
  "dependencies": [],
  "permissions": ["权限列表"],
  "tags": ["标签"],
  "slots": ["使用的插槽"],
  "capabilities": {
    "ui": true,
    "api": false
  }
}
```

## 🚀 加载机制

1. **发现**: 读取 `extensions.json` 获取所有扩展信息
2. **过滤**: 只加载启用的扩展  
3. **加载**: 动态加载扩展模块
4. **初始化**: 根据扩展类型执行相应初始化
5. **注册**: 注册扩展组件到相应插槽

## 📊 管理控制

- **启用/禁用**: 修改 `extensions.json` 中的 `enabled` 字段
- **优先级**: 通过扩展注册时的 `priority` 参数控制
- **依赖管理**: 通过 `dependencies` 字段声明依赖关系
- **权限控制**: 通过 `permissions` 字段限制扩展能力

## 🔄 升级说明

从旧的分离式结构（plugins/ + themes/）升级到统一结构：

1. ✅ 所有扩展移动到同一目录
2. ✅ 使用统一的 `extensions.json` 清单
3. ✅ 更新加载器逻辑支持新结构  
4. ✅ 保持所有现有功能不变
5. ✅ 增强管理和配置能力

---

**VoxNest 扩展系统 v2.0** - 统一、高效、可扩展！ 🎉
