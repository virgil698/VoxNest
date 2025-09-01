using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.User;

/// <summary>
/// 权限实体
/// </summary>
public class Permission
{
    /// <summary>
    /// 权限ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 权限名称
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 权限资源
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Resource { get; set; } = string.Empty;

    /// <summary>
    /// 权限操作
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 权限描述
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 角色权限关联
    /// </summary>
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
