# VoxNest 前端配置管理系统

## 功能概述

这个配置管理系统实现了前后端端口配置的统一管理，解决了之前CORS错误和端口不匹配的问题。

## 文件结构

```
src/config/
├── index.ts       # 核心配置管理类
├── init.ts        # 配置初始化和健康检查
└── README.md      # 说明文档
```

## 主要功能

### 1. 统一配置管理 (`index.ts`)

- **FrontendConfig**: 前端配置接口，包含端口配置
- **ConfigManager**: 单例配置管理器
- **自动端口检测**: 根据配置自动生成API基础URL
- **配置验证**: 检查端口范围和冲突

### 2. 配置初始化 (`init.ts`)

- **启动时初始化**: 应用启动时自动验证和同步配置
- **健康检查**: 定期检查配置有效性
- **错误处理**: 配置失败时的降级策略

### 3. 环境变量支持

通过 `.env.development` 文件配置：
```env
VITE_API_BASE_URL=http://localhost:5201
VITE_BACKEND_HTTP_PORT=5201
VITE_BACKEND_HTTPS_PORT=7042
VITE_USE_HTTPS=false
DEV_SERVER_PORT=54976
```

## 使用方法

### 基本用法

```typescript
import { configManager, getApiBaseUrl } from '@/config';

// 获取API基础URL
const apiUrl = getApiBaseUrl();

// 获取完整配置
const config = configManager.config;

// 手动同步配置
await configManager.syncWithBackend();
```

### 配置状态检查

```typescript
import { getConfigStatus } from '@/config/init';

const status = getConfigStatus();
console.log('配置状态:', status);
```

## 配置流程

1. **应用启动** → 加载环境变量
2. **配置验证** → 检查端口范围和冲突
3. **后端同步** → 尝试从后端获取配置
4. **配置合并** → 合并前后端配置
5. **健康检查** → 定期验证配置有效性

## 故障排除

### 常见问题

1. **CORS错误**: 检查前后端端口配置是否一致
2. **连接失败**: 确认后端服务正在运行
3. **端口冲突**: 检查端口是否被其他服务占用

### 调试信息

配置管理器会在控制台输出详细的调试信息：
- ✅ 成功状态
- ⚠️ 警告信息  
- ❌ 错误状态

## 集成说明

配置系统已自动集成到：
- `main.tsx`: 应用启动时初始化
- `api/client.ts`: 自动使用配置的API URL
- `vite.config.ts`: 开发代理使用环境变量

## 配置优先级

1. 环境变量 (`.env` 文件)
2. 后端同步配置
3. 默认配置值

这确保了灵活的配置管理和良好的向后兼容性。
