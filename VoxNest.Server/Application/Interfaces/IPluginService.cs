/**
 * 插件管理服务接口
 */

using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces
{
    public interface IPluginService
    {
        /// <summary>
        /// 获取插件列表
        /// </summary>
        Task<PagedResult<PluginDto>> GetPluginsAsync(PluginQueryDto query);
        
        /// <summary>
        /// 根据ID获取插件详情
        /// </summary>
        Task<ApiResponse<PluginDto>> GetPluginByIdAsync(int id);
        
        /// <summary>
        /// 根据UniqueId获取插件详情
        /// </summary>
        Task<ApiResponse<PluginDto>> GetPluginByUniqueIdAsync(string uniqueId);
        
        /// <summary>
        /// 创建插件记录
        /// </summary>
        Task<ApiResponse<PluginDto>> CreatePluginAsync(CreatePluginDto createDto, int userId);
        
        /// <summary>
        /// 更新插件信息
        /// </summary>
        Task<ApiResponse<PluginDto>> UpdatePluginAsync(int id, UpdatePluginDto updateDto);
        
        /// <summary>
        /// 上传插件文件
        /// </summary>
        Task<ApiResponse<PluginDto>> UploadPluginAsync(PluginUploadDto uploadDto, int userId);
        
        /// <summary>
        /// 安装插件
        /// </summary>
        Task<ApiResponse<string>> InstallPluginAsync(int id);
        
        /// <summary>
        /// 启用插件
        /// </summary>
        Task<ApiResponse<string>> EnablePluginAsync(int id);
        
        /// <summary>
        /// 禁用插件
        /// </summary>
        Task<ApiResponse<string>> DisablePluginAsync(int id);
        
        /// <summary>
        /// 卸载插件
        /// </summary>
        Task<ApiResponse<string>> UninstallPluginAsync(int id);
        
        /// <summary>
        /// 删除插件
        /// </summary>
        Task<ApiResponse<string>> DeletePluginAsync(int id);
        
        /// <summary>
        /// 获取插件版本列表
        /// </summary>
        Task<ApiResponse<List<PluginVersionDto>>> GetPluginVersionsAsync(int pluginId);
        
        /// <summary>
        /// 获取插件统计信息
        /// </summary>
        Task<ApiResponse<PluginStatsDto>> GetPluginStatsAsync();
        
        /// <summary>
        /// 获取已启用的插件配置
        /// </summary>
        Task<ApiResponse<List<PluginDto>>> GetEnabledPluginsAsync();
        
        /// <summary>
        /// 批量操作插件状态
        /// </summary>
        Task<ApiResponse<string>> BatchUpdatePluginStatusAsync(List<int> pluginIds, PluginStatus status);
        
        /// <summary>
        /// 验证插件文件
        /// </summary>
        Task<ApiResponse<string>> ValidatePluginFileAsync(IFormFile file);
        
        /// <summary>
        /// 导出插件配置
        /// </summary>
        Task<ApiResponse<byte[]>> ExportPluginConfigAsync(int id);
        
        /// <summary>
        /// 导入插件配置
        /// </summary>
        Task<ApiResponse<string>> ImportPluginConfigAsync(int id, IFormFile configFile);
    }
}
