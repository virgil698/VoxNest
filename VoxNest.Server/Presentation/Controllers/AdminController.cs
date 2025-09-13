using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// Admin管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // 需要认证
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    #region 站点概览

    /// <summary>
    /// 获取站点概览信息
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(ApiResponse<SiteOverviewDto>), 200)]
    public async Task<ActionResult<ApiResponse<SiteOverviewDto>>> GetSiteOverview(
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetSiteOverviewAsync(cancellationToken);
            return Ok(ApiResponse<SiteOverviewDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting site overview");
            return BadRequest(ApiResponse.CreateError("获取站点概览失败"));
        }
    }

    /// <summary>
    /// 获取站点基础统计信息 - 用于首页显示
    /// </summary>
    [HttpGet("stats")]
    [AllowAnonymous] // 允许匿名访问，供首页使用
    [ProducesResponseType(typeof(ApiResponse<SiteStatsDto>), 200)]
    public async Task<ActionResult<ApiResponse<SiteStatsDto>>> GetSiteStats(
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetSiteStatsAsync(cancellationToken);
            return Ok(ApiResponse<SiteStatsDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting site stats");
            return BadRequest(ApiResponse.CreateError("获取站点统计失败"));
        }
    }

    /// <summary>
    /// 获取系统信息
    /// </summary>
    [HttpGet("system-info")]
    [ProducesResponseType(typeof(ApiResponse<SystemInfoDto>), 200)]
    public async Task<ActionResult<ApiResponse<SystemInfoDto>>> GetSystemInfo(
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetSystemInfoAsync(cancellationToken);
            return Ok(ApiResponse<SystemInfoDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system info");
            return BadRequest(ApiResponse.CreateError("获取系统信息失败"));
        }
    }

    #endregion

    #region 站点设置

    /// <summary>
    /// 获取所有站点设置
    /// </summary>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(ApiResponse<List<SiteSettingDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<SiteSettingDto>>>> GetSiteSettings(
        [FromQuery] string? group,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetSiteSettingsAsync(group, cancellationToken);
            return Ok(ApiResponse<List<SiteSettingDto>>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting site settings");
            return BadRequest(ApiResponse.CreateError("获取站点设置失败"));
        }
    }

    /// <summary>
    /// 获取站点设置（按组）
    /// </summary>
    [HttpGet("settings/grouped")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<string, List<SiteSettingDto>>>), 200)]
    public async Task<ActionResult<ApiResponse<Dictionary<string, List<SiteSettingDto>>>>> GetSiteSettingsByGroup(
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetSiteSettingsByGroupAsync(cancellationToken);
            return Ok(ApiResponse<Dictionary<string, List<SiteSettingDto>>>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting grouped site settings");
            return BadRequest(ApiResponse.CreateError("获取分组站点设置失败"));
        }
    }

    /// <summary>
    /// 获取单个站点设置
    /// </summary>
    [HttpGet("settings/{key}")]
    [ProducesResponseType(typeof(ApiResponse<SiteSettingDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<SiteSettingDto>>> GetSiteSetting(
        string key,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetSiteSettingAsync(key, cancellationToken);
            
            if (result == null)
                return NotFound(ApiResponse.CreateError("设置不存在"));

            return Ok(ApiResponse<SiteSettingDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting site setting {Key}", key);
            return BadRequest(ApiResponse.CreateError("获取站点设置失败"));
        }
    }

    /// <summary>
    /// 更新站点设置
    /// </summary>
    [HttpPut("settings/{key}")]
    [ProducesResponseType(typeof(ApiResponse<SiteSettingDto>), 200)]
    public async Task<ActionResult<ApiResponse<SiteSettingDto>>> UpdateSiteSetting(
        string key,
        [FromBody] UpdateSiteSettingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _adminService.UpdateSiteSettingAsync(key, dto, userId, cancellationToken);
            return Ok(ApiResponse<SiteSettingDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating site setting {Key}", key);
            return BadRequest(ApiResponse.CreateError("更新站点设置失败"));
        }
    }

    /// <summary>
    /// 批量更新站点设置
    /// </summary>
    [HttpPut("settings")]
    [ProducesResponseType(typeof(ApiResponse<List<SiteSettingDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<SiteSettingDto>>>> BatchUpdateSiteSettings(
        [FromBody] Dictionary<string, string> settings,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _adminService.BatchUpdateSiteSettingsAsync(settings, userId, cancellationToken);
            return Ok(ApiResponse<List<SiteSettingDto>>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch updating site settings");
            return BadRequest(ApiResponse.CreateError("批量更新站点设置失败"));
        }
    }

    /// <summary>
    /// 创建站点设置
    /// </summary>
    [HttpPost("settings")]
    [ProducesResponseType(typeof(ApiResponse<SiteSettingDto>), 200)]
    public async Task<ActionResult<ApiResponse<SiteSettingDto>>> CreateSiteSetting(
        [FromBody] UpdateSiteSettingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _adminService.CreateSiteSettingAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<SiteSettingDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating site setting");
            return BadRequest(ApiResponse.CreateError("创建站点设置失败"));
        }
    }

    /// <summary>
    /// 删除站点设置
    /// </summary>
    [HttpDelete("settings/{key}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSiteSetting(
        string key,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.DeleteSiteSettingAsync(key, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting site setting {Key}", key);
            return BadRequest(ApiResponse.CreateError("删除站点设置失败"));
        }
    }

    #endregion

    #region 用户管理

    /// <summary>
    /// 获取用户列表
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminUserDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserDto>>>> GetUsers(
        [FromQuery] AdminUserQueryDto query,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetUsersAsync(query, cancellationToken);
            return Ok(ApiResponse<PagedResult<AdminUserDto>>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return BadRequest(ApiResponse.CreateError("获取用户列表失败"));
        }
    }

    /// <summary>
    /// 获取用户详情
    /// </summary>
    [HttpGet("users/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> GetUser(
        int userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetUserAsync(userId, cancellationToken);
            
            if (result == null)
                return NotFound(ApiResponse.CreateError("用户不存在"));

            return Ok(ApiResponse<AdminUserDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            return BadRequest(ApiResponse.CreateError("获取用户详情失败"));
        }
    }

    /// <summary>
    /// 更新用户状态
    /// </summary>
    [HttpPut("users/{userId}/status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateUserStatus(
        int userId,
        [FromBody] UpdateUserStatusDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.UpdateUserStatusAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user status {UserId}", userId);
            return BadRequest(ApiResponse.CreateError("更新用户状态失败"));
        }
    }

    /// <summary>
    /// 更新用户角色
    /// </summary>
    [HttpPut("users/{userId}/roles")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateUserRoles(
        int userId,
        [FromBody] UpdateUserRolesDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.UpdateUserRolesAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user roles {UserId}", userId);
            return BadRequest(ApiResponse.CreateError("更新用户角色失败"));
        }
    }

    /// <summary>
    /// 删除用户
    /// </summary>
    [HttpDelete("users/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(
        int userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.DeleteUserAsync(userId, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", userId);
            return BadRequest(ApiResponse.CreateError("删除用户失败"));
        }
    }

    #endregion

    #region 帖子管理

    /// <summary>
    /// 获取帖子列表
    /// </summary>
    [HttpGet("posts")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminPostDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminPostDto>>>> GetPosts(
        [FromQuery] AdminPostQueryDto query,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetPostsAsync(query, cancellationToken);
            return Ok(ApiResponse<PagedResult<AdminPostDto>>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts");
            return BadRequest(ApiResponse.CreateError("获取帖子列表失败"));
        }
    }

    /// <summary>
    /// 获取帖子详情
    /// </summary>
    [HttpGet("posts/{postId}")]
    [ProducesResponseType(typeof(ApiResponse<AdminPostDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<AdminPostDto>>> GetPost(
        int postId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetPostAsync(postId, cancellationToken);
            
            if (result == null)
                return NotFound(ApiResponse.CreateError("帖子不存在"));

            return Ok(ApiResponse<AdminPostDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting post {PostId}", postId);
            return BadRequest(ApiResponse.CreateError("获取帖子详情失败"));
        }
    }

    /// <summary>
    /// 更新帖子状态
    /// </summary>
    [HttpPut("posts/{postId}/status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> UpdatePostStatus(
        int postId,
        [FromBody] UpdatePostStatusDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.UpdatePostStatusAsync(postId, dto, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post status {PostId}", postId);
            return BadRequest(ApiResponse.CreateError("更新帖子状态失败"));
        }
    }

    /// <summary>
    /// 批量操作帖子
    /// </summary>
    [HttpPost("posts/batch")]
    [ProducesResponseType(typeof(ApiResponse<int>), 200)]
    public async Task<ActionResult<ApiResponse<int>>> BatchOperatePosts(
        [FromBody] BatchPostOperationDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.BatchOperatePostsAsync(dto, cancellationToken);
            return Ok(ApiResponse<int>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch operating posts");
            return BadRequest(ApiResponse.CreateError("批量操作帖子失败"));
        }
    }

    /// <summary>
    /// 删除帖子
    /// </summary>
    [HttpDelete("posts/{postId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePost(
        int postId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.DeletePostAsync(postId, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId}", postId);
            return BadRequest(ApiResponse.CreateError("删除帖子失败"));
        }
    }

    #endregion

    #region 标签管理

    /// <summary>
    /// 获取标签列表
    /// </summary>
    [HttpGet("tags")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminTagDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminTagDto>>>> GetTags(
        [FromQuery] AdminTagQueryDto query,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetTagsAsync(query, cancellationToken);
            return Ok(ApiResponse<PagedResult<AdminTagDto>>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tags");
            return BadRequest(ApiResponse.CreateError("获取标签列表失败"));
        }
    }

    /// <summary>
    /// 获取标签统计
    /// </summary>
    [HttpGet("tags/stats")]
    [ProducesResponseType(typeof(ApiResponse<TagStatsDto>), 200)]
    public async Task<ActionResult<ApiResponse<TagStatsDto>>> GetTagStats(
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetTagStatsAsync(cancellationToken);
            return Ok(ApiResponse<TagStatsDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tag stats");
            return BadRequest(ApiResponse.CreateError("获取标签统计失败"));
        }
    }

    /// <summary>
    /// 获取标签详情
    /// </summary>
    [HttpGet("tags/{tagId}")]
    [ProducesResponseType(typeof(ApiResponse<AdminTagDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<AdminTagDto>>> GetTag(
        int tagId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetTagAsync(tagId, cancellationToken);
            
            if (result == null)
                return NotFound(ApiResponse.CreateError("标签不存在"));

            return Ok(ApiResponse<AdminTagDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tag {TagId}", tagId);
            return BadRequest(ApiResponse.CreateError("获取标签详情失败"));
        }
    }

    /// <summary>
    /// 创建标签
    /// </summary>
    [HttpPost("tags")]
    [ProducesResponseType(typeof(ApiResponse<AdminTagDto>), 200)]
    public async Task<ActionResult<ApiResponse<AdminTagDto>>> CreateTag(
        [FromBody] CreateUpdateTagDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.CreateTagAsync(dto, cancellationToken);
            return Ok(ApiResponse<AdminTagDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tag");
            return BadRequest(ApiResponse.CreateError("创建标签失败"));
        }
    }

    /// <summary>
    /// 更新标签
    /// </summary>
    [HttpPut("tags/{tagId}")]
    [ProducesResponseType(typeof(ApiResponse<AdminTagDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<AdminTagDto>>> UpdateTag(
        int tagId,
        [FromBody] CreateUpdateTagDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.UpdateTagAsync(tagId, dto, cancellationToken);
            
            if (result == null)
                return NotFound(ApiResponse.CreateError("标签不存在"));

            return Ok(ApiResponse<AdminTagDto>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tag {TagId}", tagId);
            return BadRequest(ApiResponse.CreateError("更新标签失败"));
        }
    }

    /// <summary>
    /// 删除标签
    /// </summary>
    [HttpDelete("tags/{tagId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTag(
        int tagId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.DeleteTagAsync(tagId, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tag {TagId}", tagId);
            return BadRequest(ApiResponse.CreateError("删除标签失败"));
        }
    }

    /// <summary>
    /// 合并标签
    /// </summary>
    [HttpPost("tags/{sourceTagId}/merge/{targetTagId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> MergeTags(
        int sourceTagId,
        int targetTagId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.MergeTagsAsync(sourceTagId, targetTagId, cancellationToken);
            return Ok(ApiResponse<bool>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error merging tags {SourceTagId} -> {TargetTagId}", sourceTagId, targetTagId);
            return BadRequest(ApiResponse.CreateError("合并标签失败"));
        }
    }

    #endregion

    #region 私有方法

    /// <summary>
    /// 获取当前用户ID
    /// </summary>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("无法获取当前用户信息");
    }

    #endregion
}
