using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Admin;

/// <summary>
/// 更新站点设置DTO
/// </summary>
public class UpdateSiteSettingDto
{
    /// <summary>
    /// 设置键名
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// 设置值
    /// </summary>
    public string? Value { get; set; }

    /// <summary>
    /// 设置类型
    /// </summary>
    public SiteSettingType Type { get; set; } = SiteSettingType.Text;

    /// <summary>
    /// 设置名称
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 设置描述
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 设置分组
    /// </summary>
    [StringLength(50)]
    public string? Group { get; set; }

    /// <summary>
    /// 是否公开
    /// </summary>
    public bool IsPublic { get; set; } = false;

    /// <summary>
    /// 排序序号
    /// </summary>
    public int Sort { get; set; } = 0;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 默认值
    /// </summary>
    public string? DefaultValue { get; set; }

    /// <summary>
    /// 验证规则（JSON格式）
    /// </summary>
    public string? ValidationRules { get; set; }

    /// <summary>
    /// 选项配置（JSON格式）
    /// </summary>
    public string? Options { get; set; }
}
