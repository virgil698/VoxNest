using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Domain.Entities.Content;

/// <summary>
/// 帖子实体
/// </summary>
public class Post
{
    /// <summary>
    /// 帖子ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 帖子标题
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 帖子内容
    /// </summary>
    [Required]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 帖子摘要
    /// </summary>
    [StringLength(500)]
    public string? Summary { get; set; }

    /// <summary>
    /// 帖子状态
    /// </summary>
    public PostStatus Status { get; set; } = PostStatus.Published;

    /// <summary>
    /// 作者ID
    /// </summary>
    public int AuthorId { get; set; }

    /// <summary>
    /// 分类ID
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 发布时间
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// 浏览次数
    /// </summary>
    public int ViewCount { get; set; } = 0;

    /// <summary>
    /// 点赞次数
    /// </summary>
    public int LikeCount { get; set; } = 0;

    /// <summary>
    /// 评论次数
    /// </summary>
    public int CommentCount { get; set; } = 0;

    /// <summary>
    /// 是否置顶
    /// </summary>
    public bool IsPinned { get; set; } = false;

    /// <summary>
    /// 是否锁定
    /// </summary>
    public bool IsLocked { get; set; } = false;

    /// <summary>
    /// 作者
    /// </summary>
    public User.User Author { get; set; } = null!;

    /// <summary>
    /// 分类
    /// </summary>
    public Category? Category { get; set; }

    /// <summary>
    /// 帖子标签关联
    /// </summary>
    public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();

    /// <summary>
    /// 帖子评论
    /// </summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
