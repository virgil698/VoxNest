using VoxNest.Server.Infrastructure.Extensions;
using VoxNest.Server.Shared.Extensions;

// 检查是否为配置生成命令
if (await SecureConfigurationExtensions.HandleConfigurationCommandsAsync(args, 
    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"))
{
    return; // 处理了配置命令，退出程序
}

var builder = WebApplication.CreateBuilder(args);

// 配置appsettings文件路径
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("Configuration/appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"Configuration/appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddJsonFile("Configuration/appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentConfiguration() // 支持.env文件和环境变量
    .AddCommandLine(args);

// 确保服务器配置文件存在，如果不存在则生成默认配置
const string configFile = "server-config.yml";
if (!File.Exists(configFile))
{
    try
    {
        Console.WriteLine("🔧 未找到服务器配置文件，正在生成默认配置...");
        var defaultConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.CreateDefaultConfiguration();
        VoxNest.Server.Shared.Extensions.ConfigurationExtensions.SaveConfigurationToYaml(defaultConfig, configFile);
        
        // 验证文件是否成功生成
        if (File.Exists(configFile))
        {
            Console.WriteLine($"✅ 默认配置文件已生成: {configFile}");
        }
        else
        {
            Console.WriteLine($"❌ 警告：配置文件生成失败: {configFile}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ 生成配置文件时发生错误: {ex.Message}");
        Console.WriteLine("系统将在安装模式下运行...");
    }
}

// 确保安全配置存在
builder.Services.EnsureSecureConfiguration(builder.Configuration, builder.Environment);

// 读取服务器配置并设置监听端口
if (File.Exists(configFile))
{
    try
    {
        var serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(configFile);
        var httpUrl = $"http://localhost:{serverConfig.Server.Port}";
        
        builder.WebHost.UseUrls(httpUrl);
        Console.WriteLine($"✅ 服务器监听HTTP端口: {serverConfig.Server.Port}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ 读取服务器配置失败，使用默认端口: {ex.Message}");
    }
}
else
{
    Console.WriteLine("⚠️ 配置文件不存在，使用默认端口配置");
}

// 配置服务
builder.Services.AddVoxNestServices(builder.Configuration);
builder.Services.AddVoxNestApiDocumentation(builder.Environment);
builder.Services.AddVoxNestHealthChecks();
builder.Services.AddVoxNestCaching(builder.Configuration);
builder.Services.AddVoxNestLogging(builder.Configuration);
builder.Services.AddVoxNestBackgroundServices();

var app = builder.Build();

// 配置中间件管道
app.ConfigureVoxNestPipeline();
app.ConfigureDevelopmentEnvironment();

// 初始化种子数据
const string installLockFile = "install.lock";
try
{
    // 如果系统已完全安装，植入种子数据
    if (File.Exists(installLockFile) && File.Exists(configFile))
    {
        Console.WriteLine("✅ 系统已安装，植入种子数据...");
        await app.EnsureDatabaseSeededAsync();
    }
    else
    {
        // 系统未完全安装，记录状态但不阻止启动
        var missingFiles = new List<string>();
        if (!File.Exists(installLockFile)) missingFiles.Add("install.lock");
        if (!File.Exists(configFile)) missingFiles.Add(configFile);
        
        Console.WriteLine($"⚠️ 系统未完全安装，缺少文件: {string.Join(", ", missingFiles)}");
        Console.WriteLine("💡 请通过 /install 页面完成系统安装");
    }
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "种子数据初始化失败");
    Console.WriteLine($"❌ 种子数据初始化失败: {ex.Message}");
}

// 配置路由
app.ConfigureRouting();

// 添加健康检查端点
app.MapHealthChecks("/health");

app.Run();
