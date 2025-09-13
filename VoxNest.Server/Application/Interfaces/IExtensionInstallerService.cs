/**
 * 扩展安装服务接口
 */

using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Application.Interfaces
{
    public interface IExtensionInstallerService
    {
        /// <summary>
        /// 预览扩展文件（不实际安装）
        /// </summary>
        Task<ApiResponse<ExtensionPreviewDto>> PreviewExtensionAsync(IFormFile extensionFile, string extensionType);
        
        /// <summary>
        /// 安装扩展
        /// </summary>
        Task<ApiResponse<ExtensionInstallResultDto>> InstallExtensionAsync(ExtensionUploadDto uploadDto, int userId);
        
        /// <summary>
        /// 卸载扩展（删除文件和数据库记录）
        /// </summary>
        Task<ApiResponse<string>> UninstallExtensionAsync(string extensionId, string extensionType);
        
        /// <summary>
        /// 验证扩展文件
        /// </summary>
        Task<ApiResponse<ExtensionManifestInfo>> ValidateExtensionFileAsync(IFormFile extensionFile);
        
        /// <summary>
        /// 检查扩展兼容性
        /// </summary>
        Task<ApiResponse<Dictionary<string, object>>> CheckExtensionCompatibilityAsync(ExtensionManifestInfo manifest);
        
        /// <summary>
        /// 清理无效的扩展文件
        /// </summary>
        Task<ApiResponse<Dictionary<string, int>>> CleanupExtensionFilesAsync();
        
        /// <summary>
        /// 获取扩展安装历史
        /// </summary>
        Task<ApiResponse<List<ExtensionInstallResultDto>>> GetInstallHistoryAsync(int limit = 50);
    }
}
