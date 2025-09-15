using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Persistence.Seed;

/// <summary>
/// 站点设置种子数据
/// </summary>
public static class SiteSettingsSeeder
{
    /// <summary>
    /// 初始化站点设置种子数据
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    public static async Task SeedAsync(VoxNestDbContext context)
    {
        if (!await context.SiteSettings.AnyAsync())
        {
            var settings = new List<SiteSetting>
            {
                // 基础设置组
                new SiteSetting
                {
                    Key = "site.name",
                    Name = "站点名称",
                    Description = "网站的名称，显示在浏览器标题栏和页面标题中",
                    Value = "VoxNest",
                    DefaultValue = "VoxNest",
                    Type = SiteSettingType.Text,
                    Group = "基础设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "site.description",
                    Name = "站点描述",
                    Description = "网站的简短描述，用于SEO和页面元信息",
                    Value = "下一代论坛交流平台，分享知识，交流思想",
                    DefaultValue = "下一代论坛交流平台",
                    Type = SiteSettingType.Text,
                    Group = "基础设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 2,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "site.keywords",
                    Name = "站点关键词",
                    Description = "网站的关键词，用于SEO优化",
                    Value = "论坛,交流,知识分享,VoxNest",
                    DefaultValue = "论坛,交流,社区",
                    Type = SiteSettingType.Text,
                    Group = "基础设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 3,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "site.logo",
                    Name = "站点Logo",
                    Description = "网站Logo图片URL",
                    Value = "/images/logo.png",
                    DefaultValue = "/images/logo.png",
                    Type = SiteSettingType.File,
                    Group = "基础设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 4,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "site.favicon",
                    Name = "网站图标",
                    Description = "网站favicon图标URL",
                    Value = "/favicon.ico",
                    DefaultValue = "/favicon.ico",
                    Type = SiteSettingType.File,
                    Group = "基础设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 5,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // 功能设置组
                new SiteSetting
                {
                    Key = "features.registration_enabled",
                    Name = "允许用户注册",
                    Description = "是否允许新用户注册账户",
                    Value = "true",
                    DefaultValue = "true",
                    Type = SiteSettingType.Boolean,
                    Group = "功能设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "features.email_verification",
                    Name = "邮箱验证",
                    Description = "注册时是否需要邮箱验证",
                    Value = "false",
                    DefaultValue = "false",
                    Type = SiteSettingType.Boolean,
                    Group = "功能设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 2,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "features.guest_posting",
                    Name = "允许游客发帖",
                    Description = "是否允许未登录用户发表帖子",
                    Value = "false",
                    DefaultValue = "false",
                    Type = SiteSettingType.Boolean,
                    Group = "功能设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 3,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "features.comments_enabled",
                    Name = "启用评论功能",
                    Description = "是否启用帖子评论功能",
                    Value = "true",
                    DefaultValue = "true",
                    Type = SiteSettingType.Boolean,
                    Group = "功能设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 4,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // 开发者设置组
                new SiteSetting
                {
                    Key = "dev.react_query_devtools",
                    Name = "React Query 开发者工具",
                    Description = "是否在前端显示 React Query 开发者工具，用于调试API查询状态",
                    Value = "false",
                    DefaultValue = "false",
                    Type = SiteSettingType.Boolean,
                    Group = "开发者设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "dev.debug_mode",
                    Name = "调试模式",
                    Description = "启用调试模式，显示详细的错误信息和日志",
                    Value = "false",
                    DefaultValue = "false",
                    Type = SiteSettingType.Boolean,
                    Group = "开发者设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 2,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "dev.performance_monitoring",
                    Name = "性能监控",
                    Description = "启用前端性能监控和统计",
                    Value = "false",
                    DefaultValue = "false",
                    Type = SiteSettingType.Boolean,
                    Group = "开发者设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 3,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // 安全设置组
                new SiteSetting
                {
                    Key = "security.password_min_length",
                    Name = "密码最小长度",
                    Description = "用户密码的最小长度要求",
                    Value = "6",
                    DefaultValue = "6",
                    Type = SiteSettingType.Number,
                    Group = "安全设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 1,
                    ValidationRules = "{\"min\": 4, \"max\": 20}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "security.login_attempts",
                    Name = "登录尝试次数限制",
                    Description = "连续登录失败的最大尝试次数",
                    Value = "5",
                    DefaultValue = "5",
                    Type = SiteSettingType.Number,
                    Group = "安全设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 2,
                    ValidationRules = "{\"min\": 3, \"max\": 10}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "security.session_timeout",
                    Name = "会话超时时间",
                    Description = "用户会话的超时时间（分钟）",
                    Value = "1440",
                    DefaultValue = "1440",
                    Type = SiteSettingType.Number,
                    Group = "安全设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 3,
                    ValidationRules = "{\"min\": 30, \"max\": 10080}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // 主题设置组
                new SiteSetting
                {
                    Key = "theme.primary_color",
                    Name = "主色调",
                    Description = "网站的主要颜色主题",
                    Value = "#1890ff",
                    DefaultValue = "#1890ff",
                    Type = SiteSettingType.Color,
                    Group = "主题设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "theme.dark_mode_enabled",
                    Name = "启用暗色模式",
                    Description = "是否启用暗色主题切换功能",
                    Value = "true",
                    DefaultValue = "true",
                    Type = SiteSettingType.Boolean,
                    Group = "主题设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 2,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "theme.default_mode",
                    Name = "默认主题模式",
                    Description = "用户首次访问时的默认主题模式",
                    Value = "light",
                    DefaultValue = "light",
                    Type = SiteSettingType.Text,
                    Group = "主题设置",
                    IsPublic = true,
                    IsEnabled = true,
                    Sort = 3,
                    Options = "[{\"label\": \"浅色\", \"value\": \"light\"}, {\"label\": \"深色\", \"value\": \"dark\"}, {\"label\": \"自动\", \"value\": \"auto\"}]",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // 邮件设置组
                new SiteSetting
                {
                    Key = "email.smtp_host",
                    Name = "SMTP服务器",
                    Description = "邮件发送服务器地址",
                    Value = "smtp.gmail.com",
                    DefaultValue = "",
                    Type = SiteSettingType.Text,
                    Group = "邮件设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "email.smtp_port",
                    Name = "SMTP端口",
                    Description = "邮件服务器端口号",
                    Value = "587",
                    DefaultValue = "587",
                    Type = SiteSettingType.Number,
                    Group = "邮件设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 2,
                    ValidationRules = "{\"min\": 1, \"max\": 65535}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "email.from_address",
                    Name = "发件人邮箱",
                    Description = "系统邮件的发件人地址",
                    Value = "noreply@voxnest.com",
                    DefaultValue = "",
                    Type = SiteSettingType.Text,
                    Group = "邮件设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 3,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // 缓存设置组
                new SiteSetting
                {
                    Key = "cache.enable_redis",
                    Name = "启用Redis缓存",
                    Description = "是否启用Redis作为缓存后端",
                    Value = "false",
                    DefaultValue = "false",
                    Type = SiteSettingType.Boolean,
                    Group = "缓存设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SiteSetting
                {
                    Key = "cache.default_expiration",
                    Name = "默认缓存过期时间",
                    Description = "缓存的默认过期时间（分钟）",
                    Value = "30",
                    DefaultValue = "30",
                    Type = SiteSettingType.Number,
                    Group = "缓存设置",
                    IsPublic = false,
                    IsEnabled = true,
                    Sort = 2,
                    ValidationRules = "{\"min\": 1, \"max\": 1440}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.SiteSettings.AddRange(settings);
            await context.SaveChangesAsync();
        }
    }
}
