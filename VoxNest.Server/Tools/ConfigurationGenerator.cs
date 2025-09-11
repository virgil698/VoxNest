using System.Text;
using System.Text.Json;
using VoxNest.Server.Shared.Configuration;

namespace VoxNest.Server.Tools;

/// <summary>
/// 配置文件生成工具
/// </summary>
public class ConfigurationGenerator
{
    private readonly ILogger<ConfigurationGenerator> _logger;

    public ConfigurationGenerator(ILogger<ConfigurationGenerator> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 生成环境配置文件
    /// </summary>
    /// <param name="environment">环境名称</param>
    /// <param name="outputPath">输出路径</param>
    /// <param name="overwrite">是否覆盖现有文件</param>
    /// <returns>是否成功生成</returns>
    public async Task<bool> GenerateEnvironmentFileAsync(
        string environment = "Development", 
        string? outputPath = null, 
        bool overwrite = false)
    {
        try
        {
            outputPath ??= Path.Combine(Directory.GetCurrentDirectory(), ".env");

            if (File.Exists(outputPath) && !overwrite)
            {
                _logger.LogWarning("配置文件已存在: {Path}，使用 overwrite=true 来覆盖", outputPath);
                return false;
            }

            var config = SecurityKeyGenerator.GenerateEnvironmentConfig(environment);
            var content = GenerateEnvFileContent(config);

            await File.WriteAllTextAsync(outputPath, content, Encoding.UTF8);
            
            _logger.LogInformation("成功生成环境配置文件: {Path}", outputPath);
            _logger.LogInformation("已生成新的JWT密钥，请妥善保管");
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "生成环境配置文件失败");
            return false;
        }
    }

    /// <summary>
    /// 生成appsettings.Local.json文件
    /// </summary>
    /// <param name="environment">环境名称</param>
    /// <param name="outputPath">输出路径</param>
    /// <param name="overwrite">是否覆盖现有文件</param>
    /// <returns>是否成功生成</returns>
    public async Task<bool> GenerateLocalAppSettingsAsync(
        string environment = "Development",
        string? outputPath = null,
        bool overwrite = false)
    {
        try
        {
            outputPath ??= Path.Combine(Directory.GetCurrentDirectory(), "Configuration", "appsettings.Local.json");

            if (File.Exists(outputPath) && !overwrite)
            {
                _logger.LogWarning("配置文件已存在: {Path}，使用 overwrite=true 来覆盖", outputPath);
                return false;
            }

            var config = CreateLocalAppSettings(environment);
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions 
            { 
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            // 确保目录存在
            var directory = Path.GetDirectoryName(outputPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await File.WriteAllTextAsync(outputPath, json, Encoding.UTF8);
            
            _logger.LogInformation("成功生成本地配置文件: {Path}", outputPath);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "生成本地配置文件失败");
            return false;
        }
    }

    /// <summary>
    /// 检查并自动生成缺失的配置
    /// </summary>
    /// <param name="environment">环境名称</param>
    /// <returns>是否有配置被生成</returns>
    public async Task<bool> EnsureConfigurationExistsAsync(string environment = "Development")
    {
        var generated = false;

        // 检查.env文件
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (!File.Exists(envPath))
        {
            _logger.LogInformation("未找到.env文件，正在生成...");
            if (await GenerateEnvironmentFileAsync(environment, envPath))
            {
                generated = true;
            }
        }

        // 检查本地配置文件
        var localConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Configuration", "appsettings.Local.json");
        if (!File.Exists(localConfigPath))
        {
            _logger.LogInformation("未找到本地配置文件，正在生成...");
            if (await GenerateLocalAppSettingsAsync(environment, localConfigPath))
            {
                generated = true;
            }
        }

        return generated;
    }

    /// <summary>
    /// 验证现有配置的安全性
    /// </summary>
    /// <param name="configuration">配置对象</param>
    /// <returns>验证结果</returns>
    public List<string> ValidateConfiguration(IConfiguration configuration)
    {
        var issues = new List<string>();

        // 验证JWT密钥
        var jwtKey = configuration["Jwt:SecretKey"];
        if (!string.IsNullOrEmpty(jwtKey))
        {
            var (isValid, message) = SecurityKeyGenerator.ValidateJwtKey(jwtKey);
            if (!isValid)
            {
                issues.Add($"JWT密钥问题: {message}");
            }
        }
        else
        {
            issues.Add("JWT密钥未配置");
        }

        // 验证数据库连接字符串
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            issues.Add("数据库连接字符串未配置");
        }
        else if (connectionString.Contains("Password=;") || connectionString.Contains("Password=dummy"))
        {
            issues.Add("数据库连接字符串使用了空密码或默认密码");
        }

        return issues;
    }

    private static string GenerateEnvFileContent(Dictionary<string, string> config)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# VoxNest 自动生成的环境配置");
        sb.AppendLine($"# 生成时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine("# 请妥善保管此文件，不要提交到版本控制系统");
        sb.AppendLine();
        
        sb.AppendLine("# ====================");
        sb.AppendLine("# 应用程序配置");
        sb.AppendLine("# ====================");
        sb.AppendLine($"ASPNETCORE_ENVIRONMENT={config["ASPNETCORE_ENVIRONMENT"]}");
        sb.AppendLine();

        sb.AppendLine("# ====================");
        sb.AppendLine("# JWT 配置");
        sb.AppendLine("# ====================");
        sb.AppendLine($"JWT_SECRET_KEY={config["JWT_SECRET_KEY"]}");
        sb.AppendLine($"JWT_ISSUER={config["JWT_ISSUER"]}");
        sb.AppendLine($"JWT_AUDIENCE={config["JWT_AUDIENCE"]}");
        sb.AppendLine();

        sb.AppendLine("# ====================");
        sb.AppendLine("# 数据库配置");
        sb.AppendLine("# ====================");
        sb.AppendLine($"DATABASE_CONNECTION_STRING={config["DATABASE_CONNECTION_STRING"]}");
        sb.AppendLine($"MIGRATION_CONNECTION_STRING={config["MIGRATION_CONNECTION_STRING"]}");
        sb.AppendLine();

        sb.AppendLine("# ====================");
        sb.AppendLine("# 安全配置");
        sb.AppendLine("# ====================");
        sb.AppendLine($"SECURITY_REQUIRE_HTTPS_METADATA={config["SECURITY_REQUIRE_HTTPS_METADATA"]}");
        sb.AppendLine($"LOG_LEVEL={config["LOG_LEVEL"]}");

        return sb.ToString();
    }

    private static object CreateLocalAppSettings(string environment)
    {
        var jwtKey = SecurityKeyGenerator.GenerateJwtKey();
        
        return new
        {
            Logging = new
            {
                LogLevel = new
                {
                    Default = environment == "Production" ? "Warning" : "Information",
                    Microsoft = "Warning",
                    System = "Warning"
                }
            },
            ConnectionStrings = new
            {
                DefaultConnection = "Server=localhost;Database=VoxNest;User=root;Password=;Port=3306;CharSet=utf8mb4;"
            },
            Jwt = new
            {
                SecretKey = jwtKey,
                Issuer = "VoxNest.Server",
                Audience = "VoxNest.Client",
                ExpireMinutes = environment == "Production" ? 30 : 1440
            },
            Security = new
            {
                RequireHttpsMetadata = environment == "Production",
                RequireSignedTokens = true,
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true
            },
            GeneratedAt = DateTime.UtcNow,
            Environment = environment,
            Note = "此文件由系统自动生成，包含敏感信息，请勿提交到版本控制"
        };
    }
}
