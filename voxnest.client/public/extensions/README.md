# VoxNest 扩展系统 v2.0

## 🎉 新功能概览

VoxNest 扩展系统已全面升级，现在支持更强大的功能：

### ✨ 核心特性

1. **全界面控制能力**
   - 支持 20+ 预定义槽位（页面头部、侧边栏、覆盖层等）
   - 允许增加、修改、删除任何界面组件
   - 支持样式注入和主题管理

2. **多文件扩展支持**
   - 支持 TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)
   - 支持样式文件 (`.css`, `.scss`, `.sass`)
   - 支持资源文件和依赖管理
   - 条件加载和异步加载

3. **增强的样式管理**
   - CSS 变量注入
   - 动态主题切换
   - 辅助功能支持
   - 响应式设计适配

## 📦 示例扩展

### 1. Cookie 同意横幅插件

**位置**: `./CookieConsent/`

**功能特性**:
- 符合 GDPR/CCPA 规定
- 细粒度 Cookie 分类管理
- 自定义样式和位置
- 完整的同意管理界面

**主要文件**:
- `manifest.json` - 扩展配置
- `CookieConsent.tsx` - 主横幅组件
- `CookieSettings.tsx` - 详细设置界面
- `cookieManager.ts` - Cookie 管理逻辑
- `styles.css` - 样式文件

### 2. 明暗模式主题扩展

**位置**: `./DarkModeTheme/`

**功能特性**:
- 智能主题切换
- 系统偏好检测
- 定时切换功能
- 辅助功能支持
- 自定义颜色方案

**主要文件**:
- `manifest.json` - 扩展配置
- `ThemeManager.ts` - 主题管理器
- `ThemeToggle.tsx` - 切换器组件
- `ThemeCustomizer.tsx` - 定制界面
- `light-theme.css` - 浅色主题
- `dark-theme.css` - 深色主题
- `animations.css` - 动画效果

## 🛠️ 开发指南

### 扩展清单格式 (manifest.json)

```json
{
  "id": "your-extension-id",
  "name": "扩展名称",
  "version": "1.0.0",
  "author": "作者",
  "description": "扩展描述",
  "type": "plugin" | "theme",
  
  "files": [
    {
      "path": "main.tsx",
      "type": "tsx",
      "order": 1,
      "condition": "可选的加载条件",
      "async": false
    }
  ],
  
  "config": {
    // 扩展配置
  },
  
  "permissions": [
    "storage.local",
    "cookies.read"
  ]
}
```

### 创建插件扩展

```typescript
// main.tsx
export function initializeYourPlugin(framework: any) {
  // 注册组件到槽位
  framework.slots.register('app.header', {
    component: YourComponent,
    source: 'your-extension-id',
    name: '组件名称',
    priority: 100
  });

  // 注入样式
  framework.slots.injectStyle({
    id: 'your-styles',
    source: 'your-extension-id',
    content: `
      .your-class {
        color: var(--voxnest-color-primary);
      }
    `
  });
}

export default initializeYourPlugin;
```

### 可用的槽位

```typescript
enum UISlots {
  // 全局区域
  APP_ROOT = 'app.root',
  APP_HEADER = 'app.header',
  APP_FOOTER = 'app.footer',
  APP_SIDEBAR = 'app.sidebar',
  
  // 导航区域
  NAV_PRIMARY = 'nav.primary',
  NAV_USER = 'nav.user',
  
  // 内容区域
  CONTENT_HEADER = 'content.header',
  CONTENT_MAIN = 'content.main',
  
  // 覆盖层
  MODAL_ROOT = 'modal.root',
  OVERLAY_ROOT = 'overlay.root',
  
  // 管理面板
  ADMIN_HEADER = 'admin.header',
  ADMIN_SIDEBAR = 'admin.sidebar',
  
  // 更多...
}
```

## 🎨 样式管理

### 使用 CSS 变量

```css
.your-component {
  background: var(--voxnest-color-background);
  color: var(--voxnest-color-text);
  border: 1px solid var(--voxnest-color-border);
}
```

### 主题适配

```css
.voxnest-theme-light .your-component {
  /* 浅色模式样式 */
}

.voxnest-theme-dark .your-component {
  /* 深色模式样式 */
}
```

## 🔧 高级功能

### 样式注入

```typescript
framework.slots.injectStyle({
  id: 'custom-styles',
  source: 'your-extension',
  content: '.custom { color: red; }',
  priority: 100
});
```

### 组件修改

```typescript
// 修改现有组件
framework.slots.modifyComponent('nav.user', 'source-id', {
  props: { newProp: 'value' }
});

// 替换组件
framework.slots.replaceComponent('nav.user', 'old-source', newRegistration);

// 包装组件
framework.slots.wrapComponent('nav.user', 'source-id', wrapperRegistration);
```

### 槽位可见性控制

```typescript
// 隐藏槽位
framework.slots.setSlotVisibility('admin.sidebar', false);

// 检查槽位可见性
const isVisible = framework.slots.getSlotVisibility('admin.sidebar');
```

## 🚀 部署和测试

1. 将扩展文件放入 `extensions/` 目录
2. 在 `extensions.json` 中添加扩展配置
3. 重启开发服务器
4. 检查浏览器控制台确认扩展加载成功

## 📚 API 参考

### 框架 API

- `framework.slots` - 槽位管理器
- `framework.styleManager` - 样式管理器
- `framework.resourceLoader` - 资源加载器
- `framework.logger` - 日志记录器

### 全局 API

- `window.VoxNestExtensions` - 扩展框架接口
- `window.VoxNestCookieManager` - Cookie 管理器
- `window.VoxNestTheme` - 主题管理器

## 🔍 调试

```javascript
// 在浏览器控制台中
VoxNestExtensions.getFramework().slots.debug();
VoxNestTheme.debug();
```

## ⚠️ 注意事项

1. 扩展 ID 必须唯一
2. 样式 ID 建议使用扩展 ID 作为前缀
3. 清理资源：扩展卸载时自动清理注册的组件和样式
4. 性能考虑：避免在高频触发的条件函数中进行复杂计算

---

*VoxNest 扩展系统 v2.0 - 让界面定制变得简单而强大！*