namespace VoxNest.Server.Domain.Entities.Content;

/// <summary>
/// 帖子标签关联实体
/// </summary>
public class PostTag
{
    /// <summary>
    /// 帖子ID
    /// </summary>
    public int PostId { get; set; }

    /// <summary>
    /// 标签ID
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// 关联时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 关联的帖子
    /// </summary>
    public Post Post { get; set; } = null!;

    /// <summary>
    /// 关联的标签
    /// </summary>
    public Tag Tag { get; set; } = null!;
}
