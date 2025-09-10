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
    public SecuritySettings Security { get; set; } = new();
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
    
    /// <summary>
    /// 时钟偏差容忍度（分钟）
    /// </summary>
    [Range(0, 60)]
    public int ClockSkew { get; set; } = 5;
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
/// 安全设置
/// </summary>
public class SecuritySettings
{
    /// <summary>
    /// 是否要求HTTPS元数据
    /// </summary>
    public bool RequireHttpsMetadata { get; set; } = true;
    
    /// <summary>
    /// 是否要求签名令牌
    /// </summary>
    public bool RequireSignedTokens { get; set; } = true;
    
    /// <summary>
    /// 是否验证发行者
    /// </summary>
    public bool ValidateIssuer { get; set; } = true;
    
    /// <summary>
    /// 是否验证受众
    /// </summary>
    public bool ValidateAudience { get; set; } = true;
    
    /// <summary>
    /// 是否验证生命周期
    /// </summary>
    public bool ValidateLifetime { get; set; } = true;
    
    /// <summary>
    /// 是否验证签名密钥
    /// </summary>
    public bool ValidateIssuerSigningKey { get; set; } = true;
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
