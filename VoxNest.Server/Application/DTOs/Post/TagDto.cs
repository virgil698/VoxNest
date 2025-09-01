namespace VoxNest.Server.Application.DTOs.Post;

/// <summary>
/// 标签信息DTO
/// </summary>
public class TagDto
{
    /// <summary>
    /// 标签ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 标签名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 标签别名
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UseCount { get; set; }
}
