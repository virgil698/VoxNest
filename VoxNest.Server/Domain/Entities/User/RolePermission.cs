namespace VoxNest.Server.Domain.Entities.User;

/// <summary>
/// 角色权限关联实体
/// </summary>
public class RolePermission
{
    /// <summary>
    /// 角色ID
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// 权限ID
    /// </summary>
    public int PermissionId { get; set; }

    /// <summary>
    /// 授权时间
    /// </summary>
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 关联的角色
    /// </summary>
    public Role Role { get; set; } = null!;

    /// <summary>
    /// 关联的权限
    /// </summary>
    public Permission Permission { get; set; } = null!;
}
