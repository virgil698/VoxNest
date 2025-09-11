using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;

namespace VoxNest.Server.Infrastructure.Services;

/// <summary>
/// 自定义数据库上下文工厂，避免生命周期冲突
/// </summary>
public class CustomDbContextFactory : IDbContextFactory<VoxNestDbContext>
{
    private readonly ServerConfiguration _serverConfiguration;

    public CustomDbContextFactory(ServerConfiguration serverConfiguration)
    {
        _serverConfiguration = serverConfiguration;
    }

    public VoxNestDbContext CreateDbContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
        ConfigureOptions(optionsBuilder, _serverConfiguration.Database);
        return new VoxNestDbContext(optionsBuilder.Options);
    }

    public async Task<VoxNestDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
    {
        return await Task.FromResult(CreateDbContext());
    }

    private static void ConfigureOptions(DbContextOptionsBuilder<VoxNestDbContext> options, DatabaseSettings dbSettings)
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
