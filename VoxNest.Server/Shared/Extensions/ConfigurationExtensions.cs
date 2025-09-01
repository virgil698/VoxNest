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
    /// 从YAML文件加载服务器配置
    /// </summary>
    /// <param name="yamlFilePath"></param>
    /// <returns></returns>
    public static ServerConfiguration LoadServerConfigurationFromYaml(string yamlFilePath)
    {
        if (!File.Exists(yamlFilePath))
        {
            throw new FileNotFoundException($"YAML配置文件未找到: {yamlFilePath}");
        }

        var yamlContent = File.ReadAllText(yamlFilePath);
        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();

        var config = deserializer.Deserialize<ServerConfiguration>(yamlContent);
        return config ?? new ServerConfiguration();
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
        var supportedProviders = new[] { "MySQL", "PostgreSQL", "SQLite" };
        if (!supportedProviders.Contains(configuration.Database.Provider))
            errors.Add($"不支持的数据库提供商: {configuration.Database.Provider}");

        return (errors.Count == 0, errors);
    }
}
