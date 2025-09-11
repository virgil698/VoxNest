using VoxNest.Server.Shared.Configuration;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace VoxNest.Server.Shared.Extensions;

/// <summary>
/// 配置扩展方法
/// </summary>
public static class ConfigurationExtensions
{

    /// <summary>
    /// 从YAML文件加载服务器配置，如果文件不存在则自动生成默认配置文件
    /// </summary>
    /// <param name="yamlFilePath"></param>
    /// <returns></returns>
    public static ServerConfiguration LoadServerConfigurationFromYaml(string yamlFilePath)
    {
        if (!File.Exists(yamlFilePath))
        {
            Console.WriteLine($"配置文件 {yamlFilePath} 不存在，正在生成默认配置文件...");
            var defaultConfig = CreateDefaultConfiguration();
            SaveConfigurationToYaml(defaultConfig, yamlFilePath);
            Console.WriteLine($"默认配置文件已生成：{yamlFilePath}");
            return defaultConfig;
        }

        var yamlContent = File.ReadAllText(yamlFilePath);
        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();

        var config = deserializer.Deserialize<ServerConfiguration>(yamlContent);
        return config ?? new ServerConfiguration();
    }

    /// <summary>
    /// 创建默认配置
    /// </summary>
    /// <returns></returns>
    public static ServerConfiguration CreateDefaultConfiguration()
    {
        return new ServerConfiguration
        {
            Server = new ServerSettings
            {
                Name = "VoxNest Server",
                Version = "1.0.0",
                Environment = "Development",
                Port = 5201,
                HttpsPort = 7042
            },
            Database = new DatabaseSettings
            {
                Provider = "MySQL",
                ConnectionString = "Server=localhost;Database=voxnest_dev;User=root;Password=;Port=3306;CharSet=utf8mb4;",
                EnableSensitiveDataLogging = true,
                EnableDetailedErrors = true
            },
            Jwt = new JwtSettings
            {
                SecretKey = GenerateSecretKey(),
                Issuer = "VoxNest",
                Audience = "VoxNest-Users",
                ExpireMinutes = 1440 // 24小时
            },
            Cors = new CorsSettings
            {
                AllowedOrigins = new List<string>
                {
                    "http://localhost:54976",
                    "http://localhost:54977", 
                    "http://localhost:3000",
                    "http://localhost:5201"
                },
                AllowedMethods = new List<string>
                {
                    "GET", "POST", "PUT", "DELETE", "OPTIONS"
                },
                AllowedHeaders = new List<string>
                {
                    "Content-Type", "Authorization", "X-Requested-With"
                }
            },
            Logging = new LoggingSettings
            {
                Level = "Information",
                EnableConsole = true,
                EnableFile = true,
                FilePath = "logs/voxnest.log"
            }
        };
    }

    /// <summary>
    /// 将配置保存为YAML文件
    /// </summary>
    /// <param name="configuration"></param>
    /// <param name="yamlFilePath"></param>
    public static void SaveConfigurationToYaml(ServerConfiguration configuration, string yamlFilePath)
    {
        // 确保目录存在
        var directory = Path.GetDirectoryName(yamlFilePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var serializer = new SerializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();

        var yamlContent = "# VoxNest 服务器配置文件\n" + serializer.Serialize(configuration);
        File.WriteAllText(yamlFilePath, yamlContent);
    }

    /// <summary>
    /// 生成安全的密钥（使用加密安全的随机数生成器）
    /// </summary>
    /// <returns></returns>
    private static string GenerateSecretKey()
    {
        // 使用加密安全的随机数生成器生成64字节的密钥，然后转换为Base64
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        var keyBytes = new byte[64];
        rng.GetBytes(keyBytes);
        return Convert.ToBase64String(keyBytes);
    }

    /// <summary>
    /// 验证配置对象
    /// </summary>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static (bool IsValid, List<string> Errors) ValidateConfiguration(this ServerConfiguration configuration)
    {
        var errors = new List<string>();

        // 验证必需字段
        if (string.IsNullOrWhiteSpace(configuration.Server.Name))
            errors.Add("服务器名称不能为空");

        if (string.IsNullOrWhiteSpace(configuration.Database.ConnectionString))
            errors.Add("数据库连接字符串不能为空");

        if (string.IsNullOrWhiteSpace(configuration.Jwt.SecretKey))
            errors.Add("JWT密钥不能为空");

        if (configuration.Jwt.SecretKey.Length < 32)
            errors.Add("JWT密钥长度至少需要32个字符");

        if (configuration.Jwt.ExpireMinutes <= 0)
            errors.Add("JWT过期时间必须大于0");

        // 验证数据库提供商
        var supportedProviders = new[] { "MySQL", "PostgreSQL", "MariaDB" };
        if (!supportedProviders.Contains(configuration.Database.Provider))
            errors.Add($"不支持的数据库提供商: {configuration.Database.Provider}。支持的数据库：MySQL、MariaDB、PostgreSQL");

        return (errors.Count == 0, errors);
    }
}
