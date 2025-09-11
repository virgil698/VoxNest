using System.Security.Cryptography;
using System.Text;

namespace VoxNest.Server.Tools;

/// <summary>
/// 安全密钥生成工具
/// </summary>
public static class SecurityKeyGenerator
{
    /// <summary>
    /// 生成JWT密钥（Base64编码）
    /// </summary>
    /// <param name="keySize">密钥大小（字节），默认64字节</param>
    /// <returns>Base64编码的密钥</returns>
    public static string GenerateJwtKey(int keySize = 64)
    {
        if (keySize < 32)
            throw new ArgumentException("JWT密钥长度至少需要32字节", nameof(keySize));

        using var rng = RandomNumberGenerator.Create();
        var keyBytes = new byte[keySize];
        rng.GetBytes(keyBytes);
        return Convert.ToBase64String(keyBytes);
    }

    /// <summary>
    /// 生成安全的随机字符串
    /// </summary>
    /// <param name="length">字符串长度</param>
    /// <param name="includeSpecialChars">是否包含特殊字符</param>
    /// <returns>随机字符串</returns>
    public static string GenerateSecureString(int length = 32, bool includeSpecialChars = false)
    {
        const string lowercase = "abcdefghijklmnopqrstuvwxyz";
        const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string numbers = "0123456789";
        const string specials = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        var chars = lowercase + uppercase + numbers;
        if (includeSpecialChars)
            chars += specials;

        using var rng = RandomNumberGenerator.Create();
        var result = new StringBuilder(length);
        
        for (int i = 0; i < length; i++)
        {
            var randomIndex = GetSecureRandomInt(rng, chars.Length);
            result.Append(chars[randomIndex]);
        }

        return result.ToString();
    }

    /// <summary>
    /// 生成数据库密码
    /// </summary>
    /// <param name="length">密码长度，默认16</param>
    /// <returns>安全的数据库密码</returns>
    public static string GenerateDatabasePassword(int length = 16)
    {
        return GenerateSecureString(length, includeSpecialChars: false); // 避免数据库连接字符串中的特殊字符问题
    }

    /// <summary>
    /// 验证JWT密钥强度
    /// </summary>
    /// <param name="key">要验证的密钥</param>
    /// <returns>验证结果</returns>
    public static (bool IsValid, string Message) ValidateJwtKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return (false, "JWT密钥不能为空");

        if (key.Length < 32)
            return (false, "JWT密钥长度至少需要32个字符");

        // 检查是否是默认的不安全密钥
        var insecurePatterns = new[]
        {
            "CHANGE_THIS",
            "your_secret_key",
            "secret",
            "password",
            "123456"
        };

        if (insecurePatterns.Any(pattern => key.Contains(pattern, StringComparison.OrdinalIgnoreCase)))
            return (false, "检测到不安全的默认密钥模式");

        try
        {
            // 尝试解码Base64（如果是Base64格式）
            if (IsBase64String(key))
            {
                var bytes = Convert.FromBase64String(key);
                if (bytes.Length < 32)
                    return (false, "JWT密钥解码后长度不足32字节");
            }
        }
        catch
        {
            // 如果不是有效的Base64，继续其他验证
        }

        return (true, "JWT密钥验证通过");
    }

    /// <summary>
    /// 生成完整的环境配置
    /// </summary>
    /// <param name="environment">环境名称</param>
    /// <param name="databaseName">数据库名称</param>
    /// <returns>环境配置字典</returns>
    public static Dictionary<string, string> GenerateEnvironmentConfig(
        string environment = "Development", 
        string databaseName = "VoxNest")
    {
        return new Dictionary<string, string>
        {
            ["ASPNETCORE_ENVIRONMENT"] = environment,
            ["JWT_SECRET_KEY"] = GenerateJwtKey(),
            ["JWT_ISSUER"] = "VoxNest.Server",
            ["JWT_AUDIENCE"] = "VoxNest.Client",
            ["DATABASE_CONNECTION_STRING"] = $"Server=localhost;Database={databaseName};User=root;Password=;Port=3306;CharSet=utf8mb4;",
            ["MIGRATION_CONNECTION_STRING"] = $"Server=localhost;Database={databaseName}_Migration;User=root;Password=;Port=3306;CharSet=utf8mb4;",
            ["SECURITY_REQUIRE_HTTPS_METADATA"] = environment == "Production" ? "true" : "false",
            ["LOG_LEVEL"] = environment == "Production" ? "Warning" : "Information"
        };
    }

    private static int GetSecureRandomInt(RandomNumberGenerator rng, int maxValue)
    {
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var value = BitConverter.ToUInt32(bytes, 0);
        return (int)(value % (uint)maxValue);
    }

    private static bool IsBase64String(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        try
        {
            Convert.FromBase64String(value);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
