using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Shared.Configuration;

/// <summary>
/// 服务器主配置类
/// </summary>
public class ServerConfiguration
{
    public ServerSettings Server { get; set; } = new();
    public DatabaseSettings Database { get; set; } = new();
    public JwtSettings Jwt { get; set; } = new();
    public CorsSettings Cors { get; set; } = new();
    public LoggingSettings Logging { get; set; } = new();
}

/// <summary>
/// 服务器基础设置
/// </summary>
public class ServerSettings
{
    [Required]
    public string Name { get; set; } = "VoxNest Server";
    
    [Required]
    public string Version { get; set; } = "1.0.0";
    
    [Required]
    public string Environment { get; set; } = "Development";
}

/// <summary>
/// 数据库设置
/// </summary>
public class DatabaseSettings
{
    [Required]
    public string Provider { get; set; } = "MySQL";
    
    [Required]
    public string ConnectionString { get; set; } = string.Empty;
    
    public bool EnableSensitiveDataLogging { get; set; } = false;
    public bool EnableDetailedErrors { get; set; } = false;
}

/// <summary>
/// JWT设置
/// </summary>
public class JwtSettings
{
    [Required]
    public string SecretKey { get; set; } = string.Empty;
    
    [Required]
    public string Issuer { get; set; } = "VoxNest";
    
    [Required]
    public string Audience { get; set; } = "VoxNest-Users";
    
    [Range(1, 43200)] // 最大30天
    public int ExpireMinutes { get; set; } = 1440;
}

/// <summary>
/// CORS设置
/// </summary>
public class CorsSettings
{
    public List<string> AllowedOrigins { get; set; } = new();
    public List<string> AllowedMethods { get; set; } = new();
    public List<string> AllowedHeaders { get; set; } = new();
}

/// <summary>
/// 日志设置
/// </summary>
public class LoggingSettings
{
    public string Level { get; set; } = "Information";
    public bool EnableConsole { get; set; } = true;
    public bool EnableFile { get; set; } = false;
    public string FilePath { get; set; } = "logs/voxnest.log";
}
