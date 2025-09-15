using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using VoxNest.Server.Infrastructure;
using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Application.Services;
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
            services.AddScoped<IConfigurationReloadService, VoxNest.Server.Application.Services.ConfigurationReloadService>();
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

        // 注册基础服务（安装模式也需要这些服务）
        services.AddScoped<ILogService, LogService>();

        // 为安装模式提供基本的认证和配置服务
        AddInstallModeAuthenticationServices(services);

        return services;
    }

    /// <summary>
    /// 添加安装模式的认证服务
    /// </summary>
    private static void AddInstallModeAuthenticationServices(IServiceCollection services)
    {
        // 尝试加载服务器配置，如果不存在则使用默认配置
        VoxNest.Server.Shared.Configuration.ServerConfiguration serverConfig;
        
        try
        {
            serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml("server-config.yml");
        }
        catch
        {
            // 如果配置文件不存在或无法加载，使用默认配置
            serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.CreateDefaultConfiguration();
        }

        // 注册配置对象
        services.AddSingleton(serverConfig);

        // 配置数据库上下文（安装模式下需要用于JWT服务）
        // 安装模式下，如果有数据库配置就使用它
        if (!string.IsNullOrEmpty(serverConfig.Database.ConnectionString))
        {
            services.AddDbContext<VoxNestDbContext>(options =>
            {
                ConfigureDbContextOptions(options, serverConfig.Database);
            });
        }
        else
        {
            // 安装模式下没有数据库连接时，注册一个延迟初始化的数据库上下文
            // 只有在确实需要时才尝试创建，避免在安装API调用时就失败
            services.AddScoped<VoxNestDbContext>(provider =>
            {
                var installationService = provider.GetService<IInstallationDbContextService>();
                if (installationService != null)
                {
                    try
                    {
                        // 尝试使用安装服务创建上下文
                        return installationService.CreateDbContext(serverConfig);
                    }
                    catch (Exception ex)
                    {
                        // 记录详细错误但不阻止应用启动
                        var logger = provider.GetService<ILogger<VoxNestDbContext>>();
                        logger?.LogWarning("安装模式下数据库上下文创建失败: {Error}", ex.Message);
                        
                        // 返回一个使用内存数据库的临时上下文，避免阻止安装流程
                        var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
                        optionsBuilder.UseInMemoryDatabase("InstallationTempDb");
                        return new VoxNestDbContext(optionsBuilder.Options);
                    }
                }
                
                // 如果InstallationDbContextService不可用，创建内存数据库
                var options = new DbContextOptionsBuilder<VoxNestDbContext>()
                    .UseInMemoryDatabase("InstallationTempDb")
                    .Options;
                return new VoxNestDbContext(options);
            });
        }

        // 配置AutoMapper（使用最小配置）
        services.AddAutoMapper(typeof(VoxNest.Server.Application.Services.EnhancedInstallService).Assembly);

        // 注册JWT服务（安装模式也需要为管理员创建token）
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // 基本的身份验证配置（安装模式下简化版）
        services.AddAuthentication()
               .AddJwtBearer(options =>
               {
                   options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                   {
                       ValidateIssuer = false,
                       ValidateAudience = false,
                       ValidateLifetime = true,
                       ValidateIssuerSigningKey = true,
                       IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                           System.Text.Encoding.UTF8.GetBytes(serverConfig.Jwt.SecretKey)),
                       ClockSkew = TimeSpan.Zero
                   };
               });

        services.AddAuthorization();
    }

    /// <summary>
    /// 配置数据库上下文选项
    /// </summary>
    /// <param name="options">选项构建器</param>
    /// <param name="dbSettings">数据库设置</param>
    private static void ConfigureDbContextOptions(DbContextOptionsBuilder options, VoxNest.Server.Shared.Configuration.DatabaseSettings dbSettings)
    {
        switch (dbSettings.Provider.ToUpper())
        {
            case "MYSQL":
            case "MARIADB":
                var serverVersion = Microsoft.EntityFrameworkCore.ServerVersion.AutoDetect(dbSettings.ConnectionString);
                options.UseMySql(dbSettings.ConnectionString, serverVersion);
                break;
            default:
                throw new NotSupportedException($"不支持的数据库提供商: {dbSettings.Provider}。支持的数据库：MySQL、MariaDB");
        }

        if (dbSettings.EnableSensitiveDataLogging)
        {
            options.EnableSensitiveDataLogging();
        }

        if (dbSettings.EnableDetailedErrors)
        {
            options.EnableDetailedErrors();
        }
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
    private readonly VoxNestDbContext? _dbContext;

    public DatabaseHealthCheck(IServiceProvider serviceProvider)
    {
        // 尝试获取数据库上下文，如果在安装模式下可能不存在
        _dbContext = serviceProvider.GetService<VoxNestDbContext>();
    }

    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (_dbContext == null)
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Degraded(
                    "Database context not available (installation mode)");
            }

            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            if (canConnect)
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Database is accessible");
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
