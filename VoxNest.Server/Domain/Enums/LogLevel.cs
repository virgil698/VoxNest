namespace VoxNest.Server.Domain.Enums;

/// <summary>
/// 日志级别枚举
/// </summary>
public enum LogLevel
{
    /// <summary>
    /// 调试信息
    /// </summary>
    Debug = 0,

    /// <summary>
    /// 信息
    /// </summary>
    Info = 1,

    /// <summary>
    /// 警告
    /// </summary>
    Warning = 2,

    /// <summary>
    /// 错误
    /// </summary>
    Error = 3,

    /// <summary>
    /// 致命错误
    /// </summary>
    Fatal = 4
}
