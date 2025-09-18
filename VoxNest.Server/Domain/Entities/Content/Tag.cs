using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.Content;

/// <summary>
/// 标签实体
/// </summary>
public class Tag
{
    /// <summary>
    /// 标签ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 标签名称
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 标签别名（用于URL）
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 标签颜色
    /// </summary>
    [StringLength(7)]
    public string? Color { get; set; }

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UseCount { get; set; } = 0;

    /// <summary>
    /// 是否为常驻标签（true: 常驻标签，只能管理员创建和管理；false: 动态标签，用户可创建）
    /// </summary>
    public bool IsPermanent { get; set; } = false;

    /// <summary>
    /// 创建者ID（动态标签记录创建者）
    /// </summary>
    public int? CreatedBy { get; set; }

    /// <summary>
    /// 最后使用时间（用于动态标签清理）
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 创建者（动态标签的创建用户）
    /// </summary>
    public User.User? Creator { get; set; }

    /// <summary>
    /// 帖子标签关联
    /// </summary>
    public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
}
