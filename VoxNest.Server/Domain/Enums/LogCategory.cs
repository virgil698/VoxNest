namespace VoxNest.Server.Domain.Enums;

/// <summary>
/// 日志分类枚举
/// </summary>
public enum LogCategory
{
    /// <summary>
    /// 系统日志
    /// </summary>
    System = 0,

    /// <summary>
    /// 认证日志
    /// </summary>
    Authentication = 1,

    /// <summary>
    /// API访问日志
    /// </summary>
    Api = 2,

    /// <summary>
    /// 数据库操作日志
    /// </summary>
    Database = 3,

    /// <summary>
    /// 用户操作日志
    /// </summary>
    UserAction = 4,

    /// <summary>
    /// 错误日志
    /// </summary>
    Error = 5,

    /// <summary>
    /// 性能日志
    /// </summary>
    Performance = 6,

    /// <summary>
    /// 安全日志
    /// </summary>
    Security = 7,

    /// <summary>
    /// 前端日志
    /// </summary>
    Frontend = 8
}
