# VoxNest 前端配置系统

重构后的前端配置系统，将配置定义与处理逻辑清晰分离。

## 文件结构

```
src/
├── config.ts           # 纯配置定义（新增）
└── config/
    ├── index.ts         # 配置管理逻辑
    ├── init.ts          # 配置初始化
    └── README.md        # 此文档
```

## 主要改进

### 1. 分离关注点
- **`config.ts`**: 纯配置定义，不包含业务逻辑
- **`config/index.ts`**: 配置管理逻辑，支持加载、验证、同步
- **`config/init.ts`**: 简化的初始化逻辑

### 2. 统一配置接口
```typescript
interface AppConfig {
  app: { name, version, environment, debug }
  api: { baseUrl, timeout, retryAttempts, retryDelay }
  server: { devPort, backendHttpPort, backendHttpsPort, useHttps }
  ui: { theme, locale, pageSize, enableAnimations }
  features: { enableDevTools, enableHealthCheck, enableLogging, logLevel }
  storage: { tokenKey, userKey, configKey }
}
```

### 3. 环境变量支持
```env
VITE_API_BASE_URL=http://localhost:5201
VITE_BACKEND_HTTP_PORT=5201
VITE_BACKEND_HTTPS_PORT=7042
VITE_USE_HTTPS=false
VITE_THEME=light
VITE_LOG_LEVEL=debug
```

## 使用方法

### 基本使用
```typescript
import { getAppConfig, getApiBaseUrl } from './config';

// 获取完整配置
const config = getAppConfig();

// 获取特定配置
const apiUrl = getApiBaseUrl();
```

### 更新配置
```typescript
import { updateAppConfig, saveConfig } from './config';

// 更新配置
updateAppConfig({
  ui: {
    theme: 'dark',
    pageSize: 20
  }
});

// 手动保存（updateAppConfig 会自动保存）
saveConfig();
```

### 向后兼容
```typescript
import { getConfig, configManager } from './config';

// 旧的 API 仍然可用
const oldConfig = getConfig(); // FrontendConfig
const manager = configManager;
```

### 配置验证
```typescript
import { validateConfig } from './config';

const validation = validateConfig();
if (!validation.isValid) {
  console.error('配置错误:', validation.errors);
}
```

## 配置初始化

在应用启动时调用：

```typescript
import { initializeConfig, startConfigHealthCheck } from './config/init';

// 初始化配置
await initializeConfig();

// 启动健康检查（可选）
startConfigHealthCheck();
```

## 配置特性

### 1. 智能默认值
- 开发环境默认启用调试和日志
- 生产环境默认禁用敏感功能
- 自动构建 API 基础 URL

### 2. 配置层级
优先级（从高到低）：
1. 保存的用户配置（localStorage）
2. 环境变量
3. 默认配置

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 配置验证规则
- 运行时类型检查

### 4. 可配置特性
- 日志记录可开关
- 健康检查可配置间隔
- 开发工具可控制启用

## 迁移指南

### 从旧配置系统迁移

1. **导入更改**：
```typescript
// 旧的
import { configManager } from './config';

// 新的（推荐）
import { getAppConfig, getApiBaseUrl } from './config';

// 向后兼容（仍可用）
import { configManager, getConfig } from './config';
```

2. **API 更改**：
```typescript
// 旧的
const config = configManager.config;
const apiUrl = configManager.getApiBaseUrl();

// 新的
const config = getAppConfig();
const apiUrl = getApiBaseUrl();
```

3. **新功能**：
```typescript
// 访问新的配置节
const features = getAppConfig().features;
const ui = getAppConfig().ui;

// 批量更新配置
updateAppConfig({
  features: { enableLogging: false },
  ui: { theme: 'dark' }
});
```

## 配置示例

### 开发环境配置
```typescript
{
  app: {
    name: 'VoxNest',
    environment: 'development',
    debug: true
  },
  features: {
    enableDevTools: true,
    enableLogging: true,
    logLevel: 'debug'
  }
}
```

### 生产环境配置
```typescript
{
  app: {
    environment: 'production',
    debug: false
  },
  features: {
    enableDevTools: false,
    enableLogging: true,
    logLevel: 'info'
  }
}
```