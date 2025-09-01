namespace VoxNest.Server.Domain.Enums;

/// <summary>
/// 帖子状态枚举
/// </summary>
public enum PostStatus
{
    /// <summary>
    /// 草稿
    /// </summary>
    Draft = 0,
    
    /// <summary>
    /// 已发布
    /// </summary>
    Published = 1,
    
    /// <summary>
    /// 已锁定
    /// </summary>
    Locked = 2,
    
    /// <summary>
    /// 已置顶
    /// </summary>
    Pinned = 3,
    
    /// <summary>
    /// 已删除
    /// </summary>
    Deleted = 4
}
