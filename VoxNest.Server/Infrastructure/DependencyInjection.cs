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
        services.AddScoped<IInstallService, InstallService>();

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
            switch (dbSettings.Provider.ToUpper())
            {
                case "MYSQL":
                case "MARIADB":
                    var serverVersion = ServerVersion.AutoDetect(dbSettings.ConnectionString);
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
        });
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
}
