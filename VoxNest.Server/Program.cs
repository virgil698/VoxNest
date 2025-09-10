using VoxNest.Server.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 配置appsettings文件路径
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("Configuration/appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"Configuration/appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables()
    .AddCommandLine(args);

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
