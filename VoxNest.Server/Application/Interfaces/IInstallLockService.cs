using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 安装操作锁服务接口
/// </summary>
public interface IInstallLockService
{
    /// <summary>
    /// 获取操作锁
    /// </summary>
    /// <param name="operation">操作名称</param>
    /// <param name="timeoutSeconds">超时时间（秒）</param>
    /// <returns>锁对象，使用完毕后需要释放</returns>
    Task<Result<IAsyncDisposable>> AcquireLockAsync(string operation, int timeoutSeconds = 30);

    /// <summary>
    /// 检查操作是否被锁定
    /// </summary>
    /// <param name="operation">操作名称</param>
    /// <returns>是否被锁定</returns>
    Task<bool> IsLockedAsync(string operation);

    /// <summary>
    /// 强制释放锁（仅限紧急情况）
    /// </summary>
    /// <param name="operation">操作名称</param>
    /// <returns>释放结果</returns>
    Task<Result> ForceReleaseLockAsync(string operation);
}
