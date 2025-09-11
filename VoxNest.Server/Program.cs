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
if (!File.Exists("server-config.yml"))
{
    Console.WriteLine("🔧 未找到服务器配置文件，正在生成默认配置...");
    var defaultConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.CreateDefaultConfiguration();
    VoxNest.Server.Shared.Extensions.ConfigurationExtensions.SaveConfigurationToYaml(defaultConfig, "server-config.yml");
    Console.WriteLine("✅ 默认配置文件已生成: server-config.yml");
}

// 确保安全配置存在
builder.Services.EnsureSecureConfiguration(builder.Configuration, builder.Environment);

// 读取服务器配置并设置监听端口
if (File.Exists("server-config.yml"))
{
    try
    {
        var serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml("server-config.yml");
        var httpUrl = $"http://localhost:{serverConfig.Server.Port}";
        
        builder.WebHost.UseUrls(httpUrl);
        Console.WriteLine($"✅ 服务器监听HTTP端口: {serverConfig.Server.Port}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"读取服务器配置失败，使用默认端口: {ex.Message}");
    }
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

// 初始化数据库（仅在已安装且配置存在时）
if (File.Exists("install.lock") && File.Exists("server-config.yml"))
{
    try
    {
        await app.EnsureDatabaseMigratedAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "数据库迁移失败");
    }
}

// 配置路由
app.ConfigureRouting();

// 添加健康检查端点
app.MapHealthChecks("/health");

app.Run();
