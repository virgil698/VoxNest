using System.Collections.Concurrent;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 安装模式专用的简化锁服务实现
/// 只使用本地锁，不依赖数据库
/// </summary>
public class SimpleInstallLockService : IInstallLockService
{
    private readonly ILogger<SimpleInstallLockService> _logger;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _localLocks = new();
    private static readonly ConcurrentDictionary<string, DateTime> _lockTimestamps = new();

    public SimpleInstallLockService(ILogger<SimpleInstallLockService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<Result<IAsyncDisposable>> AcquireLockAsync(string operation, int timeoutSeconds = 30)
    {
        try
        {
            _logger.LogInformation("尝试获取操作锁 (安装模式): {Operation}", operation);

            // 获取本地锁（防止同一进程内的并发）
            var localLock = _localLocks.GetOrAdd(operation, _ => new SemaphoreSlim(1, 1));
            
            var lockAcquired = await localLock.WaitAsync(TimeSpan.FromSeconds(timeoutSeconds));
            if (!lockAcquired)
            {
                _logger.LogWarning("获取本地锁超时 (安装模式): {Operation}", operation);
                return Result<IAsyncDisposable>.Failure($"操作 {operation} 正在进行中，请稍后重试");
            }

            // 记录锁获取时间
            _lockTimestamps[operation] = DateTime.UtcNow;

            _logger.LogInformation("成功获取操作锁 (安装模式): {Operation}", operation);

            // 返回本地锁对象
            var simpleLock = new SimpleLock(operation, localLock, _logger);
            return Result<IAsyncDisposable>.Success(simpleLock);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取操作锁时发生异常 (安装模式): {Operation}", operation);
            return Result<IAsyncDisposable>.Failure($"获取操作锁失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public Task<bool> IsLockedAsync(string operation)
    {
        try
        {
            // 检查本地锁
            if (_localLocks.TryGetValue(operation, out var localLock) && localLock.CurrentCount == 0)
            {
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查锁状态时发生异常 (安装模式): {Operation}", operation);
            return Task.FromResult(false);
        }
    }

    /// <inheritdoc/>
    public Task<Result> ForceReleaseLockAsync(string operation)
    {
        try
        {
            _logger.LogWarning("强制释放锁 (安装模式): {Operation}", operation);

            // 释放本地锁
            if (_localLocks.TryGetValue(operation, out var localLock))
            {
                localLock.Release();
            }

            // 清理时间戳
            _lockTimestamps.TryRemove(operation, out _);

            _logger.LogInformation("强制释放锁完成 (安装模式): {Operation}", operation);
            return Task.FromResult(Result.Success("锁已强制释放"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "强制释放锁时发生异常 (安装模式): {Operation}", operation);
            return Task.FromResult(Result.Failure($"强制释放锁失败: {ex.Message}"));
        }
    }

    /// <summary>
    /// 简单锁实现
    /// </summary>
    private class SimpleLock : IAsyncDisposable
    {
        private readonly string _operation;
        private readonly SemaphoreSlim _localLock;
        private readonly ILogger _logger;
        private bool _disposed = false;

        public SimpleLock(string operation, SemaphoreSlim localLock, ILogger logger)
        {
            _operation = operation;
            _localLock = localLock;
            _logger = logger;
        }

        public ValueTask DisposeAsync()
        {
            if (_disposed)
                return ValueTask.CompletedTask;

            try
            {
                _logger.LogInformation("释放操作锁 (安装模式): {Operation}", _operation);

                // 释放本地锁
                _localLock.Release();

                // 清理时间戳
                _lockTimestamps.TryRemove(_operation, out _);

                _logger.LogInformation("成功释放操作锁 (安装模式): {Operation}", _operation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "释放操作锁时发生异常 (安装模式): {Operation}", _operation);
            }
            finally
            {
                _disposed = true;
            }

            return ValueTask.CompletedTask;
        }
    }
}
