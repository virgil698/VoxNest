# VoxNest
*下一代插件化 CSM 网络交流程序*

<div align="center">

[![.NET Version](https://img.shields.io/badge/.NET-9.0-blue?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![React Version](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](https://github.com/your-repo/voxnest)

基于 **ASP.NET Core 9** + **React 19** + **TypeScript** 构建的现代化内容管理系统<br/>
采用 **核心框架 + 插件扩展** 架构，为内容创作者和社区运营提供无限可能

[🚀 快速开始](#-快速开始) • [📖 文档](docs/) • [🔌 插件开发](docs/05-插件开发指南.md) • [💬 讨论](https://github.com/your-repo/discussions)

</div>

---

## ✨ 核心特性

### 🏗️ **插件化架构**
> 核心轻量化，功能插件化 - 只安装你需要的功能模块

- **热插拔支持** - 插件动态加载/卸载，无需重启服务  
- **沙箱隔离** - 插件间相互隔离，故障不会传播
- **标准化接口** - 统一的插件开发规范和 API
- **丰富生态** - 持续扩展的插件市场
- **实时反馈** - 插件操作状态实时更新，优化用户体验

### 🎯 **多场景应用**
> 一套系统，多种玩法 - 通过插件组合实现不同业务场景

| 应用场景 | 核心插件 | 特色功能 |
|---------|---------|---------|
| 📝 **个人博客** | 博客插件 + SEO插件 | 文章发布、RSS订阅、搜索优化 |
| 💬 **社区论坛** | 论坛插件 + 用户插件 | 版块管理、积分系统、私信功能 |
| ❓ **知识问答** | 问答插件 + 悬赏插件 | 问题发布、最佳答案、悬赏系统 |
| 📰 **新闻资讯** | 新闻插件 + 推荐插件 | 内容发布、智能推荐、热点追踪 |
| 🎥 **视频平台** | 视频插件 + 直播插件 | 视频上传、在线播放、弹幕互动 |
| 📺 **直播社区** | 直播插件 + 礼物插件 | 推流直播、聊天室、虚拟礼物 |

### 🚀 **现代化技术栈**
> 采用业界领先技术，确保系统性能和可维护性

**前端架构**
- **React 19** - 最新版本，支持并发特性
- **TypeScript 5.0** - 类型安全，开发体验优秀
- **Ant Design** - 企业级UI组件库
- **Vite** - 极速的构建工具

**后端架构**  
- **ASP.NET Core 9** - 高性能Web框架
- **Entity Framework Core** - 现代化ORM
- **PostgreSQL/MySQL** - 企业级数据库支持
- **Redis** - 高速缓存和会话存储

### 🛡️ **安全可靠**
- **JWT 认证** - 无状态身份验证
- **细粒度权限** - 基于角色的访问控制
- **插件审核** - 安全代码审查机制
- **API限流** - 防止恶意攻击

### 📈 **高性能优化**
- **多级缓存** - 内存缓存 + Redis缓存
- **异步处理** - 非阻塞I/O操作
- **CDN支持** - 静态资源加速
- **数据库优化** - 索引优化和查询缓存
- **热重载优化** - 防抖机制避免频繁重载

### ⚙️ **统一配置管理**
- **站点设置统一** - 前后端配置集中管理
- **实时配置更新** - 配置修改即时生效
- **时区支持** - 全球化时区设置
- **配置备份** - 支持配置备份和恢复

## 🏗️ 系统架构

VoxNest 采用 **分层架构 + 插件化设计**，确保系统的高性能、高可用性和高扩展性。

> 📊 **架构示意图** - 展示完整的系统架构和数据流

---

### 🎯 **核心设计理念**

- **🏗️ 分层架构** - 前端层、API网关、核心框架、插件生态、数据层
- **🔌 插件驱动** - 业务功能完全插件化，核心保持轻量
- **🛡️ 安全隔离** - 插件沙箱机制，确保系统稳定性
- **⚡ 高性能** - 多级缓存、异步处理、数据库优化

### 📁 **目录结构概览**

<details>
<summary><strong>📂 前端项目结构 (voxnest.client/)</strong></summary>

```
📁 voxnest.client/
├── 📁 src/
│   ├── 📁 api/           # API调用层
│   ├── 📁 components/    # 通用组件
│   ├── 📁 pages/         # 页面组件
│   ├── 📁 stores/        # 状态管理
│   ├── 📁 types/         # 类型定义
│   └── 📁 styles/        # 样式文件
├── 📄 package.json       # 依赖配置
├── 📄 vite.config.ts     # Vite配置
└── 📄 tsconfig.json      # TypeScript配置
```
</details>

<details>
<summary><strong>📂 后端项目结构 (VoxNest.Server/)</strong></summary>

```
📁 VoxNest.Server/
├── 📁 Domain/            # 领域层 - 核心实体
│   ├── 📁 Entities/      # 数据实体
│   ├── 📁 Enums/         # 枚举定义
│   └── 📁 Events/        # 领域事件
├── 📁 Application/       # 应用层 - 业务逻辑
│   ├── 📁 DTOs/          # 数据传输对象
│   ├── 📁 Interfaces/    # 业务接口
│   └── 📁 Services/      # 业务服务
├── 📁 Infrastructure/    # 基础设施层
│   ├── 📁 Persistence/   # 数据持久化
│   └── 📁 Services/      # 基础服务
├── 📁 Presentation/      # 表示层 - API控制器
│   └── 📁 Controllers/   # API控制器
└── 📄 Program.cs         # 应用入口
```
</details>

---

## 🚀 快速开始

### 📋 **环境要求**

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| .NET SDK | 9.0+ | 后端开发框架 |
| Node.js | 18.0+ LTS | 前端运行环境 |
| PostgreSQL | 15.0+ | 推荐数据库（也支持MySQL 8.0+） |
| Redis | 7.0+ | 缓存服务（可选，插件提供） |
| Visual Studio | 2022+ | 推荐开发工具（或VS Code） |

### ⚡ **一键启动**

```bash
# 🛠️ 使用启动脚本（推荐）
./scripts/start.sh        # Linux/macOS
./scripts/start.ps1       # Windows PowerShell
./scripts/start.bat       # Windows CMD

# 📝 访问应用
http://localhost:3000     # 前端应用
http://localhost:5000     # 后端API
```

### 🔧 **手动开发**

<details>
<summary><strong>📱 前端开发</strong></summary>

```bash
# 🔄 进入前端目录
cd voxnest.client

# 📦 安装依赖
npm install
# 或使用 yarn
yarn install

# 🚀 启动开发服务器
npm run dev
# 或使用 yarn
yarn dev

# 🌐 访问地址
http://localhost:3000
```
</details>

<details>
<summary><strong>⚙️ 后端开发</strong></summary>

```bash
# 🔄 进入后端目录
cd VoxNest.Server

# 📦 还原NuGet包
dotnet restore

# 🗄️ 更新数据库（首次运行）
dotnet ef database update

# 🚀 启动开发服务器
dotnet run
# 或使用热重载
dotnet watch run

# 🌐 访问地址
http://localhost:5000      # API
http://localhost:5000/swagger  # API文档
```
</details>

### 🔑 **首次配置**

1. **🗄️ 数据库配置**
   ```bash
   # 修改配置文件
   vim VoxNest.Server/appsettings.json
   
   # 配置数据库连接字符串
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=voxnest;Username=your_user;Password=your_password"
   }
   ```

2. **👤 初始化系统**
   ```bash
   # 首次访问将引导你完成安装设置（4步向导）
   http://localhost:3000/install
   
   # 安装步骤：
   # 1. 环境检查 - 检查系统依赖和配置
   # 2. 数据库配置 - 设置数据库连接
   # 3. 管理员账户 - 创建系统管理员
   # 4. 站点配置 - 设置站点信息和时区
   ```

3. **🔌 管理扩展插件**
   ```bash
   # 通过管理面板管理扩展插件
   http://localhost:3000/admin/extensions
   
   # 功能包括：
   # - 插件启用/禁用（实时反馈）
   # - 插件重新加载
   # - 插件详情查看
   # - 插件卸载
   ```

4. **⚙️ 系统配置**
   ```bash
   # 统一的站点设置页面
   http://localhost:3000/admin/site-settings
   
   # 配置项包括：
   # - 界面设置（主题、布局）
   # - 体验优化（性能、缓存）
   # - 服务器配置（基础设置、数据库、CORS、日志）
   ```

---
