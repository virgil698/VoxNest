using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Domain.Entities.System;

/// <summary>
/// 站点设置实体
/// </summary>
public class SiteSetting
{
    /// <summary>
    /// 设置ID
    /// </summary>
    public int Id { get; set; }

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
    /// 是否公开（前端可访问）
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
    /// 选项配置（如下拉框选项，JSON格式）
    /// </summary>
    public string? Options { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 最后更新者ID
    /// </summary>
    public int? UpdatedById { get; set; }

    /// <summary>
    /// 最后更新者（导航属性）
    /// </summary>
    public User.User? UpdatedBy { get; set; }
}
