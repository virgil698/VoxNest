/**
 * 统一扩展管理服务接口
 * 为前端提供统一的扩展管理功能
 */

using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces
{
    public interface IUnifiedExtensionService
    {
        /// <summary>
        /// 获取统一的扩展列表
        /// </summary>
        Task<PagedResult<UnifiedExtensionDto>> GetExtensionsAsync(UnifiedExtensionQueryDto query);
        
        /// <summary>
        /// 根据ID和类型获取扩展详情
        /// </summary>
        Task<ApiResponse<UnifiedExtensionDto>> GetExtensionAsync(int id, string type);
        
        /// <summary>
        /// 根据UniqueId获取扩展详情
        /// </summary>
        Task<ApiResponse<UnifiedExtensionDto>> GetExtensionByUniqueIdAsync(string uniqueId, string type);
        
        /// <summary>
        /// 获取扩展统计信息
        /// </summary>
        Task<ApiResponse<UnifiedExtensionStatsDto>> GetExtensionStatsAsync();
        
        /// <summary>
        /// 执行扩展操作（启用、禁用、激活等）
        /// </summary>
        Task<ApiResponse<string>> ExecuteExtensionActionAsync(ExtensionActionDto actionDto, int userId);
        
        /// <summary>
        /// 批量执行扩展操作
        /// </summary>
        Task<ApiResponse<Dictionary<string, string>>> ExecuteBatchExtensionActionAsync(BatchExtensionActionDto batchActionDto, int userId);
        
        /// <summary>
        /// 搜索扩展
        /// </summary>
        Task<ApiResponse<List<UnifiedExtensionDto>>> SearchExtensionsAsync(string searchTerm, int limit = 10);
        
        /// <summary>
        /// 获取扩展的完整manifest信息
        /// </summary>
        Task<ApiResponse<object>> GetExtensionManifestAsync(string uniqueId, string type);
        
        /// <summary>
        /// 验证扩展兼容性
        /// </summary>
        Task<ApiResponse<Dictionary<string, object>>> ValidateExtensionCompatibilityAsync(string uniqueId, string type);
        
        /// <summary>
        /// 获取扩展依赖关系图
        /// </summary>
        Task<ApiResponse<Dictionary<string, object>>> GetExtensionDependencyGraphAsync();
        
        /// <summary>
        /// 导出扩展配置
        /// </summary>
        Task<ApiResponse<string>> ExportExtensionsConfigAsync();
        
        /// <summary>
        /// 导入扩展配置
        /// </summary>
        Task<ApiResponse<string>> ImportExtensionsConfigAsync(string configData, int userId);
    }
}
