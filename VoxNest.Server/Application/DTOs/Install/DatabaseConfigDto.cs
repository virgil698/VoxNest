using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Application.DTOs.Install;

/// <summary>
/// 数据库配置DTO
/// </summary>
public class DatabaseConfigDto
{
    /// <summary>
    /// 数据库提供商
    /// </summary>
    [Required(ErrorMessage = "数据库提供商不能为空")]
    public string Provider { get; set; } = "MySQL";

    /// <summary>
    /// 服务器地址
    /// </summary>
    [Required(ErrorMessage = "服务器地址不能为空")]
    public string Server { get; set; } = "localhost";

    /// <summary>
    /// 端口号
    /// </summary>
    [Range(1, 65535, ErrorMessage = "端口号必须在1-65535之间")]
    public int Port { get; set; } = 3306;

    /// <summary>
    /// 数据库名称
    /// </summary>
    [Required(ErrorMessage = "数据库名称不能为空")]
    public string Database { get; set; } = string.Empty;

    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 字符集
    /// </summary>
    public string CharSet { get; set; } = "utf8mb4";
}

/// <summary>
/// 管理员账户创建DTO
/// </summary>
public class CreateAdminDto
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-50个字符之间")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "密码长度必须在6-100个字符之间")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 确认密码
    /// </summary>
    [Required(ErrorMessage = "确认密码不能为空")]
    [Compare("Password", ErrorMessage = "两次输入的密码不一致")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称不能超过100个字符")]
    public string? DisplayName { get; set; }
}

/// <summary>
/// 站点配置DTO
/// </summary>
public class SiteConfigDto
{
    /// <summary>
    /// 站点名称
    /// </summary>
    [Required(ErrorMessage = "站点名称不能为空")]
    [StringLength(100, ErrorMessage = "站点名称不能超过100个字符")]
    public string SiteName { get; set; } = "VoxNest 论坛";

    /// <summary>
    /// 站点描述
    /// </summary>
    [StringLength(500, ErrorMessage = "站点描述不能超过500个字符")]
    public string? SiteDescription { get; set; }

    /// <summary>
    /// 管理员邮箱
    /// </summary>
    [Required(ErrorMessage = "管理员邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string AdminEmail { get; set; } = string.Empty;
}
