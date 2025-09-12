/**
 * 插件相关 DTO
 */

using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Extension
{
    public class PluginDto
    {
        public int Id { get; set; }
        public string UniqueId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public PluginType Type { get; set; }
        public PluginStatus Status { get; set; }
        public long FileSize { get; set; }
        public string? Config { get; set; }
        public string? Dependencies { get; set; }
        public string? MinVoxNestVersion { get; set; }
        public string? MaxVoxNestVersion { get; set; }
        public string? IconPath { get; set; }
        public string? Screenshots { get; set; }
        public string? Tags { get; set; }
        public int DownloadCount { get; set; }
        public bool IsBuiltIn { get; set; }
        public bool IsVerified { get; set; }
        public int? UploadedByUserId { get; set; }
        public string? UploadedByUsername { get; set; }
        public string? LastError { get; set; }
        public DateTime? InstalledAt { get; set; }
        public DateTime? EnabledAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
    public class CreatePluginDto
    {
        public string UniqueId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public PluginType Type { get; set; }
        public string? Config { get; set; }
        public string? Dependencies { get; set; }
        public string? MinVoxNestVersion { get; set; }
        public string? MaxVoxNestVersion { get; set; }
        public string? Tags { get; set; }
    }
    
    public class UpdatePluginDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public string? Config { get; set; }
        public string? Tags { get; set; }
        public bool? IsVerified { get; set; }
    }
    
    public class PluginQueryDto
    {
        public string? Search { get; set; }
        public PluginStatus? Status { get; set; }
        public PluginType? Type { get; set; }
        public bool? IsBuiltIn { get; set; }
        public bool? IsVerified { get; set; }
        public string? Tags { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
    
    public class PluginStatsDto
    {
        public int TotalPlugins { get; set; }
        public int EnabledPlugins { get; set; }
        public int DisabledPlugins { get; set; }
        public int ErrorPlugins { get; set; }
        public int BuiltInPlugins { get; set; }
        public int VerifiedPlugins { get; set; }
        public long TotalFileSize { get; set; }
        public Dictionary<PluginType, int> PluginsByType { get; set; } = new();
        public Dictionary<PluginStatus, int> PluginsByStatus { get; set; } = new();
    }
    
    public class PluginUploadDto
    {
        public IFormFile PluginFile { get; set; } = null!;
        public string? Description { get; set; }
        public string? Tags { get; set; }
    }
    
    public class PluginVersionDto
    {
        public int Id { get; set; }
        public string Version { get; set; } = string.Empty;
        public string? ReleaseNotes { get; set; }
        public long FileSize { get; set; }
        public bool IsActive { get; set; }
        public bool IsPrerelease { get; set; }
        public int DownloadCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
