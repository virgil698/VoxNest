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
src/
├── api/                              # API 调用层
│   ├── clients/                      # HTTP 客户端配置
│   │   ├── httpClient.ts
│   │   └── authClient.ts
│   ├── services/                     # API 服务
│   │   ├── userService.ts
│   │   ├── contentService.ts
│   │   ├── mediaService.ts
│   │   └── forumService.ts
│   └── types/                        # API 相关类型
│
├── features/                         # 功能模块（按业务领域组织）
│   ├── auth/                         # 认证模块
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useLogin.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── stores/
│   │       └── authStore.ts
│   │
│   ├── user/                         # 用户管理模块
│   │   ├── components/
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── UserSettings.tsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── ProfilePage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── stores/
│   │
│   ├── content/                      # 内容管理模块
│   │   ├── components/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleEditor.tsx
│   │   │   ├── CommentList.tsx
│   │   │   └── TagSelector.tsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── ArticleListPage.tsx
│   │   │   ├── ArticleDetailPage.tsx
│   │   │   └── CreateArticlePage.tsx
│   │   └── stores/
│   │
│   ├── forum/                        # 论坛模块
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── stores/
│   │
│   ├── media/                        # 媒体模块
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── MediaGallery.tsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── stores/
│   │
│   └── admin/                        # 管理模块
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── stores/
│
├── shared/                           # 共享组件和工具
│   ├── components/                   # 通用组件
│   │   ├── ui/                       # 基础UI组件
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Loading/
│   │   │   └── Table/
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   └── common/                   # 业务通用组件
│   │       ├── SearchBox.tsx
│   │       ├── Pagination.tsx
│   │       └── BreadCrumb.tsx
│   │
│   ├── hooks/                        # 通用Hooks
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   ├── useLocalStorage.ts
│   │   └── usePermission.ts
│   │
│   ├── utils/                        # 工具函数
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   └── types/                        # 全局类型定义
│       ├── global.ts
│       ├── api.ts
│       └── user.ts
│
├── router/                           # 路由配置
│   ├── index.tsx
│   ├── guards/                       # 路由守卫
│   │   ├── AuthGuard.tsx
│   │   └── PermissionGuard.tsx
│   └── routes/                       # 路由定义
│       ├── authRoutes.ts
│       ├── userRoutes.ts
│       └── contentRoutes.ts
│
├── stores/                           # 全局状态管理（Pinia）
│   ├── index.ts
│   ├── modules/
│   │   ├── app.ts                    # 应用状态
│   │   ├── theme.ts                  # 主题状态
│   │   └── notification.ts          # 通知状态
│   └── types/
│
├── styles/                           # 样式文件
│   ├── globals.css
│   ├── variables.css
│   ├── themes/
│   │   ├── light.css
│   │   └── dark.css
│   └── components/                   # 组件样式
│
├── locales/                          # 国际化
│   ├── zh-CN.json
│   ├── en-US.json
│   └── index.ts
│
├── assets/                           # 静态资源
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── tests/                            # 测试文件
    ├── __mocks__/
    ├── unit/
    ├── integration/
    └── e2e/
```

后端：

```
VoxNest.Server/
├── Domain/                           # 领域层 - 核心业务逻辑
│   ├── Entities/                     # 实体类
│   │   ├── User/
│   │   │   ├── User.cs
│   │   │   ├── UserProfile.cs
│   │   │   └── UserRole.cs
│   │   ├── Content/
│   │   │   ├── Article.cs
│   │   │   ├── Post.cs
│   │   │   ├── Comment.cs
│   │   │   └── Tag.cs
│   │   ├── Media/
│   │   │   ├── MediaFile.cs
│   │   │   └── MediaAlbum.cs
│   │   └── Social/
│   │       ├── Like.cs
│   │       ├── Follow.cs
│   │       └── Notification.cs
│   ├── ValueObjects/                 # 值对象
│   ├── Enums/                        # 枚举
│   ├── Events/                       # 领域事件
│   └── Interfaces/                   # 领域接口
│
├── Application/                      # 应用层 - 用例和服务
│   ├── Features/                     # 功能模块（CQRS）
│   │   ├── Users/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateUser/
│   │   │   │   ├── UpdateProfile/
│   │   │   │   └── ChangePassword/
│   │   │   ├── Queries/
│   │   │   │   ├── GetUser/
│   │   │   │   └── GetUserList/
│   │   │   └── Validators/
│   │   ├── Content/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateArticle/
│   │   │   │   ├── PublishPost/
│   │   │   │   └── AddComment/
│   │   │   └── Queries/
│   │   │       ├── GetArticles/
│   │   │       └── SearchContent/
│   │   ├── Media/
│   │   ├── Social/
│   │   └── Forum/
│   ├── Common/
│   │   ├── Behaviors/                # MediatR 行为管道
│   │   ├── Mappings/                 # AutoMapper 配置
│   │   └── Interfaces/               # 应用接口
│   └── DTOs/                         # 数据传输对象
│
├── Infrastructure/                   # 基础设施层
│   ├── Persistence/
│   │   ├── Contexts/
│   │   │   └── VoxNestDbContext.cs
│   │   ├── Configurations/           # EF Core 配置
│   │   ├── Migrations/
│   │   └── Repositories/             # 仓储实现
│   ├── Services/
│   │   ├── EmailService.cs
│   │   ├── FileStorageService.cs
│   │   ├── CacheService.cs
│   │   └── NotificationService.cs
│   ├── Identity/                     # 身份认证
│   └── ExternalAPIs/                 # 第三方API集成
│
├── Presentation/                     # 表示层
│   ├── Controllers/
│   │   ├── UsersController.cs
│   │   ├── ContentController.cs
│   │   ├── MediaController.cs
│   │   └── ForumController.cs
│   ├── Hubs/                         # SignalR 实时通信
│   │   ├── ChatHub.cs
│   │   └── NotificationHub.cs
│   ├── Filters/                      # 过滤器
│   │   ├── GlobalExceptionFilter.cs
│   │   ├── ValidationFilter.cs
│   │   └── AuthorizationFilter.cs
│   └── Middlewares/                  # 中间件
│       ├── RequestLoggingMiddleware.cs
│       ├── RateLimitingMiddleware.cs
│       └── CorsMiddleware.cs
│
├── Shared/                           # 共享组件
│   ├── Constants/
│   ├── Extensions/
│   ├── Helpers/
│   └── Results/                      # 统一返回结果
│
├── Tests/                            # 测试
│   ├── Unit/
│   ├── Integration/
│   └── E2E/
│
├── Configuration/                    # 配置
│   ├── DependencyInjection.cs
│   ├── DatabaseConfiguration.cs
│   └── ServiceConfiguration.cs
│
└── appsettings.{Environment}.json
```