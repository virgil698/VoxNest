/**
 * 扩展上传相关 DTO
 */

namespace VoxNest.Server.Application.DTOs.Extension
{
    /// <summary>
    /// 扩展上传请求DTO
    /// </summary>
    public class ExtensionUploadDto
    {
        /// <summary>
        /// 扩展文件（ZIP格式）
        /// </summary>
        public IFormFile ExtensionFile { get; set; } = null!;
        
        /// <summary>
        /// 扩展类型：plugin 或 theme
        /// </summary>
        public string ExtensionType { get; set; } = string.Empty;
        
        /// <summary>
        /// 是否自动启用
        /// </summary>
        public bool AutoEnable { get; set; } = false;
        
        /// <summary>
        /// 是否覆盖已存在的扩展
        /// </summary>
        public bool OverrideExisting { get; set; } = false;
        
        /// <summary>
        /// 安装备注
        /// </summary>
        public string? InstallNote { get; set; }
    }
    
    /// <summary>
    /// 扩展预览信息DTO
    /// </summary>
    public class ExtensionPreviewDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Author { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string[] Dependencies { get; set; } = Array.Empty<string>();
        public string[] Tags { get; set; } = Array.Empty<string>();
        public string[] Permissions { get; set; } = Array.Empty<string>();
        public long FileSize { get; set; }
        public bool IsValid { get; set; } = true;
        public string[] ValidationErrors { get; set; } = Array.Empty<string>();
        public string[] ValidationWarnings { get; set; } = Array.Empty<string>();
        public bool AlreadyExists { get; set; } = false;
        public string? ExistingVersion { get; set; }
    }
    
    /// <summary>
    /// 扩展安装结果DTO
    /// </summary>
    public class ExtensionInstallResultDto
    {
        public bool Success { get; set; }
        public string ExtensionId { get; set; } = string.Empty;
        public string ExtensionName { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string InstallPath { get; set; } = string.Empty;
        public bool Enabled { get; set; }
        public string Message { get; set; } = string.Empty;
        public string[] Errors { get; set; } = Array.Empty<string>();
        public string[] Warnings { get; set; } = Array.Empty<string>();
        public DateTime InstalledAt { get; set; } = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 扩展清单解析结果
    /// </summary>
    public class ExtensionManifestInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Author { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Main { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public string[] Dependencies { get; set; } = Array.Empty<string>();
        public string[] Tags { get; set; } = Array.Empty<string>();
        public string[] Permissions { get; set; } = Array.Empty<string>();
        public Dictionary<string, object>? AdditionalProperties { get; set; }
    }
}
