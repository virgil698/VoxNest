using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.System;

/// <summary>
/// 安装操作锁实体
/// </summary>
public class InstallLock
{
    /// <summary>
    /// 锁键值
    /// </summary>
    [Key]
    [StringLength(100)]
    public string LockKey { get; set; } = string.Empty;

    /// <summary>
    /// 获取锁的时间
    /// </summary>
    public DateTime AcquiredAt { get; set; }

    /// <summary>
    /// 锁过期时间
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 进程ID
    /// </summary>
    public int ProcessId { get; set; }

    /// <summary>
    /// 获取锁的主机名（可选）
    /// </summary>
    [StringLength(255)]
    public string? HostName { get; set; }

    /// <summary>
    /// 锁的描述信息
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }
}
