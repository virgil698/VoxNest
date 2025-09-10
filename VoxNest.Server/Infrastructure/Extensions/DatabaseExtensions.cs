using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Extensions;

/// <summary>
/// 数据库扩展方法
/// </summary>
public static class DatabaseExtensions
{
    /// <summary>
    /// 确保数据库已迁移并植入种子数据
    /// </summary>
    /// <param name="app">应用程序构建器</param>
    /// <returns></returns>
    public static async Task<WebApplication> EnsureDatabaseMigratedAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<WebApplication>>();
        var migrationService = scope.ServiceProvider.GetRequiredService<IDatabaseMigrationService>();
        
        try
        {
            logger.LogInformation("开始检查数据库迁移状态...");
            
            // 检查数据库是否存在
            var databaseExists = await migrationService.DatabaseExistsAsync();
            if (!databaseExists)
            {
                logger.LogInformation("数据库不存在，将创建新数据库");
            }
            
            // 检查是否有待处理的迁移
            var hasPendingMigrations = await migrationService.HasPendingMigrationsAsync();
            if (hasPendingMigrations)
            {
                logger.LogInformation("检测到待处理的迁移，开始应用迁移...");
                
                var migrationResult = await migrationService.MigrateAsync();
                if (migrationResult)
                {
                    logger.LogInformation("数据库迁移成功完成");
                }
                else
                {
                    logger.LogError("数据库迁移失败");
                    throw new InvalidOperationException("数据库迁移失败");
                }
            }
            else
            {
                logger.LogInformation("数据库已是最新版本，无需迁移");
            }
            
            // 植入种子数据
            var context = scope.ServiceProvider.GetRequiredService<VoxNestDbContext>();
            logger.LogInformation("开始植入种子数据...");
            await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);
            logger.LogInformation("种子数据植入完成");
            
            // 记录迁移状态
            await LogMigrationStatus(migrationService, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "数据库迁移过程中发生错误");
            throw;
        }
        
        return app;
    }
    
    /// <summary>
    /// 记录迁移状态
    /// </summary>
    /// <param name="migrationService">迁移服务</param>
    /// <param name="logger">日志记录器</param>
    private static async Task LogMigrationStatus(IDatabaseMigrationService migrationService, ILogger logger)
    {
        try
        {
            var appliedMigrations = await migrationService.GetAppliedMigrationsAsync();
            var pendingMigrations = await migrationService.GetPendingMigrationsAsync();
            
            logger.LogInformation("数据库迁移状态:");
            logger.LogInformation("  已应用的迁移数量: {AppliedCount}", appliedMigrations.Count());
            logger.LogInformation("  待处理的迁移数量: {PendingCount}", pendingMigrations.Count());
            
            if (appliedMigrations.Any())
            {
                logger.LogDebug("  已应用的迁移: {AppliedMigrations}", string.Join(", ", appliedMigrations));
            }
            
            if (pendingMigrations.Any())
            {
                logger.LogDebug("  待处理的迁移: {PendingMigrations}", string.Join(", ", pendingMigrations));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "记录迁移状态时发生错误");
        }
    }
}
