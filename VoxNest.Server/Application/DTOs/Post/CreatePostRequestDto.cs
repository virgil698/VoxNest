using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Application.DTOs.Post;

/// <summary>
/// 创建帖子请求DTO
/// </summary>
public class CreatePostRequestDto
{
    /// <summary>
    /// 帖子标题
    /// </summary>
    [Required(ErrorMessage = "标题不能为空")]
    [StringLength(200, ErrorMessage = "标题长度不能超过200个字符")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 帖子内容
    /// </summary>
    [Required(ErrorMessage = "内容不能为空")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 帖子摘要
    /// </summary>
    [StringLength(500, ErrorMessage = "摘要长度不能超过500个字符")]
    public string? Summary { get; set; }

    /// <summary>
    /// 分类ID
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 标签ID列表
    /// </summary>
    public List<int> TagIds { get; set; } = new();
}
