using VoxNest.Server.Tools;

namespace VoxNest.Server.Infrastructure.Extensions;

/// <summary>
/// 安全配置相关扩展方法
/// </summary>
public static class SecureConfigurationExtensions
{
    /// <summary>
    /// 确保安全配置存在，如果不存在则自动生成
    /// </summary>
    /// <param name="services">服务集合</param>
    /// <param name="configuration">配置对象</param>
    /// <param name="environment">当前环境</param>
    /// <returns>服务集合</returns>
    public static IServiceCollection EnsureSecureConfiguration(
        this IServiceCollection services, 
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var logger = CreateLogger<ConfigurationGenerator>();
        
        try
        {
            // 检查配置安全性
            var configGenerator = new ConfigurationGenerator(logger);
            var issues = configGenerator.ValidateConfiguration(configuration);
            
            if (issues.Any())
            {
                logger.LogWarning("检测到配置安全问题:");
                foreach (var issue in issues)
                {
                    logger.LogWarning("  - {Issue}", issue);
                }
                
                // 在开发环境中自动生成配置
                if (environment.IsDevelopment())
                {
                    logger.LogInformation("开发环境中尝试自动生成安全配置...");
                    
                    // 异步生成配置（不阻塞启动）
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var generated = await configGenerator.EnsureConfigurationExistsAsync(environment.EnvironmentName);
                            if (generated)
                            {
                                logger.LogInformation("已生成新的安全配置文件，请重启应用程序以使配置生效");
                                logger.LogWarning("重要提醒：请检查生成的配置文件并根据需要调整数据库连接等设置");
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "自动生成配置失败");
                        }
                    });
                }
                else
                {
                    logger.LogError("生产环境中检测到不安全的配置，请手动修复配置问题");
                    logger.LogInformation("你可以使用以下命令生成安全配置：");
                    logger.LogInformation("  dotnet run --generate-config");
                }
            }
            else
            {
                logger.LogInformation("配置安全性验证通过");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "配置安全性检查失败");
        }
        
        return services;
    }

    /// <summary>
    /// 从环境变量加载配置
    /// </summary>
    /// <param name="builder">配置构建器</param>
    /// <returns>配置构建器</returns>
    public static IConfigurationBuilder AddEnvironmentConfiguration(this IConfigurationBuilder builder)
    {
        // 添加.env文件支持
        var envFile = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (File.Exists(envFile))
        {
            // 手动解析.env文件
            var envVars = ParseEnvFile(envFile);
            builder.AddInMemoryCollection(envVars.Select(kv => new KeyValuePair<string, string?>(kv.Key, kv.Value)));
        }
        
        // 添加环境变量
        builder.AddEnvironmentVariables();
        
        return builder;
    }

    /// <summary>
    /// 生成配置命令行工具
    /// </summary>
    /// <param name="args">命令行参数</param>
    /// <param name="environment">环境名称</param>
    /// <returns>是否处理了配置生成命令</returns>
    public static async Task<bool> HandleConfigurationCommandsAsync(string[] args, string environment = "Development")
    {
        if (args.Contains("--generate-config") || args.Contains("-gc"))
        {
            var logger = CreateLogger<ConfigurationGenerator>();
            var generator = new ConfigurationGenerator(logger);
            
            Console.WriteLine("正在生成安全配置...");
            
            var envGenerated = await generator.GenerateEnvironmentFileAsync(environment, overwrite: true);
            var appSettingsGenerated = await generator.GenerateLocalAppSettingsAsync(environment, overwrite: true);
            
            if (envGenerated || appSettingsGenerated)
            {
                Console.WriteLine("✅ 配置生成完成！");
                Console.WriteLine("📁 生成的文件：");
                if (envGenerated) Console.WriteLine("  - .env");
                if (appSettingsGenerated) Console.WriteLine("  - Configuration/appsettings.Local.json");
                Console.WriteLine();
                Console.WriteLine("⚠️  重要提醒：");
                Console.WriteLine("  1. 请检查生成的配置文件");
                Console.WriteLine("  2. 根据需要调整数据库连接字符串");
                Console.WriteLine("  3. 妥善保管JWT密钥");
                Console.WriteLine("  4. 不要将包含敏感信息的配置文件提交到版本控制");
            }
            else
            {
                Console.WriteLine("❌ 配置生成失败，请检查日志");
            }
            
            return true;
        }
        
        if (args.Contains("--validate-config") || args.Contains("-vc"))
        {
            var logger = CreateLogger<ConfigurationGenerator>();
            var generator = new ConfigurationGenerator(logger);
            
            // 构建临时配置来验证
            var tempConfig = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("Configuration/appsettings.json", optional: false)
                .AddJsonFile($"Configuration/appsettings.{environment}.json", optional: true)
                .AddJsonFile("Configuration/appsettings.Local.json", optional: true)
                .AddEnvironmentConfiguration()
                .Build();
            
            var issues = generator.ValidateConfiguration(tempConfig);
            
            Console.WriteLine("配置验证结果：");
            if (issues.Any())
            {
                Console.WriteLine("❌ 发现以下问题：");
                foreach (var issue in issues)
                {
                    Console.WriteLine($"  - {issue}");
                }
            }
            else
            {
                Console.WriteLine("✅ 配置验证通过");
            }
            
            return true;
        }
        
        return false;
    }

    private static Dictionary<string, string> ParseEnvFile(string filePath)
    {
        var result = new Dictionary<string, string>();
        
        try
        {
            var lines = File.ReadAllLines(filePath);
            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                if (string.IsNullOrEmpty(trimmedLine) || trimmedLine.StartsWith('#'))
                    continue;
                
                var equalIndex = trimmedLine.IndexOf('=');
                if (equalIndex > 0)
                {
                    var key = trimmedLine.Substring(0, equalIndex).Trim();
                    var value = trimmedLine.Substring(equalIndex + 1).Trim();
                    
                    // 移除引号
                    if ((value.StartsWith('"') && value.EndsWith('"')) ||
                        (value.StartsWith('\'') && value.EndsWith('\'')))
                    {
                        value = value.Substring(1, value.Length - 2);
                    }
                    
                    result[key] = value;
                }
            }
        }
        catch (Exception ex)
        {
            var logger = CreateLogger<ConfigurationGenerator>();
            logger.LogError(ex, "解析.env文件失败: {FilePath}", filePath);
        }
        
        return result;
    }

    private static ILogger<T> CreateLogger<T>()
    {
        using var factory = LoggerFactory.Create(builder => builder.AddConsole());
        return factory.CreateLogger<T>();
    }
}
