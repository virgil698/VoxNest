/**
 * 统一扩展管理 DTO
 * 用于前端统一展示插件和主题
 */

using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Extension
{
    /// <summary>
    /// 统一扩展数据传输对象
    /// </summary>
    public class UnifiedExtensionDto
    {
        public int Id { get; set; }
        public string UniqueId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        
        /// <summary>
        /// 扩展类型：plugin 或 theme
        /// </summary>
        public string Type { get; set; } = string.Empty;
        
        /// <summary>
        /// 扩展状态：active, inactive, error 等
        /// </summary>
        public string Status { get; set; } = string.Empty;
        
        /// <summary>
        /// 原始状态（用于类型转换）
        /// </summary>
        public object? OriginalStatus { get; set; }
        
        public long FileSize { get; set; }
        public string? Config { get; set; }
        public string? IconPath { get; set; }
        public string? PreviewImagePath { get; set; }
        public string? Screenshots { get; set; }
        public string? Tags { get; set; }
        public int DownloadCount { get; set; }
        public bool IsBuiltIn { get; set; }
        public bool IsVerified { get; set; }
        public int? UploadedByUserId { get; set; }
        public string? UploadedByUsername { get; set; }
        public string? LastError { get; set; }
        
        /// <summary>
        /// 安装时间
        /// </summary>
        public DateTime? InstalledAt { get; set; }
        
        /// <summary>
        /// 激活/启用时间（插件用EnabledAt，主题用ActivatedAt）
        /// </summary>
        public DateTime? ActivatedAt { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // 插件专属字段
        public string? Dependencies { get; set; }
        public string? MinVoxNestVersion { get; set; }
        public string? MaxVoxNestVersion { get; set; }
        
        // 主题专属字段
        public string? Variables { get; set; }
        public string? CustomCss { get; set; }
        public string? ColorScheme { get; set; }
        public string? SupportedModes { get; set; }
        public int? UseCount { get; set; }
        public bool? IsDefault { get; set; }
        
        /// <summary>
        /// 扩展能力标识
        /// </summary>
        public ExtensionCapabilitiesDto? Capabilities { get; set; }
    }
    
    /// <summary>
    /// 扩展能力标识
    /// </summary>
    public class ExtensionCapabilitiesDto
    {
        public bool HasUI { get; set; }
        public bool HasAPI { get; set; }
        public bool HasStorage { get; set; }
        public bool HasTheming { get; set; }
        public bool HasLayout { get; set; }
        public string[] Slots { get; set; } = Array.Empty<string>();
        public string[] Hooks { get; set; } = Array.Empty<string>();
    }
    
    /// <summary>
    /// 统一扩展查询参数
    /// </summary>
    public class UnifiedExtensionQueryDto
    {
        public string? Search { get; set; }
        public string? Type { get; set; } // "plugin", "theme", "all"
        public string? Status { get; set; } // "active", "inactive", "error", "all"
        public bool? IsBuiltIn { get; set; }
        public bool? IsVerified { get; set; }
        public string? Tags { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
    
    /// <summary>
    /// 统一扩展统计信息
    /// </summary>
    public class UnifiedExtensionStatsDto
    {
        public int TotalExtensions { get; set; }
        public int TotalPlugins { get; set; }
        public int TotalThemes { get; set; }
        public int ActiveExtensions { get; set; }
        public int InactiveExtensions { get; set; }
        public int ErrorExtensions { get; set; }
        public int BuiltInExtensions { get; set; }
        public int VerifiedExtensions { get; set; }
        public long TotalFileSize { get; set; }
        
        /// <summary>
        /// 按类型统计
        /// </summary>
        public Dictionary<string, int> ExtensionsByType { get; set; } = new();
        
        /// <summary>
        /// 按状态统计
        /// </summary>
        public Dictionary<string, int> ExtensionsByStatus { get; set; } = new();
        
        /// <summary>
        /// 插件特定统计
        /// </summary>
        public PluginStatsDto? PluginStats { get; set; }
        
        /// <summary>
        /// 主题特定统计
        /// </summary>
        public ThemeStatsDto? ThemeStats { get; set; }
    }
    
    /// <summary>
    /// 扩展操作请求
    /// </summary>
    public class ExtensionActionDto
    {
        public string Action { get; set; } = string.Empty; // "enable", "disable", "activate", "install", "uninstall"
        public string ExtensionType { get; set; } = string.Empty; // "plugin", "theme"
        public int ExtensionId { get; set; }
        public Dictionary<string, object>? Parameters { get; set; }
    }
    
    /// <summary>
    /// 批量扩展操作请求
    /// </summary>
    public class BatchExtensionActionDto
    {
        public string Action { get; set; } = string.Empty;
        public List<ExtensionItemDto> Extensions { get; set; } = new();
        public Dictionary<string, object>? Parameters { get; set; }
    }
    
    /// <summary>
    /// 扩展项目标识
    /// </summary>
    public class ExtensionItemDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // "plugin", "theme"
        public string UniqueId { get; set; } = string.Empty;
    }
}
