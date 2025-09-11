using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Extensions;

namespace VoxNest.Server.Infrastructure.Services;

/// <summary>
/// 安装模式数据库上下文服务实现
/// </summary>
public class InstallationDbContextService : IInstallationDbContextService
{
    /// <inheritdoc/>
    public VoxNestDbContext CreateDbContext(ServerConfiguration config)
    {
        var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
        ConfigureDbContextOptions(optionsBuilder, config.Database);
        return new VoxNestDbContext(optionsBuilder.Options);
    }

    /// <inheritdoc/>
    public async Task<VoxNestDbContext> CreateDbContextAsync(ServerConfiguration config)
    {
        return await Task.FromResult(CreateDbContext(config));
    }

    /// <inheritdoc/>
    public VoxNestDbContext CreateDbContextFromFile(string configFilePath)
    {
        var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(configFilePath);
        return CreateDbContext(config);
    }

    /// <inheritdoc/>
    public async Task<VoxNestDbContext> CreateDbContextFromFileAsync(string configFilePath)
    {
        return await Task.FromResult(CreateDbContextFromFile(configFilePath));
    }

    /// <summary>
    /// 配置数据库上下文选项
    /// </summary>
    /// <param name="options">选项构建器</param>
    /// <param name="dbSettings">数据库设置</param>
    private static void ConfigureDbContextOptions(DbContextOptionsBuilder<VoxNestDbContext> options, DatabaseSettings dbSettings)
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
    }
}
