using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.User;

/// <summary>
/// 角色实体
/// </summary>
public class Role
{
    /// <summary>
    /// 角色ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 角色名称
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 角色描述
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 是否为系统角色
    /// </summary>
    public bool IsSystemRole { get; set; } = false;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 用户角色关联
    /// </summary>
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    /// <summary>
    /// 角色权限关联
    /// </summary>
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
