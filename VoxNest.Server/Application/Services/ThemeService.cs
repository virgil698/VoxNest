/**
 * 主题管理服务实现
 */

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text.Json;
using VoxNest.Server.Application.DTOs.Extension;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.Extension;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services
{
    public class ThemeService : IThemeService
    {
        private readonly VoxNestDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ThemeService> _logger;
        private readonly string ThemesDirectory;
        private readonly string FrontendThemesDirectory;
        
        public ThemeService(
            VoxNestDbContext context,
            IMapper mapper,
            ILogger<ThemeService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            
            // 设置主题目录路径
            ThemesDirectory = Path.Combine("wwwroot", "uploads", "themes");
            FrontendThemesDirectory = configuration["Frontend:ThemesPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "themes");
            
            // 确保目录存在
            Directory.CreateDirectory(ThemesDirectory);
            Directory.CreateDirectory(FrontendThemesDirectory);
        }

        public async Task<PagedResult<ThemeDto>> GetThemesAsync(ThemeQueryDto query)
        {
            try
            {
                var queryable = _context.Themes
                    .Include(t => t.UploadedBy)
                    .AsQueryable();

                // 搜索过滤
                if (!string.IsNullOrEmpty(query.Search))
                {
                    var search = query.Search.ToLower();
                    queryable = queryable.Where(t => 
                        t.Name.ToLower().Contains(search) ||
                        (t.Description != null && t.Description.ToLower().Contains(search)) ||
                        t.Author.ToLower().Contains(search) ||
                        (t.Tags != null && t.Tags.ToLower().Contains(search)));
                }

                if (query.Status.HasValue)
                {
                    queryable = queryable.Where(t => t.Status == query.Status.Value);
                }

                if (query.Type.HasValue)
                {
                    queryable = queryable.Where(t => t.Type == query.Type.Value);
                }

                if (query.IsBuiltIn.HasValue)
                {
                    queryable = queryable.Where(t => t.IsBuiltIn == query.IsBuiltIn.Value);
                }

                if (query.IsVerified.HasValue)
                {
                    queryable = queryable.Where(t => t.IsVerified == query.IsVerified.Value);
                }

                var totalCount = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var themeDtos = _mapper.Map<List<ThemeDto>>(items);
                
                // 手动映射用户名
                foreach (var dto in themeDtos)
                {
                    var theme = items.First(t => t.Id == dto.Id);
                    dto.UploadedByUsername = theme.UploadedBy?.Username;
                }

                return PagedResult<ThemeDto>.Success(themeDtos, totalCount, query.Page, query.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题列表时发生错误");
                return PagedResult<ThemeDto>.Failure("获取主题列表失败");
            }
        }

        public async Task<ApiResponse<ThemeDto>> GetThemeByIdAsync(int id)
        {
            try
            {
                var theme = await _context.Themes
                    .Include(t => t.UploadedBy)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (theme == null)
                {
                    return ApiResponse<ThemeDto>.CreateError("主题不存在");
                }

                var dto = _mapper.Map<ThemeDto>(theme);
                dto.UploadedByUsername = theme.UploadedBy?.Username;

                return ApiResponse<ThemeDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题详情时发生错误: {ThemeId}", id);
                return ApiResponse<ThemeDto>.CreateError("获取主题详情失败");
            }
        }

        public async Task<ApiResponse<ThemeDto>> GetThemeByUniqueIdAsync(string uniqueId)
        {
            try
            {
                var theme = await _context.Themes
                    .Include(t => t.UploadedBy)
                    .FirstOrDefaultAsync(t => t.UniqueId == uniqueId);

                if (theme == null)
                {
                    return ApiResponse<ThemeDto>.CreateError("主题不存在");
                }

                var dto = _mapper.Map<ThemeDto>(theme);
                dto.UploadedByUsername = theme.UploadedBy?.Username;

                return ApiResponse<ThemeDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题详情时发生错误: {UniqueId}", uniqueId);
                return ApiResponse<ThemeDto>.CreateError("获取主题详情失败");
            }
        }

        public async Task<ApiResponse<ThemeDto>> CreateThemeAsync(CreateThemeDto createDto, int userId)
        {
            try
            {
                if (await _context.Themes.AnyAsync(t => t.UniqueId == createDto.UniqueId))
                {
                    return ApiResponse<ThemeDto>.CreateError("主题唯一标识符已存在");
                }

                var theme = _mapper.Map<Theme>(createDto);
                theme.UploadedByUserId = userId;
                theme.Status = ThemeStatus.Uploaded;
                theme.CreatedAt = DateTime.UtcNow;
                theme.UpdatedAt = DateTime.UtcNow;

                _context.Themes.Add(theme);
                await _context.SaveChangesAsync();

                var dto = _mapper.Map<ThemeDto>(theme);
                return ApiResponse<ThemeDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建主题时发生错误");
                return ApiResponse<ThemeDto>.CreateError("创建主题失败");
            }
        }

        public async Task<ApiResponse<ThemeDto>> UpdateThemeAsync(int id, UpdateThemeDto updateDto)
        {
            try
            {
                var theme = await _context.Themes.FindAsync(id);
                if (theme == null)
                {
                    return ApiResponse<ThemeDto>.CreateError("主题不存在");
                }

                // 更新非空字段
                if (!string.IsNullOrEmpty(updateDto.Name))
                    theme.Name = updateDto.Name;
                
                if (updateDto.Description != null)
                    theme.Description = updateDto.Description;
                
                if (!string.IsNullOrEmpty(updateDto.Homepage))
                    theme.Homepage = updateDto.Homepage;
                
                if (!string.IsNullOrEmpty(updateDto.Repository))
                    theme.Repository = updateDto.Repository;
                
                if (!string.IsNullOrEmpty(updateDto.Config))
                    theme.Config = updateDto.Config;
                
                if (!string.IsNullOrEmpty(updateDto.Variables))
                    theme.Variables = updateDto.Variables;
                
                if (!string.IsNullOrEmpty(updateDto.CustomCss))
                    theme.CustomCss = updateDto.CustomCss;
                
                if (!string.IsNullOrEmpty(updateDto.Tags))
                    theme.Tags = updateDto.Tags;
                
                if (!string.IsNullOrEmpty(updateDto.ColorScheme))
                    theme.ColorScheme = updateDto.ColorScheme;
                
                if (!string.IsNullOrEmpty(updateDto.SupportedModes))
                    theme.SupportedModes = updateDto.SupportedModes;
                
                if (updateDto.IsDefault.HasValue)
                    theme.IsDefault = updateDto.IsDefault.Value;
                
                if (updateDto.IsVerified.HasValue)
                    theme.IsVerified = updateDto.IsVerified.Value;

                theme.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var dto = _mapper.Map<ThemeDto>(theme);
                return ApiResponse<ThemeDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新主题时发生错误: {ThemeId}", id);
                return ApiResponse<ThemeDto>.CreateError("更新主题失败");
            }
        }

        public async Task<ApiResponse<ThemeDto>> UploadThemeAsync(ThemeUploadDto uploadDto, int userId)
        {
            try
            {
                var validationResult = await ValidateThemeFileAsync(uploadDto.ThemeFile);
                if (!validationResult.IsSuccess)
                {
                    return ApiResponse<ThemeDto>.CreateError(validationResult.Message);
                }

                // 解析主题信息或生成默认信息
                var themeId = $"uploaded_{Guid.NewGuid():N}";
                var themeName = Path.GetFileNameWithoutExtension(uploadDto.ThemeFile.FileName);
                
                // 保存文件到后端存储
                var fileName = $"{themeId}_{DateTime.UtcNow:yyyyMMddHHmmss}.zip";
                var filePath = Path.Combine(ThemesDirectory, fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await uploadDto.ThemeFile.CopyToAsync(stream);
                }

                // 解压主题到前端目录
                var frontendThemePath = await ExtractThemeToFrontendAsync(filePath, themeId);
                
                var theme = new Theme
                {
                    UniqueId = themeId,
                    Name = themeName,
                    Description = uploadDto.Description,
                    Version = "1.0.0",
                    Author = "Unknown",
                    Type = ThemeType.Complete,
                    Status = ThemeStatus.Uploaded,
                    FilePath = filePath,
                    FileSize = uploadDto.ThemeFile.Length,
                    Tags = uploadDto.Tags,
                    IsDefault = uploadDto.SetAsDefault,
                    UploadedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Themes.Add(theme);
                await _context.SaveChangesAsync();

                var dto = _mapper.Map<ThemeDto>(theme);
                return ApiResponse<ThemeDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "上传主题时发生错误");
                return ApiResponse<ThemeDto>.CreateError("上传主题失败");
            }
        }

        public async Task<ApiResponse<string>> InstallThemeAsync(int id)
        {
            try
            {
                var theme = await _context.Themes.FindAsync(id);
                if (theme == null)
                {
                    return ApiResponse<string>.CreateError("主题不存在");
                }

                theme.Status = ThemeStatus.Installed;
                theme.InstalledAt = DateTime.UtcNow;
                theme.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("主题安装成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装主题时发生错误: {ThemeId}", id);
                return ApiResponse<string>.CreateError("安装主题失败");
            }
        }

        public async Task<ApiResponse<string>> ActivateThemeAsync(int id)
        {
            try
            {
                // 先禁用所有激活的主题
                var activeThemes = await _context.Themes
                    .Where(t => t.Status == ThemeStatus.Active)
                    .ToListAsync();

                foreach (var theme in activeThemes)
                {
                    theme.Status = ThemeStatus.Installed;
                    theme.UpdatedAt = DateTime.UtcNow;
                }

                // 激活指定主题
                var targetTheme = await _context.Themes.FindAsync(id);
                if (targetTheme == null)
                {
                    return ApiResponse<string>.CreateError("主题不存在");
                }

                targetTheme.Status = ThemeStatus.Active;
                targetTheme.ActivatedAt = DateTime.UtcNow;
                targetTheme.UpdatedAt = DateTime.UtcNow;
                targetTheme.UseCount += 1;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("主题已激活");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "激活主题时发生错误: {ThemeId}", id);
                return ApiResponse<string>.CreateError("激活主题失败");
            }
        }

        public async Task<ApiResponse<string>> DisableThemeAsync(int id)
        {
            try
            {
                var theme = await _context.Themes.FindAsync(id);
                if (theme == null)
                {
                    return ApiResponse<string>.CreateError("主题不存在");
                }

                if (theme.IsDefault)
                {
                    return ApiResponse<string>.CreateError("不能禁用默认主题");
                }

                theme.Status = ThemeStatus.Disabled;
                theme.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("主题已禁用");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "禁用主题时发生错误: {ThemeId}", id);
                return ApiResponse<string>.CreateError("禁用主题失败");
            }
        }

        public async Task<ApiResponse<string>> UninstallThemeAsync(int id)
        {
            try
            {
                var theme = await _context.Themes.FindAsync(id);
                if (theme == null)
                {
                    return ApiResponse<string>.CreateError("主题不存在");
                }

                if (theme.IsDefault)
                {
                    return ApiResponse<string>.CreateError("不能卸载默认主题");
                }

                theme.Status = ThemeStatus.Uninstalled;
                theme.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("主题已卸载");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载主题时发生错误: {ThemeId}", id);
                return ApiResponse<string>.CreateError("卸载主题失败");
            }
        }

        public async Task<ApiResponse<string>> DeleteThemeAsync(int id)
        {
            try
            {
                var theme = await _context.Themes.FindAsync(id);
                if (theme == null)
                {
                    return ApiResponse<string>.CreateError("主题不存在");
                }

                if (theme.IsDefault)
                {
                    return ApiResponse<string>.CreateError("不能删除默认主题");
                }

                _context.Themes.Remove(theme);
                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("主题已删除");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除主题时发生错误: {ThemeId}", id);
                return ApiResponse<string>.CreateError("删除主题失败");
            }
        }

        public async Task<ApiResponse<ThemeDto>> GetActiveThemeAsync()
        {
            try
            {
                var theme = await _context.Themes
                    .FirstOrDefaultAsync(t => t.Status == ThemeStatus.Active);

                if (theme == null)
                {
                    return ApiResponse<ThemeDto>.CreateError("没有激活的主题");
                }

                var dto = _mapper.Map<ThemeDto>(theme);
                return ApiResponse<ThemeDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取当前激活主题时发生错误");
                return ApiResponse<ThemeDto>.CreateError("获取当前激活主题失败");
            }
        }

        public async Task<ApiResponse<List<ThemePreviewDto>>> GetThemePreviewsAsync()
        {
            try
            {
                var themes = await _context.Themes
                    .Where(t => t.Status == ThemeStatus.Installed || t.Status == ThemeStatus.Active)
                    .Select(t => new ThemePreviewDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        PreviewImagePath = t.PreviewImagePath,
                        Variables = t.Variables,
                        ColorScheme = t.ColorScheme,
                        SupportedModes = t.SupportedModes
                    })
                    .ToListAsync();

                return ApiResponse<List<ThemePreviewDto>>.CreateSuccess(themes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题预览列表时发生错误");
                return ApiResponse<List<ThemePreviewDto>>.CreateError("获取主题预览列表失败");
            }
        }

        public async Task<ApiResponse<ThemeStatsDto>> GetThemeStatsAsync()
        {
            try
            {
                var stats = new ThemeStatsDto
                {
                    TotalThemes = await _context.Themes.CountAsync(),
                    ActiveThemes = await _context.Themes.CountAsync(t => t.Status == ThemeStatus.Active),
                    DisabledThemes = await _context.Themes.CountAsync(t => t.Status == ThemeStatus.Disabled),
                    ErrorThemes = await _context.Themes.CountAsync(t => t.Status == ThemeStatus.Error),
                    BuiltInThemes = await _context.Themes.CountAsync(t => t.IsBuiltIn),
                    VerifiedThemes = await _context.Themes.CountAsync(t => t.IsVerified),
                    TotalFileSize = await _context.Themes.SumAsync(t => t.FileSize)
                };

                var currentActiveTheme = await _context.Themes
                    .Where(t => t.Status == ThemeStatus.Active)
                    .Select(t => t.Name)
                    .FirstOrDefaultAsync();

                stats.CurrentActiveTheme = currentActiveTheme;

                return ApiResponse<ThemeStatsDto>.CreateSuccess(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取主题统计信息时发生错误");
                return ApiResponse<ThemeStatsDto>.CreateError("获取主题统计信息失败");
            }
        }

        public async Task<ApiResponse<ThemePreviewDto>> PreviewThemeAsync(int id)
        {
            try
            {
                var theme = await _context.Themes.FindAsync(id);
                if (theme == null)
                {
                    return ApiResponse<ThemePreviewDto>.CreateError("主题不存在");
                }

                var preview = new ThemePreviewDto
                {
                    Id = theme.Id,
                    Name = theme.Name,
                    PreviewImagePath = theme.PreviewImagePath,
                    Variables = theme.Variables,
                    ColorScheme = theme.ColorScheme,
                    SupportedModes = theme.SupportedModes
                };

                return ApiResponse<ThemePreviewDto>.CreateSuccess(preview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "预览主题时发生错误: {ThemeId}", id);
                return ApiResponse<ThemePreviewDto>.CreateError("预览主题失败");
            }
        }

        public async Task<ApiResponse<string>> ResetToDefaultThemeAsync()
        {
            try
            {
                var defaultTheme = await _context.Themes
                    .FirstOrDefaultAsync(t => t.IsDefault);

                if (defaultTheme == null)
                {
                    return ApiResponse<string>.CreateError("找不到默认主题");
                }

                return await ActivateThemeAsync(defaultTheme.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置为默认主题时发生错误");
                return ApiResponse<string>.CreateError("重置为默认主题失败");
            }
        }

        public async Task<ApiResponse<string>> BatchUpdateThemeStatusAsync(List<int> themeIds, ThemeStatus status)
        {
            try
            {
                var themes = await _context.Themes
                    .Where(t => themeIds.Contains(t.Id))
                    .ToListAsync();

                foreach (var theme in themes)
                {
                    if (!theme.IsDefault || status != ThemeStatus.Disabled)
                    {
                        theme.Status = status;
                        theme.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess($"已更新 {themes.Count} 个主题的状态");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新主题状态时发生错误");
                return ApiResponse<string>.CreateError("批量更新主题状态失败");
            }
        }

        public Task<ApiResponse<string>> ValidateThemeFileAsync(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return Task.FromResult(ApiResponse<string>.CreateError("文件不能为空"));
                }

                if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(ApiResponse<string>.CreateError("主题文件必须是ZIP格式"));
                }

                if (file.Length > 20 * 1024 * 1024) // 20MB限制
                {
                    return Task.FromResult(ApiResponse<string>.CreateError("主题文件大小不能超过20MB"));
                }

                return Task.FromResult(ApiResponse<string>.CreateSuccess("文件验证通过"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证主题文件时发生错误");
                return Task.FromResult(ApiResponse<string>.CreateError("文件验证失败"));
            }
        }

        // 简化实现的方法
        public Task<ApiResponse<byte[]>> ExportThemeConfigAsync(int id)
        {
            return Task.FromResult(ApiResponse<byte[]>.CreateError("功能暂未实现"));
        }

        public Task<ApiResponse<string>> ImportThemeConfigAsync(int id, IFormFile configFile)
        {
            return Task.FromResult(ApiResponse<string>.CreateError("功能暂未实现"));
        }

        public Task<ApiResponse<string>> CustomizeThemeVariablesAsync(int id, Dictionary<string, string> variables)
        {
            return Task.FromResult(ApiResponse<string>.CreateError("功能暂未实现"));
        }

        public Task<ApiResponse<Dictionary<string, object>>> GetThemeVariableDefinitionsAsync(int id)
        {
            return Task.FromResult(ApiResponse<Dictionary<string, object>>.CreateError("功能暂未实现"));
        }

        private Task<string> ExtractThemeToFrontendAsync(string zipFilePath, string themeId)
        {
            try
            {
                var themeDirectory = Path.Combine(FrontendThemesDirectory, themeId);
                
                // 如果目录已存在，先删除
                if (Directory.Exists(themeDirectory))
                {
                    Directory.Delete(themeDirectory, true);
                }
                
                // 创建主题目录
                Directory.CreateDirectory(themeDirectory);
                
                // 解压ZIP文件
                using (var archive = ZipFile.OpenRead(zipFilePath))
                {
                    foreach (var entry in archive.Entries)
                    {
                        // 跳过目录条目
                        if (string.IsNullOrEmpty(entry.Name))
                            continue;
                            
                        var destinationPath = Path.Combine(themeDirectory, entry.FullName);
                        var destinationDir = Path.GetDirectoryName(destinationPath);
                        
                        if (!string.IsNullOrEmpty(destinationDir))
                        {
                            Directory.CreateDirectory(destinationDir);
                        }
                        
                        entry.ExtractToFile(destinationPath, true);
                    }
                }
                
                _logger.LogInformation($"Theme {themeId} extracted to frontend directory: {themeDirectory}");
                return Task.FromResult(themeDirectory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to extract theme {themeId} to frontend directory");
                throw;
            }
        }
    }
}
