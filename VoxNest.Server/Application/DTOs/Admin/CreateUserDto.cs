using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// 管理员创建用户DTO
/// </summary>
public class CreateUserDto
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-50个字符之间")]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "用户名只能包含字母、数字、下划线和短横线")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    [StringLength(255, ErrorMessage = "邮箱长度不能超过255个字符")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "密码长度必须在6-100个字符之间")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称长度不能超过100个字符")]
    public string? DisplayName { get; set; }

    /// <summary>
    /// 头像URL
    /// </summary>
    [StringLength(500, ErrorMessage = "头像URL长度不能超过500个字符")]
    [Url(ErrorMessage = "头像URL格式不正确")]
    public string? Avatar { get; set; }

    /// <summary>
    /// 用户状态
    /// </summary>
    public UserStatus Status { get; set; } = UserStatus.Active;

    /// <summary>
    /// 角色ID列表
    /// </summary>
    public List<int> RoleIds { get; set; } = new();

    /// <summary>
    /// 备注
    /// </summary>
    [StringLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}

/// <summary>
/// 更新用户DTO
/// </summary>
public class UpdateUserDto
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-50个字符之间")]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "用户名只能包含字母、数字、下划线和短横线")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    [StringLength(255, ErrorMessage = "邮箱长度不能超过255个字符")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 新密码（可选）
    /// </summary>
    [StringLength(100, MinimumLength = 6, ErrorMessage = "密码长度必须在6-100个字符之间")]
    public string? NewPassword { get; set; }

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称长度不能超过100个字符")]
    public string? DisplayName { get; set; }

    /// <summary>
    /// 头像URL
    /// </summary>
    [StringLength(500, ErrorMessage = "头像URL长度不能超过500个字符")]
    [Url(ErrorMessage = "头像URL格式不正确")]
    public string? Avatar { get; set; }

    /// <summary>
    /// 用户状态
    /// </summary>
    public UserStatus Status { get; set; }

    /// <summary>
    /// 角色ID列表
    /// </summary>
    public List<int> RoleIds { get; set; } = new();

    /// <summary>
    /// 备注
    /// </summary>
    [StringLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
