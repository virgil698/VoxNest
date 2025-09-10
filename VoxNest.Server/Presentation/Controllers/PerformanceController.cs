using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Infrastructure.Services;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 性能监控控制器
/// </summary>
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // 只允许管理员访问性能数据
public class PerformanceController : BaseApiController
{
    private readonly IDatabasePerformanceService _performanceService;

    public PerformanceController(
        IDatabasePerformanceService performanceService,
        ILogger<PerformanceController> logger) : base(logger)
    {
        _performanceService = performanceService;
    }

    /// <summary>
    /// 获取数据库性能统计
    /// </summary>
    /// <returns>性能统计信息</returns>
    [HttpGet("database/stats")]
    public async Task<IActionResult> GetDatabaseStats()
    {
        LogApiCall("获取数据库性能统计");
        return await ExecuteDataAsync(
            () => _performanceService.GetPerformanceStatsAsync(),
            "获取数据库性能统计"
        );
    }

    /// <summary>
    /// 分析慢查询
    /// </summary>
    /// <returns>慢查询列表</returns>
    [HttpGet("database/slow-queries")]
    public async Task<IActionResult> GetSlowQueries()
    {
        LogApiCall("分析慢查询");
        return await ExecuteDataAsync(
            () => _performanceService.AnalyzeSlowQueriesAsync(),
            "分析慢查询"
        );
    }

    /// <summary>
    /// 获取索引使用情况
    /// </summary>
    /// <returns>索引使用信息</returns>
    [HttpGet("database/index-usage")]
    public async Task<IActionResult> GetIndexUsage()
    {
        LogApiCall("获取索引使用情况");
        return await ExecuteDataAsync(
            () => _performanceService.GetIndexUsageAsync(),
            "获取索引使用情况"
        );
    }

    /// <summary>
    /// 获取表大小统计
    /// </summary>
    /// <returns>表大小信息</returns>
    [HttpGet("database/table-sizes")]
    public async Task<IActionResult> GetTableSizes()
    {
        LogApiCall("获取表大小统计");
        return await ExecuteDataAsync(
            () => _performanceService.GetTableSizesAsync(),
            "获取表大小统计"
        );
    }

    /// <summary>
    /// 获取完整的性能报告
    /// </summary>
    /// <returns>性能报告</returns>
    [HttpGet("database/report")]
    public async Task<IActionResult> GetPerformanceReport()
    {
        LogApiCall("获取性能报告");
        
        try
        {
            var stats = await _performanceService.GetPerformanceStatsAsync();
            var slowQueries = await _performanceService.AnalyzeSlowQueriesAsync();
            var indexUsage = await _performanceService.GetIndexUsageAsync();
            var tableSizes = await _performanceService.GetTableSizesAsync();

            var report = new
            {
                GeneratedAt = DateTime.UtcNow,
                Statistics = stats,
                SlowQueries = slowQueries.Take(10), // 只显示前10个最慢的查询
                IndexUsage = indexUsage.Take(20), // 只显示前20个索引
                TableSizes = tableSizes,
                Summary = new
                {
                    TotalTables = tableSizes.Count(),
                    TotalDataSize = tableSizes.Sum(t => t.DataSize),
                    TotalIndexSize = tableSizes.Sum(t => t.IndexSize),
                    LargestTable = tableSizes.OrderByDescending(t => t.TotalSize).FirstOrDefault()?.TableName,
                    MostUsedIndex = indexUsage.OrderByDescending(i => i.RowsRead).FirstOrDefault()?.IndexName
                }
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "生成性能报告时发生错误");
            return StatusCode(500, new { 
                error = "生成性能报告失败", 
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// 获取系统健康状态
    /// </summary>
    /// <returns>健康状态</returns>
    [HttpGet("health")]
    [AllowAnonymous] // 健康检查端点应该允许匿名访问
    public async Task<IActionResult> GetHealthStatus()
    {
        try
        {
            var stats = await _performanceService.GetPerformanceStatsAsync();
            
            var health = new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Checks = new
                {
                    Database = new
                    {
                        Status = "Up",
                        ResponseTime = "< 100ms", // 可以添加实际的响应时间测量
                        TotalUsers = stats.TotalUsers,
                        TotalPosts = stats.TotalPosts
                    },
                    Application = new
                    {
                        Status = "Up",
                        Version = "1.0.0", // 可以从程序集获取版本信息
                        Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
                    }
                }
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "健康检查失败");
            return StatusCode(503, new
            {
                Status = "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            });
        }
    }
}
