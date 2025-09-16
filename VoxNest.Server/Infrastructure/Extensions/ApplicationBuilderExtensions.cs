using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Middleware;
using VoxNest.Server.Tools;

namespace VoxNest.Server.Infrastructure.Extensions;

/// <summary>
/// 应用程序构建器扩展方法
/// </summary>
public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// 配置VoxNest应用程序中间件管道
    /// </summary>
    public static WebApplication ConfigureVoxNestPipeline(this WebApplication app)
    {
        // 全局异常处理中间件（必须在最前面）
        app.UseMiddleware<EnhancedExceptionMiddleware>();
        
        // 安装状态检查
        var (isInstalled, configExists) = CheckInstallationStatus();
        
        if (!isInstalled)
        {
            app.ConfigureInstallationMode();
        }
        else if (configExists)
        {
            app.ConfigureNormalMode();
        }
        
        return app;
    }

    /// <summary>
    /// 配置安装模式
    /// </summary>
    private static WebApplication ConfigureInstallationMode(this WebApplication app)
    {
        app.Logger.LogInformation("应用运行在安装模式");
        
        // 基本CORS策略
        app.UseCors("InstallPolicy");
        
        // 添加安装状态检查中间件
        app.UseInstallationMiddleware();
        
        return app;
    }

    /// <summary>
    /// 配置正常运行模式
    /// </summary>
    private static WebApplication ConfigureNormalMode(this WebApplication app)
    {
        app.Logger.LogInformation("应用运行在正常模式");
        
        // Debug日志中间件（在其他中间件之前，但在异常处理之后）
        app.UseDebugLogging();
        
        // 静态文件服务
        app.UseDefaultFiles();
        app.MapStaticAssets();
        
        // HTTPS重定向
        app.UseHttpsRedirection();
        
        // CORS
        app.UseCors("DefaultPolicy");
        
        // 认证和授权
        app.UseAuthentication();
        app.UseAuthorization();
        
        return app;
    }

    /// <summary>
    /// 配置开发环境特定的中间件
    /// </summary>
    public static WebApplication ConfigureDevelopmentEnvironment(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "VoxNest API V1");
                c.RoutePrefix = "swagger";
            });
        }
        
        return app;
    }

    /// <summary>
    /// 配置路由
    /// </summary>
    public static WebApplication ConfigureRouting(this WebApplication app)
    {
        app.MapControllers();
        app.MapFallbackToFile("/index.html");
        
        return app;
    }

    /// <summary>
    /// 安装状态检查中间件
    /// </summary>
    private static IApplicationBuilder UseInstallationMiddleware(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            // 允许安装API和静态资源访问
            if (context.Request.Path.StartsWithSegments("/api/install") ||
                context.Request.Path.StartsWithSegments("/api/log") ||
                context.Request.Path.StartsWithSegments("/install") ||
                context.Request.Path.StartsWithSegments("/assets") ||
                context.Request.Path.StartsWithSegments("/vite.svg") ||
                context.Request.Path.StartsWithSegments("/swagger") ||
                context.Request.Path.StartsWithSegments("/_framework"))
            {
                await next();
                return;
            }

            // 如果未安装，重定向到安装页面
            if (context.Request.Path == "/" || context.Request.Path == "/index.html")
            {
                context.Response.Redirect("/install");
                return;
            }
            
            if (!context.Request.Path.StartsWithSegments("/install"))
            {
                context.Response.StatusCode = 503;
                await context.Response.WriteAsync("System is not installed. Please visit /install to complete installation.");
                return;
            }

            await next();
        });
    }

    /// <summary>
    /// 检查安装状态
    /// </summary>
    private static (bool isInstalled, bool configExists) CheckInstallationStatus()
    {
        const string installFlagFile = "install.lock";
        const string configFile = "server-config.yml";
        
        return (File.Exists(installFlagFile), File.Exists(configFile));
    }
    
    /// <summary>
    /// 使用Debug日志中间件
    /// </summary>
    public static IApplicationBuilder UseDebugLogging(this IApplicationBuilder app)
    {
        return app.UseMiddleware<DebugLoggingMiddleware>();
    }
}
