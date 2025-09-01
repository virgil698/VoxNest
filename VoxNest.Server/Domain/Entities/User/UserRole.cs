namespace VoxNest.Server.Domain.Entities.User;

/// <summary>
/// 用户角色关联实体
/// </summary>
public class UserRole
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 角色ID
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// 授权时间
    /// </summary>
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 授权者ID
    /// </summary>
    public int? GrantedBy { get; set; }

    /// <summary>
    /// 关联的用户
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// 关联的角色
    /// </summary>
    public Role Role { get; set; } = null!;
}
