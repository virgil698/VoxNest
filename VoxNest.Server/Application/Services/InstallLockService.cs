using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 安装操作锁服务实现
/// </summary>
public class InstallLockService : IInstallLockService
{
    private readonly IDbContextFactory<VoxNestDbContext> _contextFactory;
    private readonly ILogger<InstallLockService> _logger;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _localLocks = new();
    private static readonly ConcurrentDictionary<string, DateTime> _lockTimestamps = new();

    public InstallLockService(IDbContextFactory<VoxNestDbContext> contextFactory, ILogger<InstallLockService> logger)
    {
        _contextFactory = contextFactory;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<Result<IAsyncDisposable>> AcquireLockAsync(string operation, int timeoutSeconds = 30)
    {
        try
        {
            _logger.LogInformation("尝试获取操作锁: {Operation}", operation);

            // 获取本地锁（防止同一进程内的并发）
            var localLock = _localLocks.GetOrAdd(operation, _ => new SemaphoreSlim(1, 1));
            
            var lockAcquired = await localLock.WaitAsync(TimeSpan.FromSeconds(timeoutSeconds));
            if (!lockAcquired)
            {
                _logger.LogWarning("获取本地锁超时: {Operation}", operation);
                return Result<IAsyncDisposable>.Failure($"操作 {operation} 正在进行中，请稍后重试");
            }

            // 检查分布式锁（防止多实例并发）
            var distributedLockResult = await TryAcquireDistributedLockAsync(operation, timeoutSeconds);
            if (!distributedLockResult.IsSuccess)
            {
                localLock.Release();
                return Result<IAsyncDisposable>.Failure(distributedLockResult.Message);
            }

            // 记录锁获取时间
            _lockTimestamps[operation] = DateTime.UtcNow;

            _logger.LogInformation("成功获取操作锁: {Operation}", operation);

            // 返回复合锁对象
            var compositeLock = new CompositeLock(operation, localLock, this, _logger);
            return Result<IAsyncDisposable>.Success(compositeLock);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取操作锁时发生异常: {Operation}", operation);
            return Result<IAsyncDisposable>.Failure($"获取操作锁失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsLockedAsync(string operation)
    {
        try
        {
            // 检查本地锁
            if (_localLocks.TryGetValue(operation, out var localLock) && localLock.CurrentCount == 0)
            {
                return true;
            }

            // 检查分布式锁
            return await CheckDistributedLockAsync(operation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查锁状态时发生异常: {Operation}", operation);
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<Result> ForceReleaseLockAsync(string operation)
    {
        try
        {
            _logger.LogWarning("强制释放锁: {Operation}", operation);

            // 释放本地锁
            if (_localLocks.TryGetValue(operation, out var localLock))
            {
                localLock.Release();
            }

            // 释放分布式锁
            await ReleaseDistributedLockAsync(operation);

            // 清理时间戳
            _lockTimestamps.TryRemove(operation, out _);

            _logger.LogInformation("强制释放锁完成: {Operation}", operation);
            return Result.Success("锁已强制释放");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "强制释放锁时发生异常: {Operation}", operation);
            return Result.Failure($"强制释放锁失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 尝试获取分布式锁
    /// </summary>
    private async Task<Result> TryAcquireDistributedLockAsync(string operation, int timeoutSeconds)
    {
        try
        {
            // 如果数据库不可用，跳过分布式锁检查
            if (!await IsDatabaseAvailableAsync())
            {
                _logger.LogInformation("数据库不可用，跳过分布式锁检查: {Operation}", operation);
                return Result.Success("数据库不可用，使用本地锁");
            }

            using var context = await _contextFactory.CreateDbContextAsync();
            
            var lockKey = $"install_lock_{operation}";
            var lockExpiry = DateTime.UtcNow.AddSeconds(timeoutSeconds);

            // 尝试插入锁记录
            var sql = @"
                INSERT IGNORE INTO InstallLocks (LockKey, AcquiredAt, ExpiresAt, ProcessId)
                VALUES (@lockKey, @acquiredAt, @expiresAt, @processId)";

            var result = await context.Database.ExecuteSqlRawAsync(sql,
                new MySqlConnector.MySqlParameter("@lockKey", lockKey),
                new MySqlConnector.MySqlParameter("@acquiredAt", DateTime.UtcNow),
                new MySqlConnector.MySqlParameter("@expiresAt", lockExpiry),
                new MySqlConnector.MySqlParameter("@processId", Environment.ProcessId));

            if (result > 0)
            {
                return Result.Success("分布式锁获取成功");
            }

            // 检查是否是过期锁
            await CleanupExpiredLocksAsync(context);
            
            return Result.Failure($"操作 {operation} 正在其他实例中执行，请稍后重试");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分布式锁时发生异常: {Operation}", operation);
            return Result.Failure($"获取分布式锁失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 检查分布式锁
    /// </summary>
    private async Task<bool> CheckDistributedLockAsync(string operation)
    {
        try
        {
            if (!await IsDatabaseAvailableAsync())
            {
                return false;
            }

            using var context = await _contextFactory.CreateDbContextAsync();
            
            var lockKey = $"install_lock_{operation}";
            var sql = "SELECT COUNT(*) FROM InstallLocks WHERE LockKey = @lockKey AND ExpiresAt > @now";

            var count = await context.Database.SqlQueryRaw<int>(sql,
                new MySqlConnector.MySqlParameter("@lockKey", lockKey),
                new MySqlConnector.MySqlParameter("@now", DateTime.UtcNow))
                .FirstOrDefaultAsync();

            return count > 0;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 释放分布式锁
    /// </summary>
    private async Task ReleaseDistributedLockAsync(string operation)
    {
        try
        {
            if (!await IsDatabaseAvailableAsync())
            {
                return;
            }

            using var context = await _contextFactory.CreateDbContextAsync();
            
            var lockKey = $"install_lock_{operation}";
            var sql = "DELETE FROM InstallLocks WHERE LockKey = @lockKey";

            await context.Database.ExecuteSqlRawAsync(sql,
                new MySqlConnector.MySqlParameter("@lockKey", lockKey));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "释放分布式锁时发生异常: {Operation}", operation);
        }
    }

    /// <summary>
    /// 清理过期锁
    /// </summary>
    private async Task CleanupExpiredLocksAsync(VoxNestDbContext context)
    {
        try
        {
            var sql = "DELETE FROM InstallLocks WHERE ExpiresAt < @now";
            await context.Database.ExecuteSqlRawAsync(sql,
                new MySqlConnector.MySqlParameter("@now", DateTime.UtcNow));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "清理过期锁时发生异常");
        }
    }

    /// <summary>
    /// 检查数据库是否可用
    /// </summary>
    private async Task<bool> IsDatabaseAvailableAsync()
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 复合锁实现
    /// </summary>
    private class CompositeLock : IAsyncDisposable
    {
        private readonly string _operation;
        private readonly SemaphoreSlim _localLock;
        private readonly InstallLockService _lockService;
        private readonly ILogger _logger;
        private bool _disposed = false;

        public CompositeLock(string operation, SemaphoreSlim localLock, InstallLockService lockService, ILogger logger)
        {
            _operation = operation;
            _localLock = localLock;
            _lockService = lockService;
            _logger = logger;
        }

        public async ValueTask DisposeAsync()
        {
            if (_disposed)
                return;

            try
            {
                _logger.LogInformation("释放操作锁: {Operation}", _operation);

                // 释放分布式锁
                await _lockService.ReleaseDistributedLockAsync(_operation);

                // 释放本地锁
                _localLock.Release();

                // 清理时间戳
                _lockTimestamps.TryRemove(_operation, out _);

                _logger.LogInformation("成功释放操作锁: {Operation}", _operation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "释放操作锁时发生异常: {Operation}", _operation);
            }
            finally
            {
                _disposed = true;
            }
        }
    }
}
