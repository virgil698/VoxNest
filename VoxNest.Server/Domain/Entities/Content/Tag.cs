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
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 帖子标签关联
    /// </summary>
    public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
}
