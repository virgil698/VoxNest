using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Application.DTOs.Install;
using VoxNest.Server.Application.Interfaces;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 安装控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class InstallController : ControllerBase
{
    private readonly IInstallService _installService;
    private readonly ILogger<InstallController> _logger;

    public InstallController(IInstallService installService, ILogger<InstallController> logger)
    {
        _installService = installService;
        _logger = logger;
    }

    /// <summary>
    /// 获取安装状态
    /// </summary>
    /// <returns>安装状态</returns>
    [HttpGet("status")]
    public async Task<ActionResult<InstallStatusDto>> GetInstallStatus()
    {
        try
        {
            var status = await _installService.GetInstallStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取安装状态失败");
            return StatusCode(500, "获取安装状态失败");
        }
    }

    /// <summary>
    /// 测试数据库连接
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>测试结果</returns>
    [HttpPost("test-database")]
    public async Task<IActionResult> TestDatabaseConnection([FromBody] DatabaseConfigDto config)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _installService.TestDatabaseConnectionAsync(config);
            
            if (result.IsSuccess)
            {
                return Ok(new { success = true, message = result.Message });
            }
            
            return BadRequest(new { success = false, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "测试数据库连接失败");
            return StatusCode(500, new { success = false, message = "测试数据库连接失败" });
        }
    }

    /// <summary>
    /// 保存数据库配置
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>保存结果</returns>
    [HttpPost("save-database-config")]
    public async Task<IActionResult> SaveDatabaseConfig([FromBody] DatabaseConfigDto config)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _installService.SaveDatabaseConfigAsync(config);
            
            if (result.IsSuccess)
            {
                return Ok(new { success = true, message = result.Message });
            }
            
            return BadRequest(new { success = false, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "保存数据库配置失败");
            return StatusCode(500, new { success = false, message = "保存数据库配置失败" });
        }
    }

    /// <summary>
    /// 初始化数据库
    /// </summary>
    /// <returns>初始化结果</returns>
    [HttpPost("initialize-database")]
    public async Task<IActionResult> InitializeDatabase()
    {
        try
        {
            var result = await _installService.InitializeDatabaseAsync();
            
            if (result.IsSuccess)
            {
                return Ok(new { success = true, message = result.Message });
            }
            
            return BadRequest(new { success = false, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "初始化数据库失败");
            return StatusCode(500, new { success = false, message = "初始化数据库失败" });
        }
    }

    /// <summary>
    /// 创建管理员账户
    /// </summary>
    /// <param name="adminInfo">管理员信息</param>
    /// <returns>创建结果</returns>
    [HttpPost("create-admin")]
    public async Task<IActionResult> CreateAdminUser([FromBody] CreateAdminDto adminInfo)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _installService.CreateAdminUserAsync(adminInfo);
            
            if (result.IsSuccess)
            {
                return Ok(new { success = true, message = result.Message });
            }
            
            return BadRequest(new { success = false, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建管理员账户失败");
            return StatusCode(500, new { success = false, message = "创建管理员账户失败" });
        }
    }

    /// <summary>
    /// 完成安装
    /// </summary>
    /// <param name="siteConfig">站点配置</param>
    /// <returns>完成结果</returns>
    [HttpPost("complete")]
    public async Task<IActionResult> CompleteInstallation([FromBody] SiteConfigDto siteConfig)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _installService.CompleteInstallationAsync(siteConfig);
            
            if (result.IsSuccess)
            {
                return Ok(new { success = true, message = result.Message });
            }
            
            return BadRequest(new { success = false, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "完成安装失败");
            return StatusCode(500, new { success = false, message = "完成安装失败" });
        }
    }

    /// <summary>
    /// 重置安装状态（仅限开发环境）
    /// </summary>
    /// <returns>重置结果</returns>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetInstallation()
    {
        try
        {
            var result = await _installService.ResetInstallationAsync();
            
            if (result.IsSuccess)
            {
                return Ok(new { success = true, message = result.Message });
            }
            
            return BadRequest(new { success = false, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "重置安装状态失败");
            return StatusCode(500, new { success = false, message = "重置安装状态失败" });
        }
    }
}
