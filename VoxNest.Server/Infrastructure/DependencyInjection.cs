using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Application.Services;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Extensions;
using MySqlConnector;

namespace VoxNest.Server.Infrastructure;

/// <summary>
/// 基础设施层依赖注入配置
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// 添加基础设施层服务
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // 加载服务器配置
        var serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml("server-config.yml");
        
        // 验证配置
        var (isValid, errors) = serverConfig.ValidateConfiguration();
        if (!isValid)
        {
            throw new InvalidOperationException($"配置验证失败: {string.Join(", ", errors)}");
        }

        // 注册配置对象
        services.AddSingleton(serverConfig);

        // 配置数据库
        AddDatabase(services, serverConfig.Database);
        
        // 添加自定义DbContext工厂（避免生命周期冲突）
        services.AddSingleton<IDbContextFactory<VoxNestDbContext>, CustomDbContextFactory>();

        // 配置认证
        AddAuthentication(services, serverConfig.Jwt);

        // 配置CORS
        AddCors(services, serverConfig.Cors);

        // 配置AutoMapper
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);

        // 注册应用服务
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<IInstallService, EnhancedInstallService>();
        services.AddScoped<IMarkdownService, MarkdownService>();
        services.AddScoped<IInstallLockService, InstallLockService>();
        services.AddScoped<ILogService, LogService>();
        services.AddScoped<IAdminService, AdminService>();
        // Plugin, Theme, UnifiedExtension services removed - using FileSystemExtensionService only
        services.AddScoped<IFileSystemExtensionService, FileSystemExtensionService>();
        services.AddScoped<ISystemInfoService, SystemInfoService>();
        services.AddScoped<IConfigurationReloadService, ConfigurationReloadService>();
        
        // 注册基础设施服务
        services.AddScoped<IDatabasePerformanceService, DatabasePerformanceService>();
        services.AddScoped<IDebugPerformanceService, DebugPerformanceService>();
        services.AddSingleton<IDebugConfigurationService, DebugConfigurationService>();
        services.AddScoped<IServerConfigService, ServerConfigService>();

        return services;
    }

    /// <summary>
    /// 配置数据库
    /// </summary>
    /// <param name="services"></param>
    /// <param name="dbSettings"></param>
    private static void AddDatabase(IServiceCollection services, DatabaseSettings dbSettings)
    {
        services.AddDbContext<VoxNestDbContext>(options =>
        {
            ConfigureDbContextOptions(options, dbSettings);
        }, ServiceLifetime.Scoped); // 确保正确的生命周期
        
        // 添加数据库连接池配置
        services.Configure<DatabaseSettings>(settings =>
        {
            settings.Provider = dbSettings.Provider;
            settings.ConnectionString = dbSettings.ConnectionString;
            settings.EnableSensitiveDataLogging = dbSettings.EnableSensitiveDataLogging;
            settings.EnableDetailedErrors = dbSettings.EnableDetailedErrors;
        });
    }

    /// <summary>
    /// 配置数据库上下文选项
    /// </summary>
    /// <param name="options">选项构建器</param>
    /// <param name="dbSettings">数据库设置</param>
    private static void ConfigureDbContextOptions(DbContextOptionsBuilder options, DatabaseSettings dbSettings)
    {
        switch (dbSettings.Provider.ToUpper())
        {
            case "MYSQL":
            case "MARIADB":
                try
                {
                    // 优化连接字符串，添加协议相关参数
                    var connectionString = EnhanceConnectionString(dbSettings.ConnectionString);
                    var serverVersion = ServerVersion.AutoDetect(connectionString);
                    
                    options.UseMySql(connectionString, serverVersion, mysqlOptions =>
                    {
                        // 配置 MySql 特定选项
                        mysqlOptions.CommandTimeout(60); // 60秒超时
                        mysqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 3,
                            maxRetryDelay: TimeSpan.FromSeconds(5),
                            errorNumbersToAdd: null
                        );
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"数据库连接配置失败: {ex.Message}");
                    throw;
                }
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
    /// 配置JWT认证
    /// </summary>
    /// <param name="services"></param>
    /// <param name="jwtSettings"></param>
    private static void AddAuthentication(IServiceCollection services, JwtSettings jwtSettings)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ClockSkew = TimeSpan.Zero
            };

            // 配置JWT从查询字符串中读取（用于SignalR等场景）
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();
    }

    /// <summary>
    /// 配置CORS
    /// </summary>
    /// <param name="services"></param>
    /// <param name="corsSettings"></param>
    private static void AddCors(IServiceCollection services, CorsSettings corsSettings)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("DefaultPolicy", builder =>
            {
                builder.WithOrigins(corsSettings.AllowedOrigins.ToArray())
                       .WithMethods(corsSettings.AllowedMethods.ToArray())
                       .WithHeaders(corsSettings.AllowedHeaders.ToArray())
                       .AllowCredentials();
            });
        });
    }

    /// <summary>
    /// 增强连接字符串，添加协议稳定性相关参数
    /// </summary>
    /// <param name="originalConnectionString">原始连接字符串</param>
    /// <returns>增强后的连接字符串</returns>
    private static string EnhanceConnectionString(string originalConnectionString)
    {
        var builder = new MySqlConnectionStringBuilder(originalConnectionString);
        
        // 设置协议相关参数以避免 "Packet received out-of-order" 错误
        builder.Pooling = true;                    // 启用连接池
        builder.MinimumPoolSize = 0;               // 最小连接池大小
        builder.MaximumPoolSize = 50;              // 最大连接池大小  
        builder.ConnectionIdleTimeout = 300;       // 空闲连接超时（5分钟）
        builder.ConnectionReset = true;            // 连接重置
        builder.ConnectionLifeTime = 0;            // 连接生命周期（0表示无限制）
        
        // 网络相关配置
        builder.DefaultCommandTimeout = 60;        // 命令超时
        builder.ConnectionTimeout = 30;            // 连接超时
        builder.Keepalive = 0;                     // TCP keepalive
        
        // 协议相关
        builder.UseCompression = false;            // 禁用压缩（可能导致协议问题）
        builder.ConvertZeroDateTime = false;       // 不转换零日期时间
        
        return builder.ToString();
    }
}
