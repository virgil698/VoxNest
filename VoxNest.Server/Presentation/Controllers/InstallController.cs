using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Application.DTOs.Install;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 安装控制器
/// </summary>
[Route("api/[controller]")]
public class InstallController : BaseApiController
{
    private readonly IInstallService _installService;

    public InstallController(IInstallService installService, ILogger<InstallController> logger) 
        : base(logger)
    {
        _installService = installService;
    }

    /// <summary>
    /// 获取安装状态
    /// </summary>
    /// <returns>安装状态</returns>
    [HttpGet("status")]
    public async Task<IActionResult> GetInstallStatus()
    {
        LogApiCall("获取安装状态");
        return await ExecuteDataAsync(
            () => _installService.GetInstallStatusAsync(),
            "获取安装状态"
        );
    }

    /// <summary>
    /// 测试数据库连接
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>测试结果</returns>
    [HttpPost("test-database")]
    public async Task<IActionResult> TestDatabaseConnection([FromBody] DatabaseConfigDto config)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        LogApiCall("测试数据库连接", new { provider = config.Provider, server = config.Server, database = config.Database });
        return await ExecuteAsync(
            () => _installService.TestDatabaseConnectionAsync(config),
            "测试数据库连接"
        );
    }

    /// <summary>
    /// 保存数据库配置
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>配置结果</returns>
    [HttpPost("save-database-config")]
    public async Task<IActionResult> SaveDatabaseConfig([FromBody] DatabaseConfigDto config)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        LogApiCall("保存数据库配置", new { provider = config.Provider, server = config.Server, database = config.Database });
        return await ExecuteAsync(
            () => _installService.SaveDatabaseConfigAsync(config),
            "保存数据库配置"
        );
    }

    /// <summary>
    /// 初始化数据库
    /// </summary>
    /// <returns>初始化结果</returns>
    [HttpPost("initialize-database")]
    public async Task<IActionResult> InitializeDatabase()
    {
        LogApiCall("初始化数据库");
        return await ExecuteAsync(
            () => _installService.InitializeDatabaseAsync(),
            "初始化数据库"
        );
    }

    /// <summary>
    /// 创建管理员账户
    /// </summary>
    /// <param name="adminInfo">管理员信息</param>
    /// <returns>创建结果</returns>
    [HttpPost("create-admin")]
    public async Task<IActionResult> CreateAdminUser([FromBody] CreateAdminDto adminInfo)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        LogApiCall("创建管理员用户", new { username = adminInfo.Username, email = adminInfo.Email });
        return await ExecuteAsync(
            () => _installService.CreateAdminUserAsync(adminInfo),
            "创建管理员用户"
        );
    }

    /// <summary>
    /// 完成安装
    /// </summary>
    /// <param name="siteConfig">站点配置</param>
    /// <returns>完成结果</returns>
    [HttpPost("complete")]
    public async Task<IActionResult> CompleteInstallation([FromBody] SiteConfigDto siteConfig)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        LogApiCall("完成安装", new { siteName = siteConfig.SiteName, adminEmail = siteConfig.AdminEmail });
        return await ExecuteAsync(
            () => _installService.CompleteInstallationAsync(siteConfig),
            "完成安装"
        );
    }

    /// <summary>
    /// 直接初始化数据库（不依赖热重载）
    /// </summary>
    /// <param name="request">初始化请求参数</param>
    /// <returns>初始化结果</returns>
    [HttpPost("initialize-database-direct")]
    public async Task<IActionResult> InitializeDatabaseDirect([FromBody] InitializeDatabaseRequest? request = null)
    {
        var forceReinitialize = request?.ForceReinitialize ?? false;
        LogApiCall("直接初始化数据库", new { forceReinitialize });
        
        return await ExecuteAsync(
            () => _installService.InitializeDatabaseDirectAsync(forceReinitialize),
            "直接初始化数据库"
        );
    }

    /// <summary>
    /// 诊断数据库状态
    /// </summary>
    /// <returns>数据库诊断结果</returns>
    [HttpGet("diagnose-database")]
    public async Task<IActionResult> DiagnoseDatabase()
    {
        LogApiCall("诊断数据库状态");
        return await ExecuteDataAsync(
            () => _installService.DiagnoseDatabaseAsync(),
            "诊断数据库状态"
        );
    }

    /// <summary>
    /// 修复数据库结构
    /// </summary>
    /// <returns>修复结果</returns>
    [HttpPost("repair-database")]
    public async Task<IActionResult> RepairDatabase()
    {
        LogApiCall("修复数据库结构");
        return await ExecuteAsync(
            () => _installService.RepairDatabaseAsync(),
            "修复数据库结构"
        );
    }

    /// <summary>
    /// 数据库初始化请求参数
    /// </summary>
    public class InitializeDatabaseRequest
    {
        /// <summary>
        /// 是否强制重新初始化
        /// </summary>
        public bool ForceReinitialize { get; set; } = false;
    }

    /// <summary>
    /// 重置安装状态（仅限开发环境）
    /// </summary>
    /// <returns>重置结果</returns>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetInstallation()
    {
        LogApiCall("重置安装状态");
        return await ExecuteAsync(
            () => _installService.ResetInstallationAsync(),
            "重置安装状态"
        );
    }
}
