using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Infrastructure;
using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Filters;

namespace VoxNest.Server.Infrastructure.Extensions;

/// <summary>
/// 服务集合扩展方法
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// 配置VoxNest服务
    /// </summary>
    public static IServiceCollection AddVoxNestServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 基础服务
        services.AddControllers(options =>
        {
            // 添加全局过滤器
            options.Filters.Add<ConditionalModelValidationFilter>();
            options.Filters.Add<RequestLogFilter>();
        });
        
        // 检查安装状态
        const string installFlagFile = "install.lock";
        const string configFile = "server-config.yml";
        var isInstalled = File.Exists(installFlagFile);
        var configExists = File.Exists(configFile);

        if (isInstalled && configExists)
        {
            // 正常模式：加载完整配置
            services.AddInfrastructure(configuration);
        }
        else
        {
            // 安装模式：只注册必要的服务
            services.AddScoped<IInstallService, VoxNest.Server.Application.Services.EnhancedInstallService>();
            services.AddScoped<IInstallLockService, VoxNest.Server.Application.Services.SimpleInstallLockService>();
            services.AddInstallationModeServices();
        }

        return services;
    }

    /// <summary>
    /// 添加安装模式服务
    /// </summary>
    private static IServiceCollection AddInstallationModeServices(this IServiceCollection services)
    {
        // 配置基本的CORS策略
        services.AddCors(options =>
        {
            options.AddPolicy("InstallPolicy", corsBuilder =>
            {
                corsBuilder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
            });
        });

        // 注册安装模式专用的 DbContext 创建服务
        services.AddScoped<IInstallationDbContextService, InstallationDbContextService>();

        return services;
    }

    /// <summary>
    /// 配置OpenAPI和Swagger
    /// </summary>
    public static IServiceCollection AddVoxNestApiDocumentation(this IServiceCollection services, IWebHostEnvironment environment)
    {
        services.AddOpenApi();

        if (environment.IsDevelopment())
        {
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new() { Title = "VoxNest API", Version = "v1" });
                
                // 配置JWT认证
                c.AddSecurityDefinition("Bearer", new()
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });
                
                c.AddSecurityRequirement(new()
                {
                    {
                        new()
                        {
                            Reference = new()
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });

                // 添加XML注释文档
                var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                {
                    c.IncludeXmlComments(xmlPath);
                }
            });
        }

        return services;
    }

    /// <summary>
    /// 配置健康检查
    /// </summary>
    public static IServiceCollection AddVoxNestHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database")
            .AddCheck<ApplicationHealthCheck>("application");

        return services;
    }

    /// <summary>
    /// 配置日志记录
    /// </summary>
    public static IServiceCollection AddVoxNestLogging(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddLogging(builder =>
        {
            builder.AddConfiguration(configuration.GetSection("Logging"));
            builder.AddConsole();
            
            // 在开发环境添加调试输出
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                builder.AddDebug();
            }
        });

        return services;
    }

    /// <summary>
    /// 配置缓存服务
    /// </summary>
    public static IServiceCollection AddVoxNestCaching(this IServiceCollection services, IConfiguration configuration)
    {
        // 内存缓存
        services.AddMemoryCache();
        
        // 暂时只使用内存分布式缓存
        // TODO: 如果需要Redis，请安装Microsoft.Extensions.Caching.StackExchangeRedis包
        services.AddDistributedMemoryCache();

        return services;
    }

    /// <summary>
    /// 配置后台服务
    /// </summary>
    public static IServiceCollection AddVoxNestBackgroundServices(this IServiceCollection services)
    {
        // 这里可以添加后台任务服务
        // services.AddHostedService<DataCleanupService>();
        // services.AddHostedService<CacheWarmupService>();
        
        return services;
    }
}

/// <summary>
/// 数据库健康检查
/// </summary>
public class DatabaseHealthCheck : Microsoft.Extensions.Diagnostics.HealthChecks.IHealthCheck
{
    private readonly IDatabaseMigrationService? _migrationService;

    public DatabaseHealthCheck(IServiceProvider serviceProvider)
    {
        // 尝试获取迁移服务，如果在安装模式下可能不存在
        _migrationService = serviceProvider.GetService<IDatabaseMigrationService>();
    }

    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (_migrationService == null)
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Degraded(
                    "Database migration service not available (installation mode)");
            }

            var canConnect = await _migrationService.DatabaseExistsAsync();
            if (canConnect)
            {
                var hasPendingMigrations = await _migrationService.HasPendingMigrationsAsync();
                if (hasPendingMigrations)
                {
                    return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Degraded(
                        "Database has pending migrations");
                }

                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Database is accessible and up-to-date");
            }
            else
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Cannot connect to database");
            }
        }
        catch (Exception ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy(
                "Database health check failed", ex);
        }
    }
}

/// <summary>
/// 应用程序健康检查
/// </summary>
public class ApplicationHealthCheck : Microsoft.Extensions.Diagnostics.HealthChecks.IHealthCheck
{
    public Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        // 检查应用程序基本状态
        var memoryUsed = GC.GetTotalMemory(false);
        var workingSet = Environment.WorkingSet;
        
        var data = new Dictionary<string, object>
        {
            { "MemoryUsed", $"{memoryUsed / 1024 / 1024} MB" },
            { "WorkingSet", $"{workingSet / 1024 / 1024} MB" },
            { "Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown" },
            { "MachineName", Environment.MachineName },
            { "ProcessorCount", Environment.ProcessorCount }
        };

        return Task.FromResult(
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(
                "Application is running normally", data));
    }
}
