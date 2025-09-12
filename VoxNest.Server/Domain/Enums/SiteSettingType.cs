namespace VoxNest.Server.Domain.Enums;

/// <summary>
/// 站点设置类型枚举
/// </summary>
public enum SiteSettingType
{
    /// <summary>
    /// 文本类型
    /// </summary>
    Text = 0,

    /// <summary>
    /// 数字类型
    /// </summary>
    Number = 1,

    /// <summary>
    /// 布尔类型
    /// </summary>
    Boolean = 2,

    /// <summary>
    /// JSON对象类型
    /// </summary>
    Json = 3,

    /// <summary>
    /// 文件路径类型
    /// </summary>
    File = 4,

    /// <summary>
    /// 颜色类型
    /// </summary>
    Color = 5,

    /// <summary>
    /// 富文本类型
    /// </summary>
    RichText = 6
}
