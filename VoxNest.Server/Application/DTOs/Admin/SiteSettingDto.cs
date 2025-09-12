using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// 站点设置DTO
/// </summary>
public class SiteSettingDto
{
    /// <summary>
    /// 设置ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 设置键名
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// 设置值
    /// </summary>
    public string? Value { get; set; }

    /// <summary>
    /// 设置类型
    /// </summary>
    public SiteSettingType Type { get; set; }

    /// <summary>
    /// 设置类型名称
    /// </summary>
    public string TypeName { get; set; } = string.Empty;

    /// <summary>
    /// 设置名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 设置描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 设置分组
    /// </summary>
    public string? Group { get; set; }

    /// <summary>
    /// 是否公开
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// 排序序号
    /// </summary>
    public int Sort { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// 默认值
    /// </summary>
    public string? DefaultValue { get; set; }

    /// <summary>
    /// 验证规则
    /// </summary>
    public string? ValidationRules { get; set; }

    /// <summary>
    /// 选项配置
    /// </summary>
    public string? Options { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// 最后更新者
    /// </summary>
    public string? UpdatedByName { get; set; }
}
