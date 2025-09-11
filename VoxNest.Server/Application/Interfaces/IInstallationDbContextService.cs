using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 安装模式数据库上下文服务接口
/// </summary>
public interface IInstallationDbContextService
{
    /// <summary>
    /// 根据配置创建数据库上下文
    /// </summary>
    /// <param name="config">服务器配置</param>
    /// <returns>数据库上下文实例</returns>
    VoxNestDbContext CreateDbContext(ServerConfiguration config);

    /// <summary>
    /// 异步根据配置创建数据库上下文
    /// </summary>
    /// <param name="config">服务器配置</param>
    /// <returns>数据库上下文实例</returns>
    Task<VoxNestDbContext> CreateDbContextAsync(ServerConfiguration config);

    /// <summary>
    /// 从配置文件创建数据库上下文
    /// </summary>
    /// <param name="configFilePath">配置文件路径</param>
    /// <returns>数据库上下文实例</returns>
    VoxNestDbContext CreateDbContextFromFile(string configFilePath);

    /// <summary>
    /// 异步从配置文件创建数据库上下文
    /// </summary>
    /// <param name="configFilePath">配置文件路径</param>
    /// <returns>数据库上下文实例</returns>
    Task<VoxNestDbContext> CreateDbContextFromFileAsync(string configFilePath);
}
