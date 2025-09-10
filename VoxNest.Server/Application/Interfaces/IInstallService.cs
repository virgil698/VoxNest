using VoxNest.Server.Application.DTOs.Install;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 安装服务接口
/// </summary>
public interface IInstallService
{
    /// <summary>
    /// 获取安装状态
    /// </summary>
    /// <returns>安装状态</returns>
    Task<InstallStatusDto> GetInstallStatusAsync();

    /// <summary>
    /// 测试数据库连接
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>测试结果</returns>
    Task<Result> TestDatabaseConnectionAsync(DatabaseConfigDto config);

    /// <summary>
    /// 保存数据库配置
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>保存结果</returns>
    Task<Result> SaveDatabaseConfigAsync(DatabaseConfigDto config);

    /// <summary>
    /// 初始化数据库
    /// </summary>
    /// <returns>初始化结果</returns>
    Task<Result> InitializeDatabaseAsync();

    /// <summary>
    /// 直接初始化数据库（不依赖热重载）
    /// </summary>
    /// <param name="forceReinitialize">是否强制重新初始化，忽略已存在的标记文件</param>
    /// <returns>初始化结果</returns>
    Task<Result> InitializeDatabaseDirectAsync(bool forceReinitialize = false);

    /// <summary>
    /// 创建管理员账户
    /// </summary>
    /// <param name="adminInfo">管理员信息</param>
    /// <returns>创建结果</returns>
    Task<Result> CreateAdminUserAsync(CreateAdminDto adminInfo);

    /// <summary>
    /// 完成安装
    /// </summary>
    /// <param name="siteConfig">站点配置</param>
    /// <returns>完成结果</returns>
    Task<Result> CompleteInstallationAsync(SiteConfigDto siteConfig);

    /// <summary>
    /// 检查是否已安装
    /// </summary>
    /// <returns>是否已安装</returns>
    bool IsInstalled();

    /// <summary>
    /// 重置安装状态（仅限开发环境）
    /// </summary>
    /// <returns>重置结果</returns>
    Task<Result> ResetInstallationAsync();

    /// <summary>
    /// 诊断数据库状态
    /// </summary>
    /// <returns>诊断结果</returns>
    Task<object> DiagnoseDatabaseAsync();

    /// <summary>
    /// 修复数据库结构
    /// </summary>
    /// <returns>修复结果</returns>
    Task<Result> RepairDatabaseAsync();
}
