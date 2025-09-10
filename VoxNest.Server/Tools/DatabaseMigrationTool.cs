using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Infrastructure.Services;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Extensions;

namespace VoxNest.Server.Tools;

/// <summary>
/// 数据库迁移工具
/// 可用于命令行或管理界面中的数据库管理
/// </summary>
public class DatabaseMigrationTool
{
    private readonly IDatabaseMigrationService _migrationService;
    private readonly ILogger<DatabaseMigrationTool> _logger;

    public DatabaseMigrationTool(IDatabaseMigrationService migrationService, ILogger<DatabaseMigrationTool> logger)
    {
        _migrationService = migrationService;
        _logger = logger;
    }

    /// <summary>
    /// 获取数据库状态信息
    /// </summary>
    /// <returns>数据库状态</returns>
    public async Task<DatabaseStatus> GetDatabaseStatusAsync()
    {
        var status = new DatabaseStatus
        {
            DatabaseExists = await _migrationService.DatabaseExistsAsync(),
            AppliedMigrations = (await _migrationService.GetAppliedMigrationsAsync()).ToList(),
            PendingMigrations = (await _migrationService.GetPendingMigrationsAsync()).ToList()
        };
        
        status.HasPendingMigrations = status.PendingMigrations.Any();
        status.IsUpToDate = !status.HasPendingMigrations;
        
        return status;
    }

    /// <summary>
    /// 应用所有待处理的迁移
    /// </summary>
    /// <returns>迁移结果</returns>
    public async Task<MigrationResult> ApplyMigrationsAsync()
    {
        try
        {
            _logger.LogInformation("开始应用数据库迁移...");
            
            var status = await GetDatabaseStatusAsync();
            if (!status.HasPendingMigrations)
            {
                _logger.LogInformation("没有待处理的迁移");
                return new MigrationResult
                {
                    Success = true,
                    Message = "数据库已是最新版本",
                    AppliedMigrations = new List<string>()
                };
            }

            var pendingMigrations = status.PendingMigrations.ToList();
            _logger.LogInformation("发现 {Count} 个待处理的迁移: {Migrations}",
                pendingMigrations.Count, string.Join(", ", pendingMigrations));

            var success = await _migrationService.MigrateAsync();
            
            return new MigrationResult
            {
                Success = success,
                Message = success ? "迁移完成" : "迁移失败",
                AppliedMigrations = success ? pendingMigrations : new List<string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "应用迁移时发生错误");
            return new MigrationResult
            {
                Success = false,
                Message = $"迁移失败: {ex.Message}",
                AppliedMigrations = new List<string>()
            };
        }
    }

    /// <summary>
    /// 验证数据库连接
    /// </summary>
    /// <returns>连接状态</returns>
    public async Task<bool> ValidateConnectionAsync()
    {
        try
        {
            return await _migrationService.DatabaseExistsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "验证数据库连接时发生错误");
            return false;
        }
    }

    /// <summary>
    /// 创建数据库迁移工具实例（用于独立使用）
    /// </summary>
    /// <param name="configFile">配置文件路径</param>
    /// <returns>迁移工具实例</returns>
    public static DatabaseMigrationTool Create(string configFile = "server-config.yml")
    {
        // 加载配置
        var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(configFile);
        
        // 验证配置
        var validationResult = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.ValidateConfiguration(config);
        if (!validationResult.IsValid)
        {
            throw new InvalidOperationException($"配置无效: {string.Join("; ", validationResult.Errors)}");
        }

        // 创建DbContext
        var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
        ConfigureDbContext(optionsBuilder, config.Database);
        var dbContext = new VoxNestDbContext(optionsBuilder.Options);

        // 创建日志
        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        var migrationLogger = loggerFactory.CreateLogger<DatabaseMigrationService>();
        var toolLogger = loggerFactory.CreateLogger<DatabaseMigrationTool>();

        // 创建迁移服务
        var migrationService = new DatabaseMigrationService(dbContext, migrationLogger);
        
        return new DatabaseMigrationTool(migrationService, toolLogger);
    }

    private static void ConfigureDbContext(DbContextOptionsBuilder optionsBuilder, DatabaseSettings dbSettings)
    {
        switch (dbSettings.Provider.ToUpper())
        {
            case "MYSQL":
            case "MARIADB":
                optionsBuilder.UseMySql(dbSettings.ConnectionString, 
                    ServerVersion.AutoDetect(dbSettings.ConnectionString));
                break;
            default:
                throw new NotSupportedException($"不支持的数据库提供商: {dbSettings.Provider}");
        }

        if (dbSettings.EnableSensitiveDataLogging)
        {
            optionsBuilder.EnableSensitiveDataLogging();
        }

        if (dbSettings.EnableDetailedErrors)
        {
            optionsBuilder.EnableDetailedErrors();
        }
    }
}

/// <summary>
/// 数据库状态
/// </summary>
public class DatabaseStatus
{
    public bool DatabaseExists { get; set; }
    public bool HasPendingMigrations { get; set; }
    public bool IsUpToDate { get; set; }
    public List<string> AppliedMigrations { get; set; } = new();
    public List<string> PendingMigrations { get; set; } = new();
}

/// <summary>
/// 迁移结果
/// </summary>
public class MigrationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> AppliedMigrations { get; set; } = new();
}
