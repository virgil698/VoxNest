namespace VoxNest.Server.Application.DTOs.Post;

/// <summary>
/// 分类信息DTO
/// </summary>
public class CategoryDto
{
    /// <summary>
    /// 分类ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 分类名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 分类别名
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 分类描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 分类图标
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 分类颜色
    /// </summary>
    public string? Color { get; set; }
}
