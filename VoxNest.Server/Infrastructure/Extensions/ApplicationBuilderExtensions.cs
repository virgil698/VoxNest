using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Middleware;

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
        
        // 设置配置文件监视器
        SetupConfigFileWatcher(app);
        
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
    /// 设置配置文件监视器
    /// </summary>
    private static void SetupConfigFileWatcher(WebApplication app)
    {
        const string configFile = "server-config.yml";
        const string dbInitFlagFile = "db-initialized.lock";
        const string lockFile = "config-reload.lock";
        
        var logger = app.Logger;
        var watcher = new FileSystemWatcher
        {
            Path = Directory.GetCurrentDirectory(),
            Filter = configFile,
            NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.CreationTime,
            EnableRaisingEvents = true
        };
        
        DateTime lastEventTime = DateTime.MinValue;
        
        watcher.Changed += async (sender, e) =>
        {
            try
            {
                // 防抖处理：忽略1秒内的重复事件
                var currentTime = DateTime.UtcNow;
                if ((currentTime - lastEventTime).TotalMilliseconds < 1000)
                {
                    return;
                }
                lastEventTime = currentTime;
                
                logger.LogInformation("检测到配置文件变化，开始热重载验证...");
                
                // 检查配置文件是否存在且可读
                if (!File.Exists(configFile))
                {
                    logger.LogWarning("配置文件不存在，跳过热重载");
                    return;
                }
                
                // 检查是否已经初始化过数据库
                if (File.Exists(dbInitFlagFile))
                {
                    logger.LogInformation("数据库已经初始化过，跳过重复初始化");
                    return;
                }
                
                // 检查是否有其他进程正在处理
                if (File.Exists(lockFile))
                {
                    logger.LogInformation("配置重载正在进行中，跳过重复处理");
                    return;
                }
                
                // 创建锁文件
                await File.WriteAllTextAsync(lockFile, $"Started at: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss.fff}");
                
                try
                {
                    // 等待文件写入完成并验证文件完整性
                    await WaitForFileStable(configFile, logger);
                    
                    // 重新加载配置并初始化数据库
                    await ReloadConfigAndInitializeDatabase(app, configFile, dbInitFlagFile, logger);
                }
                finally
                {
                    // 清理锁文件
                    if (File.Exists(lockFile))
                    {
                        File.Delete(lockFile);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "配置文件热重载失败");
                
                // 清理锁文件
                try
                {
                    if (File.Exists(lockFile))
                    {
                        File.Delete(lockFile);
                    }
                }
                catch (Exception cleanupEx)
                {
                    logger.LogError(cleanupEx, "清理锁文件失败");
                }
            }
        };
        
        logger.LogInformation("配置文件监视器已启动，监听: {ConfigFile}", configFile);
    }

    /// <summary>
    /// 等待文件稳定（确保文件写入完成）
    /// </summary>
    private static async Task WaitForFileStable(string filePath, ILogger logger, int maxWaitSeconds = 10)
    {
        var startTime = DateTime.UtcNow;
        long lastSize = -1;
        DateTime lastWriteTime = DateTime.MinValue;
        
        while ((DateTime.UtcNow - startTime).TotalSeconds < maxWaitSeconds)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    await Task.Delay(200);
                    continue;
                }
                
                var fileInfo = new FileInfo(filePath);
                var currentSize = fileInfo.Length;
                var currentWriteTime = fileInfo.LastWriteTime;
                
                if (currentSize == lastSize && currentWriteTime == lastWriteTime && currentSize > 0)
                {
                    // 文件大小和修改时间都没有变化，认为写入完成
                    logger.LogInformation("配置文件写入完成，文件大小: {Size} 字节", currentSize);
                    return;
                }
                
                lastSize = currentSize;
                lastWriteTime = currentWriteTime;
                await Task.Delay(200);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "检查文件稳定性时出现异常，继续等待...");
                await Task.Delay(200);
            }
        }
        
        logger.LogWarning("等待文件稳定超时，继续执行初始化");
    }

    /// <summary>
    /// 重新加载配置并初始化数据库
    /// </summary>
    private static async Task ReloadConfigAndInitializeDatabase(WebApplication app, string configFile, string dbInitFlagFile, ILogger logger)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var migrationService = scope.ServiceProvider.GetService<IDatabaseMigrationService>();
            
            if (migrationService != null)
            {
                logger.LogInformation("开始数据库迁移...");
                var migrationResult = await migrationService.MigrateAsync();
                
                if (migrationResult)
                {
                    // 植入种子数据
                    var context = scope.ServiceProvider.GetRequiredService<VoxNestDbContext>();
                    await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);
                    
                    // 创建初始化完成标记文件
                    var initInfo = new
                    {
                        InitializedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                        ConfigFile = configFile,
                        InitMethod = "HotReload"
                    };
                    
                    await File.WriteAllTextAsync(dbInitFlagFile, 
                        System.Text.Json.JsonSerializer.Serialize(initInfo, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
                    
                    logger.LogInformation("数据库初始化完成");
                }
                else
                {
                    logger.LogError("数据库迁移失败");
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "重新加载配置并初始化数据库失败");
        }
    }
}
