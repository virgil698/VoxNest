using VoxNest.Server.Application.DTOs.Auth;

namespace VoxNest.Server.Application.DTOs.Install;

/// <summary>
/// 创建管理员响应DTO
/// </summary>
public class CreateAdminResponseDto
{
    /// <summary>
    /// 是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 消息
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 访问令牌
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// 令牌类型
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// 过期时间（秒）
    /// </summary>
    public int ExpiresIn { get; set; }

    /// <summary>
    /// 用户信息
    /// </summary>
    public UserDto? User { get; set; }

    /// <summary>
    /// 创建成功响应
    /// </summary>
    public static CreateAdminResponseDto CreateSuccess(string message, LoginResponseDto? authData = null)
    {
        var response = new CreateAdminResponseDto
        {
            Success = true,
            Message = message
        };

        if (authData != null)
        {
            response.AccessToken = authData.AccessToken;
            response.TokenType = authData.TokenType;
            response.ExpiresIn = authData.ExpiresIn;
            response.User = authData.User;
        }

        return response;
    }

    /// <summary>
    /// 创建失败响应
    /// </summary>
    public static CreateAdminResponseDto CreateFailure(string message)
    {
        return new CreateAdminResponseDto
        {
            Success = false,
            Message = message
        };
    }
}
