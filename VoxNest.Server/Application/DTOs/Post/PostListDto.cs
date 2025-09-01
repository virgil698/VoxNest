using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Post;

/// <summary>
/// 帖子列表项DTO
/// </summary>
public class PostListDto
{
    /// <summary>
    /// 帖子ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 帖子标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 帖子摘要
    /// </summary>
    public string? Summary { get; set; }

    /// <summary>
    /// 帖子状态
    /// </summary>
    public PostStatus Status { get; set; }

    /// <summary>
    /// 作者信息
    /// </summary>
    public PostAuthorDto Author { get; set; } = null!;

    /// <summary>
    /// 分类信息
    /// </summary>
    public CategoryDto? Category { get; set; }

    /// <summary>
    /// 标签列表
    /// </summary>
    public List<TagDto> Tags { get; set; } = new();

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 发布时间
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// 浏览次数
    /// </summary>
    public int ViewCount { get; set; }

    /// <summary>
    /// 点赞次数
    /// </summary>
    public int LikeCount { get; set; }

    /// <summary>
    /// 评论次数
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// 是否置顶
    /// </summary>
    public bool IsPinned { get; set; }

    /// <summary>
    /// 是否锁定
    /// </summary>
    public bool IsLocked { get; set; }
}
