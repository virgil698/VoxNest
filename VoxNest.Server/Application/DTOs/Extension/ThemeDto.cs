/**
 * 主题相关 DTO
 */

using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Application.DTOs.Extension
{
    public class ThemeDto
    {
        public int Id { get; set; }
        public string UniqueId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public ThemeType Type { get; set; }
        public ThemeStatus Status { get; set; }
        public long FileSize { get; set; }
        public string? Config { get; set; }
        public string? Variables { get; set; }
        public string? CustomCss { get; set; }
        public string? PreviewImagePath { get; set; }
        public string? Screenshots { get; set; }
        public string? Tags { get; set; }
        public string? ColorScheme { get; set; }
        public string? SupportedModes { get; set; }
        public int DownloadCount { get; set; }
        public int UseCount { get; set; }
        public bool IsBuiltIn { get; set; }
        public bool IsVerified { get; set; }
        public bool IsDefault { get; set; }
        public int? UploadedByUserId { get; set; }
        public string? UploadedByUsername { get; set; }
        public string? LastError { get; set; }
        public DateTime? InstalledAt { get; set; }
        public DateTime? ActivatedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
    public class CreateThemeDto
    {
        public string UniqueId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public ThemeType Type { get; set; }
        public string? Config { get; set; }
        public string? Variables { get; set; }
        public string? CustomCss { get; set; }
        public string? Tags { get; set; }
        public string? ColorScheme { get; set; }
        public string? SupportedModes { get; set; }
        public bool IsDefault { get; set; }
    }
    
    public class UpdateThemeDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Homepage { get; set; }
        public string? Repository { get; set; }
        public string? Config { get; set; }
        public string? Variables { get; set; }
        public string? CustomCss { get; set; }
        public string? Tags { get; set; }
        public string? ColorScheme { get; set; }
        public string? SupportedModes { get; set; }
        public bool? IsDefault { get; set; }
        public bool? IsVerified { get; set; }
    }
    
    public class ThemeQueryDto
    {
        public string? Search { get; set; }
        public ThemeStatus? Status { get; set; }
        public ThemeType? Type { get; set; }
        public bool? IsBuiltIn { get; set; }
        public bool? IsVerified { get; set; }
        public string? Tags { get; set; }
        public string? SupportedMode { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
    
    public class ThemeStatsDto
    {
        public int TotalThemes { get; set; }
        public int ActiveThemes { get; set; }
        public int DisabledThemes { get; set; }
        public int ErrorThemes { get; set; }
        public int BuiltInThemes { get; set; }
        public int VerifiedThemes { get; set; }
        public long TotalFileSize { get; set; }
        public Dictionary<ThemeType, int> ThemesByType { get; set; } = new();
        public Dictionary<ThemeStatus, int> ThemesByStatus { get; set; } = new();
        public string? CurrentActiveTheme { get; set; }
    }
    
    public class ThemeUploadDto
    {
        public IFormFile ThemeFile { get; set; } = null!;
        public string? Description { get; set; }
        public string? Tags { get; set; }
        public bool SetAsDefault { get; set; } = false;
    }
    
    public class ThemePreviewDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? PreviewImagePath { get; set; }
        public string? Variables { get; set; }
        public string? ColorScheme { get; set; }
        public string? SupportedModes { get; set; }
    }
}
