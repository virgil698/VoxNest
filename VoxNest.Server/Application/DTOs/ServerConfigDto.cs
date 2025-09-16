using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Application.DTOs;

/// <summary>
/// 服务器配置数据传输对象
/// </summary>
public class ServerConfigDto
{
    /// <summary>
    /// 服务器名称
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 服务器版本
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// 运行环境
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Environment { get; set; } = string.Empty;


    /// <summary>
    /// 时区设置
    /// </summary>
    [Required]
    [StringLength(100)]
    public string TimeZone { get; set; } = "Asia/Shanghai";

    /// <summary>
    /// 是否启用HTTPS重定向
    /// </summary>
    public bool EnableHttpsRedirection { get; set; }

    /// <summary>
    /// 是否启用详细错误信息
    /// </summary>
    public bool EnableDetailedErrors { get; set; }

    /// <summary>
    /// 最大请求体大小（MB）
    /// </summary>
    [Range(1, 1024)]
    public int MaxRequestBodySize { get; set; } = 30;
}

/// <summary>
/// 数据库配置数据传输对象
/// </summary>
public class DatabaseConfigDto
{
    /// <summary>
    /// 数据库提供商
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Provider { get; set; } = string.Empty;

    /// <summary>
    /// 连接字符串
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用敏感数据日志
    /// </summary>
    public bool EnableSensitiveDataLogging { get; set; }

    /// <summary>
    /// 是否启用详细错误信息
    /// </summary>
    public bool EnableDetailedErrors { get; set; }

    /// <summary>
    /// 连接池最大大小
    /// </summary>
    [Range(1, 1000)]
    public int MaxPoolSize { get; set; } = 50;

    /// <summary>
    /// 连接超时时间（秒）
    /// </summary>
    [Range(5, 300)]
    public int ConnectionTimeout { get; set; } = 30;
}

/// <summary>
/// JWT配置数据传输对象
/// </summary>
public class JwtConfigDto
{
    /// <summary>
    /// 密钥
    /// </summary>
    [Required]
    [StringLength(500)]
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// 发行者
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// 受众
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// 过期时间（分钟）
    /// </summary>
    [Range(5, 43200)] // 5分钟到30天
    public int ExpireMinutes { get; set; } = 1440;

    /// <summary>
    /// 时钟偏差（分钟）
    /// </summary>
    [Range(0, 60)]
    public int ClockSkew { get; set; } = 5;
}

/// <summary>
/// CORS配置数据传输对象
/// </summary>
public class CorsConfigDto
{
    /// <summary>
    /// 允许的源
    /// </summary>
    public List<string> AllowedOrigins { get; set; } = new();

    /// <summary>
    /// 允许的方法
    /// </summary>
    public List<string> AllowedMethods { get; set; } = new();

    /// <summary>
    /// 允许的头部
    /// </summary>
    public List<string> AllowedHeaders { get; set; } = new();

    /// <summary>
    /// 是否允许凭据
    /// </summary>
    public bool AllowCredentials { get; set; } = true;
}

/// <summary>
/// 日志配置数据传输对象
/// </summary>
public class LoggingConfigDto
{
    /// <summary>
    /// 日志级别
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Level { get; set; } = "Information";

    /// <summary>
    /// 是否启用控制台日志
    /// </summary>
    public bool EnableConsole { get; set; } = true;

    /// <summary>
    /// 是否启用文件日志
    /// </summary>
    public bool EnableFile { get; set; } = true;

    /// <summary>
    /// 日志文件路径
    /// </summary>
    [StringLength(500)]
    public string FilePath { get; set; } = "logs/voxnest.log";

    /// <summary>
    /// 日志文件最大大小（MB）
    /// </summary>
    [Range(1, 1024)]
    public int MaxFileSize { get; set; } = 100;

    /// <summary>
    /// 保留的日志文件数量
    /// </summary>
    [Range(1, 100)]
    public int RetainedFileCount { get; set; } = 30;
}

/// <summary>
/// 完整服务器配置数据传输对象
/// </summary>
public class FullServerConfigDto
{
    /// <summary>
    /// 服务器配置
    /// </summary>
    [Required]
    public ServerConfigDto Server { get; set; } = new();

    /// <summary>
    /// 数据库配置
    /// </summary>
    [Required]
    public DatabaseConfigDto Database { get; set; } = new();

    /// <summary>
    /// JWT配置
    /// </summary>
    [Required]
    public JwtConfigDto Jwt { get; set; } = new();

    /// <summary>
    /// CORS配置
    /// </summary>
    [Required]
    public CorsConfigDto Cors { get; set; } = new();

    /// <summary>
    /// 日志配置
    /// </summary>
    [Required]
    public LoggingConfigDto Logging { get; set; } = new();
}

/// <summary>
/// 时区信息数据传输对象
/// </summary>
public class TimeZoneInfoDto
{
    /// <summary>
    /// 时区ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 标准名称
    /// </summary>
    public string StandardName { get; set; } = string.Empty;

    /// <summary>
    /// UTC偏移量
    /// </summary>
    public TimeSpan BaseUtcOffset { get; set; }

    /// <summary>
    /// 是否支持夏令时
    /// </summary>
    public bool SupportsDaylightSavingTime { get; set; }
}

/// <summary>
/// 配置更新请求数据传输对象
/// </summary>
public class ConfigUpdateRequestDto
{
    /// <summary>
    /// 配置类别
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 配置数据（JSON）
    /// </summary>
    [Required]
    public object ConfigData { get; set; } = new();

    /// <summary>
    /// 是否需要重启服务
    /// </summary>
    public bool RequiresRestart { get; set; }
}
