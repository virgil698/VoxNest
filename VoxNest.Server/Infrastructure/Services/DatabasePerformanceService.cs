using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Services;

/// <summary>
/// 数据库性能监控和优化服务
/// </summary>
public interface IDatabasePerformanceService
{
    /// <summary>
    /// 获取数据库性能统计信息
    /// </summary>
    Task<DatabasePerformanceStats> GetPerformanceStatsAsync();
    
    /// <summary>
    /// 分析慢查询
    /// </summary>
    Task<IEnumerable<SlowQueryInfo>> AnalyzeSlowQueriesAsync();
    
    /// <summary>
    /// 获取索引使用情况
    /// </summary>
    Task<IEnumerable<IndexUsageInfo>> GetIndexUsageAsync();
    
    /// <summary>
    /// 获取表大小统计
    /// </summary>
    Task<IEnumerable<TableSizeInfo>> GetTableSizesAsync();
}

/// <summary>
/// 数据库性能监控服务实现
/// </summary>
public class DatabasePerformanceService : IDatabasePerformanceService
{
    private readonly VoxNestDbContext _dbContext;
    private readonly ILogger<DatabasePerformanceService> _logger;

    public DatabasePerformanceService(VoxNestDbContext dbContext, ILogger<DatabasePerformanceService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<DatabasePerformanceStats> GetPerformanceStatsAsync()
    {
        try
        {
            var stats = new DatabasePerformanceStats();

            // 基本表统计
            stats.TotalUsers = await _dbContext.Users.CountAsync();
            stats.TotalPosts = await _dbContext.Posts.CountAsync();
            stats.TotalComments = await _dbContext.Comments.CountAsync();
            stats.TotalCategories = await _dbContext.Categories.CountAsync();
            stats.TotalTags = await _dbContext.Tags.CountAsync();

            // 活跃度统计
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            stats.ActiveUsersLast30Days = await _dbContext.Users
                .Where(u => u.LastLoginAt >= thirtyDaysAgo)
                .CountAsync();

            stats.PostsLast30Days = await _dbContext.Posts
                .Where(p => p.CreatedAt >= thirtyDaysAgo)
                .CountAsync();

            // 性能相关统计
            stats.AveragePostsPerUser = stats.TotalUsers > 0 
                ? (double)stats.TotalPosts / stats.TotalUsers 
                : 0;

            stats.AverageCommentsPerPost = stats.TotalPosts > 0 
                ? (double)stats.TotalComments / stats.TotalPosts 
                : 0;

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取数据库性能统计时发生错误");
            return new DatabasePerformanceStats();
        }
    }

    public async Task<IEnumerable<SlowQueryInfo>> AnalyzeSlowQueriesAsync()
    {
        try
        {
            var slowQueries = new List<SlowQueryInfo>();

            // 这里可以查询MySQL的performance_schema来获取慢查询信息
            // 由于需要特殊权限，这里提供一个基本实现
            var sql = @"
                SELECT 
                    sql_text,
                    exec_count,
                    avg_timer_wait / 1000000000 as avg_time_seconds,
                    max_timer_wait / 1000000000 as max_time_seconds
                FROM performance_schema.events_statements_summary_by_digest 
                WHERE avg_timer_wait > 1000000000  -- 超过1秒的查询
                ORDER BY avg_timer_wait DESC 
                LIMIT 10";

            try
            {
                var connection = _dbContext.Database.GetDbConnection();
                await connection.OpenAsync();
                
                using var command = connection.CreateCommand();
                command.CommandText = sql;
                
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var sqlTextOrdinal = reader.GetOrdinal("sql_text");
                    var execCountOrdinal = reader.GetOrdinal("exec_count");
                    var avgTimeOrdinal = reader.GetOrdinal("avg_time_seconds");
                    var maxTimeOrdinal = reader.GetOrdinal("max_time_seconds");
                    
                    slowQueries.Add(new SlowQueryInfo
                    {
                        SqlText = reader.IsDBNull(sqlTextOrdinal) ? "Unknown Query" : reader.GetString(sqlTextOrdinal),
                        ExecutionCount = reader.IsDBNull(execCountOrdinal) ? 0 : reader.GetInt64(execCountOrdinal),
                        AverageTimeSeconds = reader.IsDBNull(avgTimeOrdinal) ? 0.0 : reader.GetDouble(avgTimeOrdinal),
                        MaxTimeSeconds = reader.IsDBNull(maxTimeOrdinal) ? 0.0 : reader.GetDouble(maxTimeOrdinal)
                    });
                }
            }
            catch (Exception queryEx)
            {
                _logger.LogWarning(queryEx, "无法获取慢查询信息，可能需要额外的数据库权限");
            }

            return slowQueries;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "分析慢查询时发生错误");
            return Enumerable.Empty<SlowQueryInfo>();
        }
    }

    public async Task<IEnumerable<IndexUsageInfo>> GetIndexUsageAsync()
    {
        try
        {
            var indexUsage = new List<IndexUsageInfo>();

            var sql = @"
                SELECT 
                    t.table_name,
                    s.index_name,
                    s.rows_read,
                    s.rows_examined
                FROM performance_schema.table_io_waits_summary_by_index_usage s
                JOIN information_schema.tables t ON t.table_name = s.object_name
                WHERE t.table_schema = DATABASE()
                AND s.index_name IS NOT NULL
                ORDER BY s.rows_read DESC";

            try
            {
                var connection = _dbContext.Database.GetDbConnection();
                await connection.OpenAsync();
                
                using var command = connection.CreateCommand();
                command.CommandText = sql;
                
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var tableNameOrdinal = reader.GetOrdinal("table_name");
                    var indexNameOrdinal = reader.GetOrdinal("index_name");
                    var rowsReadOrdinal = reader.GetOrdinal("rows_read");
                    var rowsExaminedOrdinal = reader.GetOrdinal("rows_examined");
                    
                    indexUsage.Add(new IndexUsageInfo
                    {
                        TableName = reader.IsDBNull(tableNameOrdinal) ? "Unknown" : reader.GetString(tableNameOrdinal),
                        IndexName = reader.IsDBNull(indexNameOrdinal) ? "Unknown" : reader.GetString(indexNameOrdinal),
                        RowsRead = reader.IsDBNull(rowsReadOrdinal) ? 0 : reader.GetInt64(rowsReadOrdinal),
                        RowsExamined = reader.IsDBNull(rowsExaminedOrdinal) ? 0 : reader.GetInt64(rowsExaminedOrdinal)
                    });
                }
            }
            catch (Exception queryEx)
            {
                _logger.LogWarning(queryEx, "无法获取索引使用信息，可能需要额外的数据库权限");
            }

            return indexUsage;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取索引使用情况时发生错误");
            return Enumerable.Empty<IndexUsageInfo>();
        }
    }

    public async Task<IEnumerable<TableSizeInfo>> GetTableSizesAsync()
    {
        try
        {
            var tableSizes = new List<TableSizeInfo>();

            var sql = @"
                SELECT 
                    table_name,
                    table_rows,
                    data_length,
                    index_length,
                    (data_length + index_length) as total_size
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC";

            var connection = _dbContext.Database.GetDbConnection();
            await connection.OpenAsync();
            
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var tableNameOrdinal = reader.GetOrdinal("table_name");
                var tableRowsOrdinal = reader.GetOrdinal("table_rows");
                var dataLengthOrdinal = reader.GetOrdinal("data_length");
                var indexLengthOrdinal = reader.GetOrdinal("index_length");
                var totalSizeOrdinal = reader.GetOrdinal("total_size");
                
                tableSizes.Add(new TableSizeInfo
                {
                    TableName = reader.IsDBNull(tableNameOrdinal) ? "Unknown" : reader.GetString(tableNameOrdinal),
                    RowCount = reader.IsDBNull(tableRowsOrdinal) ? 0 : reader.GetInt64(tableRowsOrdinal),
                    DataSize = reader.IsDBNull(dataLengthOrdinal) ? 0 : reader.GetInt64(dataLengthOrdinal),
                    IndexSize = reader.IsDBNull(indexLengthOrdinal) ? 0 : reader.GetInt64(indexLengthOrdinal),
                    TotalSize = reader.IsDBNull(totalSizeOrdinal) ? 0 : reader.GetInt64(totalSizeOrdinal)
                });
            }

            return tableSizes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取表大小信息时发生错误");
            return Enumerable.Empty<TableSizeInfo>();
        }
    }
}

/// <summary>
/// 数据库性能统计信息
/// </summary>
public class DatabasePerformanceStats
{
    public int TotalUsers { get; set; }
    public int TotalPosts { get; set; }
    public int TotalComments { get; set; }
    public int TotalCategories { get; set; }
    public int TotalTags { get; set; }
    public int ActiveUsersLast30Days { get; set; }
    public int PostsLast30Days { get; set; }
    public double AveragePostsPerUser { get; set; }
    public double AverageCommentsPerPost { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// 慢查询信息
/// </summary>
public class SlowQueryInfo
{
    public string SqlText { get; set; } = string.Empty;
    public long ExecutionCount { get; set; }
    public double AverageTimeSeconds { get; set; }
    public double MaxTimeSeconds { get; set; }
}

/// <summary>
/// 索引使用情况
/// </summary>
public class IndexUsageInfo
{
    public string TableName { get; set; } = string.Empty;
    public string IndexName { get; set; } = string.Empty;
    public long RowsRead { get; set; }
    public long RowsExamined { get; set; }
    public double Efficiency => RowsExamined > 0 ? (double)RowsRead / RowsExamined : 0;
}

/// <summary>
/// 表大小信息
/// </summary>
public class TableSizeInfo
{
    public string TableName { get; set; } = string.Empty;
    public long RowCount { get; set; }
    public long DataSize { get; set; }
    public long IndexSize { get; set; }
    public long TotalSize { get; set; }
    
    public string DataSizeFormatted => FormatBytes(DataSize);
    public string IndexSizeFormatted => FormatBytes(IndexSize);
    public string TotalSizeFormatted => FormatBytes(TotalSize);
    
    private static string FormatBytes(long bytes)
    {
        string[] suffixes = { "B", "KB", "MB", "GB", "TB" };
        int counter = 0;
        decimal number = bytes;
        while (Math.Round(number / 1024) >= 1)
        {
            number /= 1024;
            counter++;
        }
        return $"{number:N1} {suffixes[counter]}";
    }
}
