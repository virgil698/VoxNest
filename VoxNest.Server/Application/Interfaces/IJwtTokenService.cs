using VoxNest.Server.Domain.Entities.User;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// JWT令牌服务接口
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// 生成访问令牌
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    Task<string> GenerateAccessTokenAsync(User user);

    /// <summary>
    /// 验证令牌
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    bool ValidateToken(string token);

    /// <summary>
    /// 从令牌中获取用户ID
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    int? GetUserIdFromToken(string token);

    /// <summary>
    /// 从令牌中获取用户名
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    string? GetUsernameFromToken(string token);
}
