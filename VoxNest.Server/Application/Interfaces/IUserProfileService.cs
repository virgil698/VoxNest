using VoxNest.Server.Application.DTOs.User;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 用户个人主页服务接口
/// </summary>
public interface IUserProfileService
{
    /// <summary>
    /// 根据用户名获取用户个人主页信息
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户个人主页信息</returns>
    Task<Result<UserProfilePageDto>> GetUserProfilePageAsync(string username, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据用户ID获取用户个人主页信息
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户个人主页信息</returns>
    Task<Result<UserProfilePageDto>> GetUserProfilePageAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取用户最近活动
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="limit">获取数量限制</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户最近活动列表</returns>
    Task<Result<List<UserRecentActivityDto>>> GetUserRecentActivitiesAsync(int userId, int limit = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取用户最近帖子
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="limit">获取数量限制</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>用户最近帖子列表</returns>
    Task<Result<List<UserRecentPostDto>>> GetUserRecentPostsAsync(int userId, int limit = 10, CancellationToken cancellationToken = default);
}
