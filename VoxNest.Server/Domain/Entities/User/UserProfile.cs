using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.User;

/// <summary>
/// 用户配置文件实体
/// </summary>
public class UserProfile
{
    /// <summary>
    /// 用户ID（主键，外键）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100)]
    public string? DisplayName { get; set; }

    /// <summary>
    /// 头像URL
    /// </summary>
    [StringLength(500)]
    public string? Avatar { get; set; }

    /// <summary>
    /// 个人简介
    /// </summary>
    [StringLength(1000)]
    public string? Bio { get; set; }

    /// <summary>
    /// 所在地
    /// </summary>
    [StringLength(100)]
    public string? Location { get; set; }

    /// <summary>
    /// 个人网站
    /// </summary>
    [StringLength(500)]
    public string? Website { get; set; }

    /// <summary>
    /// 生日
    /// </summary>
    public DateTime? Birthday { get; set; }

    /// <summary>
    /// 性别
    /// </summary>
    [StringLength(10)]
    public string? Gender { get; set; }

    /// <summary>
    /// 关联的用户
    /// </summary>
    public User User { get; set; } = null!;
}
