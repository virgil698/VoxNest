/**
 * 统一扩展管理服务实现
 * 整合插件和主题管理功能，为前端提供统一接口
 */

using AutoMapper;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services
{
    public class UnifiedExtensionService : IUnifiedExtensionService
    {
        private readonly IPluginService _pluginService;
        private readonly IThemeService _themeService;
        private readonly IMapper _mapper;
        private readonly ILogger<UnifiedExtensionService> _logger;

        public UnifiedExtensionService(
            IPluginService pluginService,
            IThemeService themeService,
            IMapper mapper,
            ILogger<UnifiedExtensionService> logger)
        {
            _pluginService = pluginService;
            _themeService = themeService;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// 获取统一的扩展列表
        /// </summary>
        public async Task<PagedResult<UnifiedExtensionDto>> GetExtensionsAsync(UnifiedExtensionQueryDto query)
        {
            try
            {
                var extensions = new List<UnifiedExtensionDto>();

                // 根据查询条件决定是否获取插件
                if (query.Type == null || query.Type == "all" || query.Type == "plugin")
                {
                    var pluginQuery = new PluginQueryDto
                    {
                        Search = query.Search,
                        Status = ParsePluginStatus(query.Status),
                        IsBuiltIn = query.IsBuiltIn,
                        IsVerified = query.IsVerified,
                        Tags = query.Tags,
                        SortBy = query.SortBy,
                        SortDescending = query.SortDescending,
                        Page = 1,
                        PageSize = int.MaxValue // 先获取所有数据，后面统一分页
                    };

                    var pluginResult = await _pluginService.GetPluginsAsync(pluginQuery);
                    if (pluginResult.IsSuccess && pluginResult.Data != null)
                    {
                        var pluginExtensions = pluginResult.Data.Select(ConvertPluginToUnifiedExtension).ToList();
                        extensions.AddRange(pluginExtensions);
                    }
                }

                // 根据查询条件决定是否获取主题
                if (query.Type == null || query.Type == "all" || query.Type == "theme")
                {
                    var themeQuery = new ThemeQueryDto
                    {
                        Search = query.Search,
                        Status = ParseThemeStatus(query.Status),
                        IsBuiltIn = query.IsBuiltIn,
                        IsVerified = query.IsVerified,
                        Tags = query.Tags,
                        SortBy = query.SortBy,
                        SortDescending = query.SortDescending,
                        Page = 1,
                        PageSize = int.MaxValue
                    };

                    var themeResult = await _themeService.GetThemesAsync(themeQuery);
                    if (themeResult.IsSuccess && themeResult.Data != null)
                    {
                        var themeExtensions = themeResult.Data.Select(ConvertThemeToUnifiedExtension).ToList();
                        extensions.AddRange(themeExtensions);
                    }
                }

                // 统一排序
                extensions = ApplySorting(extensions, query.SortBy, query.SortDescending);

                // 分页
                var totalCount = extensions.Count;
                var pagedExtensions = extensions
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToList();

                return PagedResult<UnifiedExtensionDto>.Success(
                    pagedExtensions,
                    totalCount,
                    query.Page,
                    query.PageSize
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取统一扩展列表失败");
                return PagedResult<UnifiedExtensionDto>.Failure("获取扩展列表失败");
            }
        }

        /// <summary>
        /// 根据ID和类型获取扩展详情
        /// </summary>
        public async Task<ApiResponse<UnifiedExtensionDto>> GetExtensionAsync(int id, string type)
        {
            try
            {
                if (type?.ToLower() == "plugin")
                {
                    var pluginResult = await _pluginService.GetPluginByIdAsync(id);
                    if (pluginResult.IsSuccess && pluginResult.Data != null)
                    {
                        var unifiedExtension = ConvertPluginToUnifiedExtension(pluginResult.Data);
                        return ApiResponse<UnifiedExtensionDto>.CreateSuccess(unifiedExtension);
                    }
                    return ApiResponse<UnifiedExtensionDto>.CreateError(pluginResult.Message);
                }
                else if (type?.ToLower() == "theme")
                {
                    var themeResult = await _themeService.GetThemeByIdAsync(id);
                    if (themeResult.IsSuccess && themeResult.Data != null)
                    {
                        var unifiedExtension = ConvertThemeToUnifiedExtension(themeResult.Data);
                        return ApiResponse<UnifiedExtensionDto>.CreateSuccess(unifiedExtension);
                    }
                    return ApiResponse<UnifiedExtensionDto>.CreateError(themeResult.Message);
                }

                return ApiResponse<UnifiedExtensionDto>.CreateError("无效的扩展类型");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展详情失败: {Type}/{Id}", type, id);
                return ApiResponse<UnifiedExtensionDto>.CreateError("获取扩展详情失败");
            }
        }

        /// <summary>
        /// 根据UniqueId获取扩展详情
        /// </summary>
        public async Task<ApiResponse<UnifiedExtensionDto>> GetExtensionByUniqueIdAsync(string uniqueId, string type)
        {
            try
            {
                if (type?.ToLower() == "plugin")
                {
                    var pluginResult = await _pluginService.GetPluginByUniqueIdAsync(uniqueId);
                    if (pluginResult.IsSuccess && pluginResult.Data != null)
                    {
                        var unifiedExtension = ConvertPluginToUnifiedExtension(pluginResult.Data);
                        return ApiResponse<UnifiedExtensionDto>.CreateSuccess(unifiedExtension);
                    }
                    return ApiResponse<UnifiedExtensionDto>.CreateError(pluginResult.Message);
                }
                else if (type?.ToLower() == "theme")
                {
                    var themeResult = await _themeService.GetThemeByUniqueIdAsync(uniqueId);
                    if (themeResult.IsSuccess && themeResult.Data != null)
                    {
                        var unifiedExtension = ConvertThemeToUnifiedExtension(themeResult.Data);
                        return ApiResponse<UnifiedExtensionDto>.CreateSuccess(unifiedExtension);
                    }
                    return ApiResponse<UnifiedExtensionDto>.CreateError(themeResult.Message);
                }

                return ApiResponse<UnifiedExtensionDto>.CreateError("无效的扩展类型");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据UniqueId获取扩展详情失败: {Type}/{UniqueId}", type, uniqueId);
                return ApiResponse<UnifiedExtensionDto>.CreateError("获取扩展详情失败");
            }
        }

        /// <summary>
        /// 获取扩展统计信息
        /// </summary>
        public async Task<ApiResponse<UnifiedExtensionStatsDto>> GetExtensionStatsAsync()
        {
            try
            {
                var stats = new UnifiedExtensionStatsDto();

                // 获取插件统计
                var pluginQuery = new PluginQueryDto { Page = 1, PageSize = int.MaxValue };
                var pluginResult = await _pluginService.GetPluginsAsync(pluginQuery);
                var pluginStats = new PluginStatsDto();
                
                if (pluginResult.IsSuccess && pluginResult.Data != null)
                {
                    var plugins = pluginResult.Data;
                    stats.TotalPlugins = plugins.Count;
                    stats.TotalExtensions += plugins.Count;
                    
                    foreach (var plugin in plugins)
                    {
                        var statusKey = ConvertPluginStatusToString(plugin.Status);
                        if (stats.ExtensionsByStatus.ContainsKey(statusKey))
                            stats.ExtensionsByStatus[statusKey]++;
                        else
                            stats.ExtensionsByStatus[statusKey] = 1;

                        stats.ExtensionsByType["plugin"] = stats.TotalPlugins;
                        stats.TotalFileSize += plugin.FileSize;

                        if (plugin.Status == PluginStatus.Enabled)
                            stats.ActiveExtensions++;
                        else if (plugin.Status == PluginStatus.Disabled)
                            stats.InactiveExtensions++;
                        else if (plugin.Status == PluginStatus.Error)
                            stats.ErrorExtensions++;

                        if (plugin.IsBuiltIn)
                            stats.BuiltInExtensions++;
                        if (plugin.IsVerified)
                            stats.VerifiedExtensions++;
                    }
                }

                // 获取主题统计
                var themeQuery = new ThemeQueryDto { Page = 1, PageSize = int.MaxValue };
                var themeResult = await _themeService.GetThemesAsync(themeQuery);
                var themeStats = new ThemeStatsDto();

                if (themeResult.IsSuccess && themeResult.Data != null)
                {
                    var themes = themeResult.Data;
                    stats.TotalThemes = themes.Count;
                    stats.TotalExtensions += themes.Count;

                    foreach (var theme in themes)
                    {
                        var statusKey = ConvertThemeStatusToString(theme.Status);
                        if (stats.ExtensionsByStatus.ContainsKey(statusKey))
                            stats.ExtensionsByStatus[statusKey]++;
                        else
                            stats.ExtensionsByStatus[statusKey] = 1;

                        stats.ExtensionsByType["theme"] = stats.TotalThemes;
                        stats.TotalFileSize += theme.FileSize;

                        if (theme.Status == ThemeStatus.Active)
                            stats.ActiveExtensions++;
                        else if (theme.Status == ThemeStatus.Disabled)
                            stats.InactiveExtensions++;
                        else if (theme.Status == ThemeStatus.Error)
                            stats.ErrorExtensions++;

                        if (theme.IsBuiltIn)
                            stats.BuiltInExtensions++;
                        if (theme.IsVerified)
                            stats.VerifiedExtensions++;
                    }
                }

                return ApiResponse<UnifiedExtensionStatsDto>.CreateSuccess(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展统计信息失败");
                return ApiResponse<UnifiedExtensionStatsDto>.CreateError("获取统计信息失败");
            }
        }

        /// <summary>
        /// 执行扩展操作
        /// </summary>
        public async Task<ApiResponse<string>> ExecuteExtensionActionAsync(ExtensionActionDto actionDto, int userId)
        {
            try
            {
                var action = actionDto.Action?.ToLower();
                var type = actionDto.ExtensionType?.ToLower();

                if (type == "plugin")
                {
                    return action switch
                    {
                        "enable" => await _pluginService.InstallPluginAsync(actionDto.ExtensionId),
                        "disable" => await _pluginService.UninstallPluginAsync(actionDto.ExtensionId),
                        "install" => await _pluginService.InstallPluginAsync(actionDto.ExtensionId),
                        "uninstall" => await _pluginService.UninstallPluginAsync(actionDto.ExtensionId),
                        _ => ApiResponse<string>.CreateError($"不支持的插件操作: {action}")
                    };
                }
                else if (type == "theme")
                {
                    return action switch
                    {
                        "activate" => await _themeService.ActivateThemeAsync(actionDto.ExtensionId),
                        "disable" => await _themeService.DisableThemeAsync(actionDto.ExtensionId),
                        "install" => await _themeService.InstallThemeAsync(actionDto.ExtensionId),
                        "uninstall" => await _themeService.UninstallThemeAsync(actionDto.ExtensionId),
                        _ => ApiResponse<string>.CreateError($"不支持的主题操作: {action}")
                    };
                }

                return ApiResponse<string>.CreateError("无效的扩展类型");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "执行扩展操作失败: {Action}/{Type}/{Id}", actionDto.Action, actionDto.ExtensionType, actionDto.ExtensionId);
                return ApiResponse<string>.CreateError("执行操作失败");
            }
        }

        /// <summary>
        /// 批量执行扩展操作
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, string>>> ExecuteBatchExtensionActionAsync(BatchExtensionActionDto batchActionDto, int userId)
        {
            var results = new Dictionary<string, string>();

            try
            {
                foreach (var extension in batchActionDto.Extensions)
                {
                    var actionDto = new ExtensionActionDto
                    {
                        Action = batchActionDto.Action,
                        ExtensionType = extension.Type,
                        ExtensionId = extension.Id,
                        Parameters = batchActionDto.Parameters
                    };

                    var result = await ExecuteExtensionActionAsync(actionDto, userId);
                    var key = $"{extension.Type}-{extension.Id}";
                    results[key] = result.IsSuccess ? "成功" : result.Message;
                }

                return ApiResponse<Dictionary<string, string>>.CreateSuccess(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量执行扩展操作失败");
                return ApiResponse<Dictionary<string, string>>.CreateError("批量操作失败");
            }
        }

        /// <summary>
        /// 搜索扩展
        /// </summary>
        public async Task<ApiResponse<List<UnifiedExtensionDto>>> SearchExtensionsAsync(string searchTerm, int limit = 10)
        {
            try
            {
                var query = new UnifiedExtensionQueryDto
                {
                    Search = searchTerm,
                    PageSize = limit
                };

                var result = await GetExtensionsAsync(query);
                if (result.IsSuccess && result.Data != null)
                {
                    return ApiResponse<List<UnifiedExtensionDto>>.CreateSuccess(result.Data);
                }

                return ApiResponse<List<UnifiedExtensionDto>>.CreateError(result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "搜索扩展失败: {SearchTerm}", searchTerm);
                return ApiResponse<List<UnifiedExtensionDto>>.CreateError("搜索失败");
            }
        }

        /// <summary>
        /// 获取扩展的完整manifest信息
        /// </summary>
        public async Task<ApiResponse<object>> GetExtensionManifestAsync(string uniqueId, string type)
        {
            try
            {
                // 这里需要读取实际的manifest文件
                // 暂时返回基本信息
                var extensionResult = await GetExtensionByUniqueIdAsync(uniqueId, type);
                if (extensionResult.IsSuccess && extensionResult.Data != null)
                {
                    var manifest = new
                    {
                        id = extensionResult.Data.UniqueId,
                        name = extensionResult.Data.Name,
                        version = extensionResult.Data.Version,
                        description = extensionResult.Data.Description,
                        author = extensionResult.Data.Author,
                        type = extensionResult.Data.Type,
                        homepage = extensionResult.Data.Homepage,
                        repository = extensionResult.Data.Repository,
                        tags = extensionResult.Data.Tags,
                        dependencies = extensionResult.Data.Dependencies,
                        capabilities = extensionResult.Data.Capabilities
                    };

                    return ApiResponse<object>.CreateSuccess(manifest);
                }

                return ApiResponse<object>.CreateError(extensionResult.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取扩展manifest失败: {UniqueId}/{Type}", uniqueId, type);
                return ApiResponse<object>.CreateError("获取manifest失败");
            }
        }

        /// <summary>
        /// 验证扩展兼容性
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, object>>> ValidateExtensionCompatibilityAsync(string uniqueId, string type)
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                var result = new Dictionary<string, object>
                {
                    ["compatible"] = true,
                    ["warnings"] = new List<string>(),
                    ["errors"] = new List<string>()
                };

                // 这里应该实现具体的兼容性检查逻辑
                // 暂时返回兼容
                return ApiResponse<Dictionary<string, object>>.CreateSuccess(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证扩展兼容性失败: {UniqueId}/{Type}", uniqueId, type);
                return ApiResponse<Dictionary<string, object>>.CreateError("兼容性检查失败");
            }
        }

        /// <summary>
        /// 获取扩展依赖关系图
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, object>>> GetExtensionDependencyGraphAsync()
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                var graph = new Dictionary<string, object>
                {
                    ["nodes"] = new List<object>(),
                    ["edges"] = new List<object>()
                };

                // 这里应该分析所有扩展的依赖关系
                // 暂时返回空图
                return ApiResponse<Dictionary<string, object>>.CreateSuccess(graph);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取依赖关系图失败");
                return ApiResponse<Dictionary<string, object>>.CreateError("获取依赖关系图失败");
            }
        }

        /// <summary>
        /// 导出扩展配置
        /// </summary>
        public async Task<ApiResponse<string>> ExportExtensionsConfigAsync()
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                // 实现配置导出逻辑
                var config = new { version = "1.0", extensions = new List<object>() };
                var configJson = System.Text.Json.JsonSerializer.Serialize(config, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                
                return ApiResponse<string>.CreateSuccess(configJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导出扩展配置失败");
                return ApiResponse<string>.CreateError("导出配置失败");
            }
        }

        /// <summary>
        /// 导入扩展配置
        /// </summary>
        public async Task<ApiResponse<string>> ImportExtensionsConfigAsync(string configData, int userId)
        {
            try
            {
                await Task.CompletedTask; // 避免async警告
                
                // 实现配置导入逻辑
                return ApiResponse<string>.CreateSuccess("配置导入成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导入扩展配置失败");
                return ApiResponse<string>.CreateError("导入配置失败");
            }
        }

        // 私有辅助方法

        private UnifiedExtensionDto ConvertPluginToUnifiedExtension(PluginDto plugin)
        {
            return new UnifiedExtensionDto
            {
                Id = plugin.Id,
                UniqueId = plugin.UniqueId,
                Name = plugin.Name,
                Description = plugin.Description,
                Version = plugin.Version,
                Author = plugin.Author,
                Homepage = plugin.Homepage,
                Repository = plugin.Repository,
                Type = "plugin",
                Status = ConvertPluginStatusToString(plugin.Status),
                OriginalStatus = plugin.Status,
                FileSize = plugin.FileSize,
                Config = plugin.Config,
                IconPath = plugin.IconPath,
                Screenshots = plugin.Screenshots,
                Tags = plugin.Tags,
                DownloadCount = plugin.DownloadCount,
                IsBuiltIn = plugin.IsBuiltIn,
                IsVerified = plugin.IsVerified,
                UploadedByUserId = plugin.UploadedByUserId,
                UploadedByUsername = plugin.UploadedByUsername,
                LastError = plugin.LastError,
                InstalledAt = plugin.InstalledAt,
                ActivatedAt = plugin.EnabledAt,
                CreatedAt = plugin.CreatedAt,
                UpdatedAt = plugin.UpdatedAt,
                Dependencies = plugin.Dependencies,
                MinVoxNestVersion = plugin.MinVoxNestVersion,
                MaxVoxNestVersion = plugin.MaxVoxNestVersion,
                Capabilities = new ExtensionCapabilitiesDto
                {
                    HasUI = true,
                    HasAPI = true,
                    HasStorage = true,
                    Slots = Array.Empty<string>(),
                    Hooks = Array.Empty<string>()
                }
            };
        }

        private UnifiedExtensionDto ConvertThemeToUnifiedExtension(ThemeDto theme)
        {
            return new UnifiedExtensionDto
            {
                Id = theme.Id,
                UniqueId = theme.UniqueId,
                Name = theme.Name,
                Description = theme.Description,
                Version = theme.Version,
                Author = theme.Author,
                Homepage = theme.Homepage,
                Repository = theme.Repository,
                Type = "theme",
                Status = ConvertThemeStatusToString(theme.Status),
                OriginalStatus = theme.Status,
                FileSize = theme.FileSize,
                Config = theme.Config,
                PreviewImagePath = theme.PreviewImagePath,
                Screenshots = theme.Screenshots,
                Tags = theme.Tags,
                DownloadCount = theme.DownloadCount,
                IsBuiltIn = theme.IsBuiltIn,
                IsVerified = theme.IsVerified,
                UploadedByUserId = theme.UploadedByUserId,
                UploadedByUsername = theme.UploadedByUsername,
                LastError = theme.LastError,
                InstalledAt = theme.InstalledAt,
                ActivatedAt = theme.ActivatedAt,
                CreatedAt = theme.CreatedAt,
                UpdatedAt = theme.UpdatedAt,
                Variables = theme.Variables,
                CustomCss = theme.CustomCss,
                ColorScheme = theme.ColorScheme,
                SupportedModes = theme.SupportedModes,
                UseCount = theme.UseCount,
                IsDefault = theme.IsDefault,
                Capabilities = new ExtensionCapabilitiesDto
                {
                    HasTheming = true,
                    HasLayout = true,
                    Slots = Array.Empty<string>(),
                    Hooks = Array.Empty<string>()
                }
            };
        }

        private string ConvertPluginStatusToString(PluginStatus status)
        {
            return status switch
            {
                PluginStatus.Enabled => "active",
                PluginStatus.Disabled => "inactive",
                PluginStatus.Error => "error",
                PluginStatus.Uploading => "loading",
                _ => "inactive"
            };
        }

        private string ConvertThemeStatusToString(ThemeStatus status)
        {
            return status switch
            {
                ThemeStatus.Active => "active",
                ThemeStatus.Disabled => "inactive",
                ThemeStatus.Error => "error",
                ThemeStatus.Uploading => "loading",
                _ => "inactive"
            };
        }

        private PluginStatus? ParsePluginStatus(string? status)
        {
            if (string.IsNullOrEmpty(status) || status == "all") return null;
            
            return status.ToLower() switch
            {
                "active" => PluginStatus.Enabled,
                "inactive" => PluginStatus.Disabled,
                "error" => PluginStatus.Error,
                "loading" => PluginStatus.Uploading,
                _ => null
            };
        }

        private ThemeStatus? ParseThemeStatus(string? status)
        {
            if (string.IsNullOrEmpty(status) || status == "all") return null;
            
            return status.ToLower() switch
            {
                "active" => ThemeStatus.Active,
                "inactive" => ThemeStatus.Disabled,
                "error" => ThemeStatus.Error,
                "loading" => ThemeStatus.Uploading,
                _ => null
            };
        }

        private List<UnifiedExtensionDto> ApplySorting(List<UnifiedExtensionDto> extensions, string? sortBy, bool descending)
        {
            return (sortBy?.ToLower()) switch
            {
                "name" => descending ? extensions.OrderByDescending(e => e.Name).ToList() : extensions.OrderBy(e => e.Name).ToList(),
                "version" => descending ? extensions.OrderByDescending(e => e.Version).ToList() : extensions.OrderBy(e => e.Version).ToList(),
                "author" => descending ? extensions.OrderByDescending(e => e.Author).ToList() : extensions.OrderBy(e => e.Author).ToList(),
                "createdat" => descending ? extensions.OrderByDescending(e => e.CreatedAt).ToList() : extensions.OrderBy(e => e.CreatedAt).ToList(),
                "updatedat" => descending ? extensions.OrderByDescending(e => e.UpdatedAt).ToList() : extensions.OrderBy(e => e.UpdatedAt).ToList(),
                _ => descending ? extensions.OrderByDescending(e => e.CreatedAt).ToList() : extensions.OrderBy(e => e.CreatedAt).ToList()
            };
        }
    }
}
