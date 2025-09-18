using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using VoxNest.Server.Application.DTOs.Log;
using VoxNest.Server.Application.Interfaces;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 后台日志记录服务，确保重要日志不会因为客户端取消请求而丢失
/// </summary>
public class BackgroundLogService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BackgroundLogService> _logger;
    private readonly ConcurrentQueue<LogQueueItem> _logQueue = new();
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    
    public BackgroundLogService(
        IServiceScopeFactory scopeFactory, 
        ILogger<BackgroundLogService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// 将日志条目加入队列进行后台处理
    /// </summary>
    public void EnqueueLog(CreateLogEntryDto logDto, int? userId = null)
    {
        _logQueue.Enqueue(new LogQueueItem
        {
            LogDto = logDto,
            UserId = userId,
            EnqueuedAt = DateTime.UtcNow
        });
        
        // 释放信号量以唤醒处理循环
        _semaphore.Release();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background log service started");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 等待信号量或者超时
                await _semaphore.WaitAsync(TimeSpan.FromSeconds(10), stoppingToken);
                
                // 处理队列中的所有日志
                await ProcessLogQueue(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // 服务正在停止
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in background log service");
                
                // 等待一段时间后重试
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        
        // 在服务停止前处理剩余的日志
        if (_logQueue.Count > 0)
        {
            _logger.LogInformation("Processing remaining {Count} logs before shutdown", _logQueue.Count);
            await ProcessLogQueue(CancellationToken.None);
        }
        
        _logger.LogInformation("Background log service stopped");
    }

    private async Task ProcessLogQueue(CancellationToken cancellationToken)
    {
        var processedCount = 0;
        var maxBatchSize = 100; // 每批最多处理100条日志
        
        using var scope = _scopeFactory.CreateScope();
        var logService = scope.ServiceProvider.GetRequiredService<ILogService>();
        
        while (_logQueue.TryDequeue(out var logItem) && processedCount < maxBatchSize)
        {
            if (cancellationToken.IsCancellationRequested)
                break;
                
            try
            {
                // 使用独立的超时token，不依赖于原始请求
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                var combinedToken = CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken, timeoutCts.Token).Token;
                
                await logService.CreateLogAsync(logItem.LogDto, logItem.UserId, combinedToken);
                processedCount++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                // 如果是服务停止导致的取消，将日志重新入队
                _logQueue.Enqueue(logItem);
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process log item: {Message}", logItem.LogDto.Message);
                
                // 如果是重要日志，可以考虑重试
                if (IsImportantLog(logItem.LogDto))
                {
                    var retryItem = logItem with { RetryCount = logItem.RetryCount + 1 };
                    if (retryItem.RetryCount <= 3)
                    {
                        _logQueue.Enqueue(retryItem);
                    }
                    else
                    {
                        _logger.LogWarning("Dropping log after {RetryCount} retries: {Message}", 
                            retryItem.RetryCount, logItem.LogDto.Message);
                    }
                }
            }
        }
        
        if (processedCount > 0)
        {
            _logger.LogDebug("Processed {Count} background log entries", processedCount);
        }
    }

    private static bool IsImportantLog(CreateLogEntryDto logDto)
    {
        return logDto.Level <= Domain.Enums.LogLevel.Warning || 
               logDto.Category == Domain.Enums.LogCategory.Security ||
               logDto.Category == Domain.Enums.LogCategory.System;
    }

    public override void Dispose()
    {
        _semaphore?.Dispose();
        base.Dispose();
    }
}

/// <summary>
/// 日志队列项目
/// </summary>
public record LogQueueItem
{
    public CreateLogEntryDto LogDto { get; init; } = null!;
    public int? UserId { get; init; }
    public DateTime EnqueuedAt { get; init; }
    public int RetryCount { get; init; } = 0;
}
