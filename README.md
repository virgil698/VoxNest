# VoxNest

下一代 CSM 网络交流程序，基于 ASP.net core + React 开发，为内容创作提供更加强大的功能和更好的用户体验。

## 你可以拿它做什么

- ✅博客
- ✅论坛
- ✅问答系统
- ✅新闻平台
- ✅知识分享平台
- ✅视频站
- ✅直播平台
- ✅还有更多......

## 它的优势

- 基于 ASP.net core + React 开发，性能强劲，响应速度快。
- 提供丰富的功能，如用户管理、权限管理、文章管理、评论管理、点赞管理、收藏管理、消息通知、搜索功能等。
- 支持自定义主题，用户可以根据自己的需求自定义主题。
- 支持插件扩展，用户可以根据自己的需求安装插件。
- 支持多端访问，用户可以在手机、平板、PC 等端上访问博客、论坛、问答系统等。
- 多语言支持，用户可以选择不同的语言进行访问。

## 项目架构

前端：

```
voxnest.client/                          ── 前端
├── .vscode/                             ✓
│   ├── extensions.json                  ✓ 推荐插件
│   └── settings.json                    ✓ 统一格式化、保存动作
├── public/                              已存在
├── src/                                 已存在
│   ├── api/                             ✓ 按资源维度封装 Axios 实例
│   ├── assets/                          ✓ 图片、字体、全局样式
│   ├── components/                      ✓ 公共组件
│   ├── pages/                           ✓ 路由级页面
│   ├── router/                          ✓ 路由配置
│   ├── stores/                          ✓ Pinia 全局状态
│   ├── styles/                          ✓ Tailwind / SCSS 变量、主题
│   ├── types/                           ✓ 全局类型声明
│   ├── utils/                           ✓ 纯函数、常量、枚举
│   ├── App.tsx
│   └── main.tsx
├── tests/                               ✓ Vitest 单测
│   ├── unit/
│   └── e2e/
├── .env.*                               ✓ 环境变量模板
├── .gitignore
├── CHANGELOG.md
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json                   ✓ Vite 专用 TS 配置
└── vite.config.ts
```

后端：

```
VoxNest.Server/                          ── 后端
├── Connected Services/                  已存在
├── Controllers/                         已存在
├── Features/                            ✓ Clean Architecture 用例层
│   ├── Articles/                        ✓ 示例 Feature
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── Validators/
│   │   └── Dtos/
├── Infrastructure/                      ✓ 实现细节（ORM、外部服务）
│   ├── Persistence/                     ✓ EF Core DbContext、迁移脚本
│   └── Services/                        ✓ 第三方 SDK 封装
├── Models/                              ✓ 领域/视图模型
├── Filters/                             ✓ 全局异常、验证过滤器
├── Middlewares/                         ✓ 日志、速率限制、审计
├── appsettings.json
├── appsettings.Development.json
├── appsettings.Production.json
├── Dockerfile                           ✓ 容器化
├── .dockerignore                        ✓
├── Program.cs
├── VoxNest.Server.http
├── WeatherForecast.cs
├── README.md
├── CHANGELOG.md
└── tests/                               ✓ xUnit
├── Unit/
└── Integration/
```