using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Services;

/// <summary>
/// 数据库迁移服务
/// </summary>
public interface IDatabaseMigrationService
{
    /// <summary>
    /// 应用所有待处理的迁移
    /// </summary>
    Task<bool> MigrateAsync();
    
    /// <summary>
    /// 检查是否有待处理的迁移
    /// </summary>
    Task<bool> HasPendingMigrationsAsync();
    
    /// <summary>
    /// 获取已应用的迁移列表
    /// </summary>
    Task<IEnumerable<string>> GetAppliedMigrationsAsync();
    
    /// <summary>
    /// 获取待处理的迁移列表
    /// </summary>
    Task<IEnumerable<string>> GetPendingMigrationsAsync();
    
    /// <summary>
    /// 检查数据库是否存在
    /// </summary>
    Task<bool> DatabaseExistsAsync();
}

/// <summary>
/// 数据库迁移服务实现
/// </summary>
public class DatabaseMigrationService : IDatabaseMigrationService
{
    private readonly VoxNestDbContext _dbContext;
    private readonly ILogger<DatabaseMigrationService> _logger;

    public DatabaseMigrationService(VoxNestDbContext dbContext, ILogger<DatabaseMigrationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<bool> MigrateAsync()
    {
        try
        {
            _logger.LogInformation("开始应用数据库迁移...");
            
            var pendingMigrations = await GetPendingMigrationsAsync();
            if (!pendingMigrations.Any())
            {
                _logger.LogInformation("没有待处理的迁移");
                return true;
            }
            
            _logger.LogInformation("发现 {Count} 个待处理的迁移: {Migrations}", 
                pendingMigrations.Count(), string.Join(", ", pendingMigrations));
            
            await _dbContext.Database.MigrateAsync();
            
            _logger.LogInformation("数据库迁移完成");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库迁移失败");
            return false;
        }
    }

    public async Task<bool> HasPendingMigrationsAsync()
    {
        try
        {
            var pendingMigrations = await _dbContext.Database.GetPendingMigrationsAsync();
            return pendingMigrations.Any();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查待处理迁移时发生错误");
            return false;
        }
    }

    public async Task<IEnumerable<string>> GetAppliedMigrationsAsync()
    {
        try
        {
            return await _dbContext.Database.GetAppliedMigrationsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取已应用迁移列表时发生错误");
            return Enumerable.Empty<string>();
        }
    }

    public async Task<IEnumerable<string>> GetPendingMigrationsAsync()
    {
        try
        {
            return await _dbContext.Database.GetPendingMigrationsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取待处理迁移列表时发生错误");
            return Enumerable.Empty<string>();
        }
    }

    public async Task<bool> DatabaseExistsAsync()
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查数据库是否存在时发生错误");
            return false;
        }
    }
}
