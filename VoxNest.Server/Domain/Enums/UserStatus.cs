namespace VoxNest.Server.Domain.Enums;

/// <summary>
/// 用户状态枚举
/// </summary>
public enum UserStatus
{
    /// <summary>
    /// 待验证
    /// </summary>
    Pending = 0,
    
    /// <summary>
    /// 活跃
    /// </summary>
    Active = 1,
    
    /// <summary>
    /// 已禁用
    /// </summary>
    Disabled = 2,
    
    /// <summary>
    /// 已删除
    /// </summary>
    Deleted = 3
}
