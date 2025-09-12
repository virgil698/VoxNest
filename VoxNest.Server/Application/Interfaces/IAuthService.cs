using VoxNest.Server.Application.DTOs.Auth;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 认证服务接口
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 用户注册
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<Result<UserDto>> RegisterAsync(RegisterRequestDto request);

    /// <summary>
    /// 用户登录
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto request);

    /// <summary>
    /// 根据ID获取用户信息
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    Task<Result<UserDto>> GetUserByIdAsync(int userId);

    /// <summary>
    /// 根据用户名获取用户信息
    /// </summary>
    /// <param name="username"></param>
    /// <returns></returns>
    Task<Result<UserDto>> GetUserByUsernameAsync(string username);

    /// <summary>
    /// 验证用户名是否存在
    /// </summary>
    /// <param name="username"></param>
    /// <returns></returns>
    Task<bool> IsUsernameExistsAsync(string username);

    /// <summary>
    /// 验证邮箱是否存在
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    Task<bool> IsEmailExistsAsync(string email);

    /// <summary>
    /// 重置管理员密码（仅开发环境）
    /// </summary>
    /// <param name="email">管理员邮箱</param>
    /// <param name="newPassword">新密码</param>
    /// <returns>重置结果</returns>
    Task<Result<string>> ResetAdminPasswordAsync(string email, string newPassword);
}
