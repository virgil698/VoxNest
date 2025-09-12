/**
 * 主题管理服务接口
 */

using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces
{
    public interface IThemeService
    {
        /// <summary>
        /// 获取主题列表
        /// </summary>
        Task<PagedResult<ThemeDto>> GetThemesAsync(ThemeQueryDto query);
        
        /// <summary>
        /// 根据ID获取主题详情
        /// </summary>
        Task<ApiResponse<ThemeDto>> GetThemeByIdAsync(int id);
        
        /// <summary>
        /// 根据UniqueId获取主题详情
        /// </summary>
        Task<ApiResponse<ThemeDto>> GetThemeByUniqueIdAsync(string uniqueId);
        
        /// <summary>
        /// 创建主题记录
        /// </summary>
        Task<ApiResponse<ThemeDto>> CreateThemeAsync(CreateThemeDto createDto, int userId);
        
        /// <summary>
        /// 更新主题信息
        /// </summary>
        Task<ApiResponse<ThemeDto>> UpdateThemeAsync(int id, UpdateThemeDto updateDto);
        
        /// <summary>
        /// 上传主题文件
        /// </summary>
        Task<ApiResponse<ThemeDto>> UploadThemeAsync(ThemeUploadDto uploadDto, int userId);
        
        /// <summary>
        /// 安装主题
        /// </summary>
        Task<ApiResponse<string>> InstallThemeAsync(int id);
        
        /// <summary>
        /// 激活主题（设为当前主题）
        /// </summary>
        Task<ApiResponse<string>> ActivateThemeAsync(int id);
        
        /// <summary>
        /// 禁用主题
        /// </summary>
        Task<ApiResponse<string>> DisableThemeAsync(int id);
        
        /// <summary>
        /// 卸载主题
        /// </summary>
        Task<ApiResponse<string>> UninstallThemeAsync(int id);
        
        /// <summary>
        /// 删除主题
        /// </summary>
        Task<ApiResponse<string>> DeleteThemeAsync(int id);
        
        /// <summary>
        /// 获取当前激活的主题
        /// </summary>
        Task<ApiResponse<ThemeDto>> GetActiveThemeAsync();
        
        /// <summary>
        /// 获取主题预览信息
        /// </summary>
        Task<ApiResponse<List<ThemePreviewDto>>> GetThemePreviewsAsync();
        
        /// <summary>
        /// 获取主题统计信息
        /// </summary>
        Task<ApiResponse<ThemeStatsDto>> GetThemeStatsAsync();
        
        /// <summary>
        /// 预览主题效果
        /// </summary>
        Task<ApiResponse<ThemePreviewDto>> PreviewThemeAsync(int id);
        
        /// <summary>
        /// 重置为默认主题
        /// </summary>
        Task<ApiResponse<string>> ResetToDefaultThemeAsync();
        
        /// <summary>
        /// 批量操作主题状态
        /// </summary>
        Task<ApiResponse<string>> BatchUpdateThemeStatusAsync(List<int> themeIds, ThemeStatus status);
        
        /// <summary>
        /// 验证主题文件
        /// </summary>
        Task<ApiResponse<string>> ValidateThemeFileAsync(IFormFile file);
        
        /// <summary>
        /// 导出主题配置
        /// </summary>
        Task<ApiResponse<byte[]>> ExportThemeConfigAsync(int id);
        
        /// <summary>
        /// 导入主题配置
        /// </summary>
        Task<ApiResponse<string>> ImportThemeConfigAsync(int id, IFormFile configFile);
        
        /// <summary>
        /// 自定义主题变量
        /// </summary>
        Task<ApiResponse<string>> CustomizeThemeVariablesAsync(int id, Dictionary<string, string> variables);
        
        /// <summary>
        /// 获取主题变量定义
        /// </summary>
        Task<ApiResponse<Dictionary<string, object>>> GetThemeVariableDefinitionsAsync(int id);
    }
}
