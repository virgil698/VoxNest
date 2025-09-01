using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.Content;

/// <summary>
/// 评论实体
/// </summary>
public class Comment
{
    /// <summary>
    /// 评论ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 帖子ID
    /// </summary>
    public int PostId { get; set; }

    /// <summary>
    /// 评论者ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 评论内容
    /// </summary>
    [Required]
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 父评论ID（用于回复）
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// 点赞次数
    /// </summary>
    public int LikeCount { get; set; } = 0;

    /// <summary>
    /// 关联的帖子
    /// </summary>
    public Post Post { get; set; } = null!;

    /// <summary>
    /// 评论者
    /// </summary>
    public User.User User { get; set; } = null!;

    /// <summary>
    /// 父评论
    /// </summary>
    public Comment? Parent { get; set; }

    /// <summary>
    /// 子评论列表
    /// </summary>
    public ICollection<Comment> Children { get; set; } = new List<Comment>();
}
