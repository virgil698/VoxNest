namespace VoxNest.Server.Application.DTOs.Post;

/// <summary>
/// 帖子标签选择DTO（创建/编辑帖子时使用）
/// </summary>
public class PostTagSelectionDto
{
    /// <summary>
    /// 现有标签ID列表（包括常驻标签和动态标签）
    /// </summary>
    public List<int> ExistingTagIds { get; set; } = new();

    /// <summary>
    /// 新建动态标签名称列表
    /// </summary>
    public List<string> NewDynamicTags { get; set; } = new();
}

/// <summary>
/// 标签选择选项DTO（用于前端显示）
/// </summary>
public class TagOptionDto
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
    /// 标签别名（用于URL）
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 标签颜色
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 是否为常驻标签
    /// </summary>
    public bool IsPermanent { get; set; }

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UseCount { get; set; }
}

/// <summary>
/// 标签验证结果DTO
/// </summary>
public class TagValidationResult
{
    /// <summary>
    /// 是否验证成功
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// 错误信息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 有效的常驻标签ID列表
    /// </summary>
    public List<int> ValidPermanentTagIds { get; set; } = new();

    /// <summary>
    /// 有效的动态标签ID列表
    /// </summary>
    public List<int> ValidDynamicTagIds { get; set; } = new();

    /// <summary>
    /// 需要创建的新动态标签列表
    /// </summary>
    public List<string> NewDynamicTagNames { get; set; } = new();
}
