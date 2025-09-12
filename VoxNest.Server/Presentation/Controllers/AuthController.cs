using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Auth;
using VoxNest.Server.Application.Interfaces;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 认证控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    /// <param name="request">注册信息</param>
    /// <returns>用户信息</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.RegisterAsync(request);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = "注册成功",
                data = result.Data
            });
        }

        return BadRequest(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    /// <param name="request">登录信息</param>
    /// <returns>登录结果</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.LoginAsync(request);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = "登录成功",
                data = result.Data
            });
        }

        return Unauthorized(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 获取当前用户信息
    /// </summary>
    /// <returns>当前用户信息</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "无效的用户身份"
            });
        }

        var result = await _authService.GetUserByIdAsync(userId);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = "获取用户信息成功",
                data = result.Data
            });
        }

        return NotFound(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 检查用户名是否可用
    /// </summary>
    /// <param name="username">用户名</param>
    /// <returns>是否可用</returns>
    [HttpGet("check-username/{username}")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new
            {
                success = false,
                message = "用户名不能为空"
            });
        }

        var exists = await _authService.IsUsernameExistsAsync(username);
        
        return Ok(new
        {
            success = true,
            data = new
            {
                username,
                available = !exists
            }
        });
    }

    /// <summary>
    /// 检查邮箱是否可用
    /// </summary>
    /// <param name="email">邮箱地址</param>
    /// <returns>是否可用</returns>
    [HttpGet("check-email")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                success = false,
                message = "邮箱地址不能为空"
            });
        }

        var exists = await _authService.IsEmailExistsAsync(email);
        
        return Ok(new
        {
            success = true,
            data = new
            {
                email,
                available = !exists
            }
        });
    }

    /// <summary>
    /// 用户注销
    /// </summary>
    /// <returns>注销结果</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Logout()
    {
        // 对于JWT，客户端只需要删除本地存储的令牌即可
        // 这里可以添加黑名单逻辑（如果需要）
        
        return Ok(new
        {
            success = true,
            message = "注销成功"
        });
    }

    /// <summary>
    /// 重置管理员密码（仅开发环境）
    /// </summary>
    /// <param name="request">重置请求</param>
    /// <returns>重置结果</returns>
    [HttpPost("reset-admin-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetAdminPassword([FromBody] ResetAdminPasswordRequest request)
    {
        var result = await _authService.ResetAdminPasswordAsync(request.Email, request.NewPassword);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = result.Data
            });
        }

        return BadRequest(new
        {
            success = false,
            message = result.ErrorMessage
        });
    }
}

public class ResetAdminPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
