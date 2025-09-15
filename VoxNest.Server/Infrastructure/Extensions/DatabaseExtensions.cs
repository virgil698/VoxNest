using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Extensions;

/// <summary>
/// 数据库扩展方法
/// </summary>
public static class DatabaseExtensions
{
    /// <summary>
    /// 植入种子数据
    /// </summary>
    /// <param name="app">应用程序构建器</param>
    /// <returns></returns>
    public static async Task<WebApplication> EnsureDatabaseSeededAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<WebApplication>>();
        var context = scope.ServiceProvider.GetRequiredService<VoxNestDbContext>();
        
        try
        {
            logger.LogInformation("开始植入种子数据...");
            await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);
            logger.LogInformation("种子数据植入完成");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "种子数据植入过程中发生错误");
            throw;
        }
        
        return app;
    }
}
