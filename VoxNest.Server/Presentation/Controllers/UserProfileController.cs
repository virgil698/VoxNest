using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoxNest.Server.Application.DTOs.User;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Results;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 用户个人主页控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UserProfileController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;
    private readonly ILogger<UserProfileController> _logger;

    public UserProfileController(
        IUserProfileService userProfileService,
        ILogger<UserProfileController> logger)
    {
        _userProfileService = userProfileService;
        _logger = logger;
    }

    /// <summary>
    /// 根据用户名获取用户个人主页信息
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户个人主页信息</returns>
    [HttpGet("{username}")]
    public async Task<IActionResult> GetUserProfile(
        [FromRoute] string username,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _userProfileService.GetUserProfilePageAsync(username, cancellationToken);

            if (!result.IsSuccess)
            {
                if (result.ErrorMessage == "用户不存在")
                {
                    return NotFound(ApiResponse<object>.CreateError(result.ErrorMessage));
                }
                return BadRequest(ApiResponse<object>.CreateError(result.ErrorMessage));
            }

            return Ok(ApiResponse<UserProfilePageDto>.CreateSuccess(result.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户个人主页失败: {Username}", username);
            return StatusCode(500, ApiResponse<object>.CreateError("服务器内部错误"));
        }
    }

    /// <summary>
    /// 根据用户ID获取用户个人主页信息
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户个人主页信息</returns>
    [HttpGet("id/{userId:int}")]
    public async Task<IActionResult> GetUserProfileById(
        [FromRoute] int userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _userProfileService.GetUserProfilePageAsync(userId, cancellationToken);

            if (!result.IsSuccess)
            {
                if (result.ErrorMessage == "用户不存在")
                {
                    return NotFound(ApiResponse<object>.CreateError(result.ErrorMessage));
                }
                return BadRequest(ApiResponse<object>.CreateError(result.ErrorMessage));
            }

            return Ok(ApiResponse<UserProfilePageDto>.CreateSuccess(result.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户个人主页失败: {UserId}", userId);
            return StatusCode(500, ApiResponse<object>.CreateError("服务器内部错误"));
        }
    }

    /// <summary>
    /// 获取用户最近活动
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="limit">限制数量</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户最近活动列表</returns>
    [HttpGet("{userId:int}/activities")]
    public async Task<IActionResult> GetUserRecentActivities(
        [FromRoute] int userId,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (limit > 50) limit = 50; // 限制最大查询数量

            var result = await _userProfileService.GetUserRecentActivitiesAsync(userId, limit, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.CreateError(result.ErrorMessage));
            }

            return Ok(ApiResponse<List<UserRecentActivityDto>>.CreateSuccess(result.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户最近活动失败: {UserId}", userId);
            return StatusCode(500, ApiResponse<object>.CreateError("服务器内部错误"));
        }
    }

    /// <summary>
    /// 获取用户最近帖子
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="limit">限制数量</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户最近帖子列表</returns>
    [HttpGet("{userId:int}/posts")]
    public async Task<IActionResult> GetUserRecentPosts(
        [FromRoute] int userId,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (limit > 50) limit = 50; // 限制最大查询数量

            var result = await _userProfileService.GetUserRecentPostsAsync(userId, limit, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.CreateError(result.ErrorMessage));
            }

            return Ok(ApiResponse<List<UserRecentPostDto>>.CreateSuccess(result.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户最近帖子失败: {UserId}", userId);
            return StatusCode(500, ApiResponse<object>.CreateError("服务器内部错误"));
        }
    }
}
