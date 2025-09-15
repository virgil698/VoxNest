/**
 * 基于文件系统的扩展管理服务接口
 */

using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces
{
    public interface IFileSystemExtensionService
    {
        /// <summary>
        /// 获取所有扩展（已安装和未安装）
        /// </summary>
        Task<PagedResult<UnifiedExtensionDto>> GetAllExtensionsAsync(UnifiedExtensionQueryDto query);

        /// <summary>
        /// 安装扩展
        /// </summary>
        Task<Result> InstallExtensionAsync(string extensionId, int userId);

        /// <summary>
        /// 卸载扩展（删除文件夹和从配置移除）
        /// </summary>
        Task<Result> UninstallExtensionAsync(string extensionId);

        /// <summary>
        /// 启用/禁用扩展
        /// </summary>
        Task<Result> ToggleExtensionAsync(string extensionId, bool enabled);

        /// <summary>
        /// 获取扩展统计信息
        /// </summary>
        Task<ApiResponse<UnifiedExtensionStatsDto>> GetExtensionStatsAsync();
    }
}
