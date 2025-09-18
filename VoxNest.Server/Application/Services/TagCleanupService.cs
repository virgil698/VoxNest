using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VoxNest.Server.Application.Interfaces;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 标签清理后台服务
/// </summary>
public class TagCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TagCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24); // 每24小时运行一次
    private readonly int _cleanupThresholdDays = 7; // 7天未使用的动态标签将被清理

    public TagCleanupService(IServiceProvider serviceProvider, ILogger<TagCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Tag cleanup service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformCleanupAsync();
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // 正常的取消操作，不需要记录错误
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during tag cleanup");
                // 出错后等待较短时间再重试
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }

        _logger.LogInformation("Tag cleanup service stopped");
    }

    private async Task PerformCleanupAsync()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var tagService = scope.ServiceProvider.GetRequiredService<ITagService>();

            _logger.LogInformation("Starting scheduled tag cleanup");

            var cleanedCount = await tagService.CleanupUnusedDynamicTagsAsync(_cleanupThresholdDays);

            if (cleanedCount > 0)
            {
                _logger.LogInformation("Cleaned up {Count} unused dynamic tags", cleanedCount);
            }
            else
            {
                _logger.LogDebug("No unused dynamic tags found for cleanup");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during tag cleanup execution");
            throw;
        }
    }

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Tag cleanup service is starting");
        await base.StartAsync(cancellationToken);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Tag cleanup service is stopping");
        await base.StopAsync(cancellationToken);
    }
}
