/**
 * 插件管理服务实现
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
    public class PluginService : IPluginService
    {
        private readonly VoxNestDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<PluginService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string PluginsDirectory;
        private readonly string FrontendPluginsDirectory;
        
        public PluginService(
            VoxNestDbContext context,
            IMapper mapper,
            ILogger<PluginService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _configuration = configuration;
            
            // 设置插件目录路径
            PluginsDirectory = Path.Combine("wwwroot", "uploads", "plugins");
            FrontendPluginsDirectory = _configuration["Frontend:ExtensionsPath"] ?? 
                Path.Combine("..", "voxnest.client", "public", "extensions", "plugins");
            
            // 确保目录存在
            Directory.CreateDirectory(PluginsDirectory);
            Directory.CreateDirectory(FrontendPluginsDirectory);
        }

        public async Task<PagedResult<PluginDto>> GetPluginsAsync(PluginQueryDto query)
        {
            try
            {
                var queryable = _context.Plugins
                    .Include(p => p.UploadedBy)
                    .AsQueryable();

                // 搜索过滤
                if (!string.IsNullOrEmpty(query.Search))
                {
                    var search = query.Search.ToLower();
                    queryable = queryable.Where(p => 
                        p.Name.ToLower().Contains(search) ||
                        (p.Description != null && p.Description.ToLower().Contains(search)) ||
                        p.Author.ToLower().Contains(search) ||
                        (p.Tags != null && p.Tags.ToLower().Contains(search)));
                }

                // 状态过滤
                if (query.Status.HasValue)
                {
                    queryable = queryable.Where(p => p.Status == query.Status.Value);
                }

                // 类型过滤
                if (query.Type.HasValue)
                {
                    queryable = queryable.Where(p => p.Type == query.Type.Value);
                }

                // 内置插件过滤
                if (query.IsBuiltIn.HasValue)
                {
                    queryable = queryable.Where(p => p.IsBuiltIn == query.IsBuiltIn.Value);
                }

                // 验证状态过滤
                if (query.IsVerified.HasValue)
                {
                    queryable = queryable.Where(p => p.IsVerified == query.IsVerified.Value);
                }

                // 标签过滤
                if (!string.IsNullOrEmpty(query.Tags))
                {
                    queryable = queryable.Where(p => p.Tags != null && p.Tags.Contains(query.Tags));
                }

                // 排序
                queryable = query.SortBy?.ToLower() switch
                {
                    "name" => query.SortDescending ? queryable.OrderByDescending(p => p.Name) : queryable.OrderBy(p => p.Name),
                    "author" => query.SortDescending ? queryable.OrderByDescending(p => p.Author) : queryable.OrderBy(p => p.Author),
                    "version" => query.SortDescending ? queryable.OrderByDescending(p => p.Version) : queryable.OrderBy(p => p.Version),
                    "downloadcount" => query.SortDescending ? queryable.OrderByDescending(p => p.DownloadCount) : queryable.OrderBy(p => p.DownloadCount),
                    "updatedat" => query.SortDescending ? queryable.OrderByDescending(p => p.UpdatedAt) : queryable.OrderBy(p => p.UpdatedAt),
                    _ => query.SortDescending ? queryable.OrderByDescending(p => p.CreatedAt) : queryable.OrderBy(p => p.CreatedAt)
                };

                var totalCount = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var pluginDtos = _mapper.Map<List<PluginDto>>(items);
                
                // 手动映射用户名
                foreach (var dto in pluginDtos)
                {
                    var plugin = items.First(p => p.Id == dto.Id);
                    dto.UploadedByUsername = plugin.UploadedBy?.Username;
                }

                return PagedResult<PluginDto>.Success(pluginDtos, totalCount, query.Page, query.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件列表时发生错误");
                return PagedResult<PluginDto>.Failure("获取插件列表失败");
            }
        }

        public async Task<ApiResponse<PluginDto>> GetPluginByIdAsync(int id)
        {
            try
            {
                var plugin = await _context.Plugins
                    .Include(p => p.UploadedBy)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (plugin == null)
                {
                    return ApiResponse<PluginDto>.CreateError("插件不存在");
                }

                var dto = _mapper.Map<PluginDto>(plugin);
                dto.UploadedByUsername = plugin.UploadedBy?.Username;

                return ApiResponse<PluginDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件详情时发生错误: {PluginId}", id);
                return ApiResponse<PluginDto>.CreateError("获取插件详情失败");
            }
        }

        public async Task<ApiResponse<PluginDto>> GetPluginByUniqueIdAsync(string uniqueId)
        {
            try
            {
                var plugin = await _context.Plugins
                    .Include(p => p.UploadedBy)
                    .FirstOrDefaultAsync(p => p.UniqueId == uniqueId);

                if (plugin == null)
                {
                    return ApiResponse<PluginDto>.CreateError("插件不存在");
                }

                var dto = _mapper.Map<PluginDto>(plugin);
                dto.UploadedByUsername = plugin.UploadedBy?.Username;

                return ApiResponse<PluginDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件详情时发生错误: {UniqueId}", uniqueId);
                return ApiResponse<PluginDto>.CreateError("获取插件详情失败");
            }
        }

        public async Task<ApiResponse<PluginDto>> CreatePluginAsync(CreatePluginDto createDto, int userId)
        {
            try
            {
                // 检查唯一ID是否已存在
                if (await _context.Plugins.AnyAsync(p => p.UniqueId == createDto.UniqueId))
                {
                    return ApiResponse<PluginDto>.CreateError("插件唯一标识符已存在");
                }

                var plugin = _mapper.Map<Plugin>(createDto);
                plugin.UploadedByUserId = userId;
                plugin.Status = PluginStatus.Uploaded;
                plugin.CreatedAt = DateTime.UtcNow;
                plugin.UpdatedAt = DateTime.UtcNow;

                _context.Plugins.Add(plugin);
                await _context.SaveChangesAsync();

                var dto = _mapper.Map<PluginDto>(plugin);
                return ApiResponse<PluginDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建插件时发生错误");
                return ApiResponse<PluginDto>.CreateError("创建插件失败");
            }
        }

        public async Task<ApiResponse<PluginDto>> UpdatePluginAsync(int id, UpdatePluginDto updateDto)
        {
            try
            {
                var plugin = await _context.Plugins.FindAsync(id);
                if (plugin == null)
                {
                    return ApiResponse<PluginDto>.CreateError("插件不存在");
                }

                // 更新非空字段
                if (!string.IsNullOrEmpty(updateDto.Name))
                    plugin.Name = updateDto.Name;
                
                if (updateDto.Description != null)
                    plugin.Description = updateDto.Description;
                
                if (!string.IsNullOrEmpty(updateDto.Homepage))
                    plugin.Homepage = updateDto.Homepage;
                
                if (!string.IsNullOrEmpty(updateDto.Repository))
                    plugin.Repository = updateDto.Repository;
                
                if (!string.IsNullOrEmpty(updateDto.Config))
                    plugin.Config = updateDto.Config;
                
                if (!string.IsNullOrEmpty(updateDto.Tags))
                    plugin.Tags = updateDto.Tags;
                
                if (updateDto.IsVerified.HasValue)
                    plugin.IsVerified = updateDto.IsVerified.Value;

                plugin.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var dto = _mapper.Map<PluginDto>(plugin);
                return ApiResponse<PluginDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新插件时发生错误: {PluginId}", id);
                return ApiResponse<PluginDto>.CreateError("更新插件失败");
            }
        }

        public async Task<ApiResponse<PluginDto>> UploadPluginAsync(PluginUploadDto uploadDto, int userId)
        {
            try
            {
                // 验证文件
                var validationResult = await ValidatePluginFileAsync(uploadDto.PluginFile);
                if (!validationResult.IsSuccess)
                {
                    return ApiResponse<PluginDto>.CreateError(validationResult.Message);
                }

                // 解析插件信息
                var pluginInfo = await ExtractPluginInfoAsync(uploadDto.PluginFile);
                if (pluginInfo == null)
                {
                    return ApiResponse<PluginDto>.CreateError("无法解析插件信息");
                }

                // 检查插件是否已存在
                var existingPlugin = await _context.Plugins
                    .FirstOrDefaultAsync(p => p.UniqueId == pluginInfo.UniqueId);

                if (existingPlugin != null)
                {
                    return ApiResponse<PluginDto>.CreateError("相同标识符的插件已存在");
                }

                // 保存文件到后端存储
                var fileName = $"{pluginInfo.UniqueId}_{pluginInfo.Version}_{Guid.NewGuid():N}.zip";
                var filePath = Path.Combine(PluginsDirectory, fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await uploadDto.PluginFile.CopyToAsync(stream);
                }

                // 解压插件到前端目录
                var frontendPluginPath = await ExtractPluginToFrontendAsync(filePath, pluginInfo.UniqueId);
                
                // 计算文件哈希
                var fileHash = await CalculateFileHashAsync(filePath);

                // 创建插件记录
                var plugin = new Plugin
                {
                    UniqueId = pluginInfo.UniqueId,
                    Name = pluginInfo.Name,
                    Description = uploadDto.Description ?? pluginInfo.Description,
                    Version = pluginInfo.Version,
                    Author = pluginInfo.Author,
                    Homepage = pluginInfo.Homepage,
                    Repository = pluginInfo.Repository,
                    Type = pluginInfo.Type,
                    Status = PluginStatus.Uploaded,
                    FilePath = filePath,
                    FileSize = uploadDto.PluginFile.Length,
                    FileHash = fileHash,
                    Config = pluginInfo.Config,
                    Dependencies = pluginInfo.Dependencies,
                    MinVoxNestVersion = pluginInfo.MinVoxNestVersion,
                    MaxVoxNestVersion = pluginInfo.MaxVoxNestVersion,
                    Tags = uploadDto.Tags ?? pluginInfo.Tags,
                    UploadedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Plugins.Add(plugin);
                await _context.SaveChangesAsync();

                var dto = _mapper.Map<PluginDto>(plugin);
                return ApiResponse<PluginDto>.CreateSuccess(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "上传插件时发生错误");
                return ApiResponse<PluginDto>.CreateError("上传插件失败");
            }
        }

        public async Task<ApiResponse<string>> InstallPluginAsync(int id)
        {
            try
            {
                var plugin = await _context.Plugins.FindAsync(id);
                if (plugin == null)
                {
                    return ApiResponse<string>.CreateError("插件不存在");
                }

                if (plugin.Status == PluginStatus.Installed || plugin.Status == PluginStatus.Enabled)
                {
                    return ApiResponse<string>.CreateError("插件已安装");
                }

                // TODO: 实际的插件安装逻辑
                plugin.Status = PluginStatus.Installed;
                plugin.InstalledAt = DateTime.UtcNow;
                plugin.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("插件安装成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "安装插件时发生错误: {PluginId}", id);
                return ApiResponse<string>.CreateError("安装插件失败");
            }
        }

        public async Task<ApiResponse<string>> EnablePluginAsync(int id)
        {
            try
            {
                var plugin = await _context.Plugins.FindAsync(id);
                if (plugin == null)
                {
                    return ApiResponse<string>.CreateError("插件不存在");
                }

                if (plugin.Status != PluginStatus.Installed && plugin.Status != PluginStatus.Disabled)
                {
                    return ApiResponse<string>.CreateError("插件必须先安装");
                }

                plugin.Status = PluginStatus.Enabled;
                plugin.EnabledAt = DateTime.UtcNow;
                plugin.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("插件已启用");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "启用插件时发生错误: {PluginId}", id);
                return ApiResponse<string>.CreateError("启用插件失败");
            }
        }

        public async Task<ApiResponse<string>> DisablePluginAsync(int id)
        {
            try
            {
                var plugin = await _context.Plugins.FindAsync(id);
                if (plugin == null)
                {
                    return ApiResponse<string>.CreateError("插件不存在");
                }

                if (plugin.IsBuiltIn)
                {
                    return ApiResponse<string>.CreateError("不能禁用内置插件");
                }

                plugin.Status = PluginStatus.Disabled;
                plugin.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("插件已禁用");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "禁用插件时发生错误: {PluginId}", id);
                return ApiResponse<string>.CreateError("禁用插件失败");
            }
        }

        public async Task<ApiResponse<string>> UninstallPluginAsync(int id)
        {
            try
            {
                var plugin = await _context.Plugins.FindAsync(id);
                if (plugin == null)
                {
                    return ApiResponse<string>.CreateError("插件不存在");
                }

                if (plugin.IsBuiltIn)
                {
                    return ApiResponse<string>.CreateError("不能卸载内置插件");
                }

                plugin.Status = PluginStatus.Uninstalled;
                plugin.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("插件已卸载");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "卸载插件时发生错误: {PluginId}", id);
                return ApiResponse<string>.CreateError("卸载插件失败");
            }
        }

        public async Task<ApiResponse<string>> DeletePluginAsync(int id)
        {
            try
            {
                var plugin = await _context.Plugins.FindAsync(id);
                if (plugin == null)
                {
                    return ApiResponse<string>.CreateError("插件不存在");
                }

                if (plugin.IsBuiltIn)
                {
                    return ApiResponse<string>.CreateError("不能删除内置插件");
                }

                // 删除文件
                if (!string.IsNullOrEmpty(plugin.FilePath) && File.Exists(plugin.FilePath))
                {
                    File.Delete(plugin.FilePath);
                }

                _context.Plugins.Remove(plugin);
                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess("插件已删除");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除插件时发生错误: {PluginId}", id);
                return ApiResponse<string>.CreateError("删除插件失败");
            }
        }

        public async Task<ApiResponse<List<PluginVersionDto>>> GetPluginVersionsAsync(int pluginId)
        {
            try
            {
                var versions = await _context.PluginVersions
                    .Where(v => v.PluginId == pluginId)
                    .OrderByDescending(v => v.CreatedAt)
                    .ToListAsync();

                var dtos = _mapper.Map<List<PluginVersionDto>>(versions);
                return ApiResponse<List<PluginVersionDto>>.CreateSuccess(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件版本列表时发生错误: {PluginId}", pluginId);
                return ApiResponse<List<PluginVersionDto>>.CreateError("获取插件版本列表失败");
            }
        }

        public async Task<ApiResponse<PluginStatsDto>> GetPluginStatsAsync()
        {
            try
            {
                var stats = new PluginStatsDto
                {
                    TotalPlugins = await _context.Plugins.CountAsync(),
                    EnabledPlugins = await _context.Plugins.CountAsync(p => p.Status == PluginStatus.Enabled),
                    DisabledPlugins = await _context.Plugins.CountAsync(p => p.Status == PluginStatus.Disabled),
                    ErrorPlugins = await _context.Plugins.CountAsync(p => p.Status == PluginStatus.Error),
                    BuiltInPlugins = await _context.Plugins.CountAsync(p => p.IsBuiltIn),
                    VerifiedPlugins = await _context.Plugins.CountAsync(p => p.IsVerified),
                    TotalFileSize = await _context.Plugins.SumAsync(p => p.FileSize)
                };

                // 按类型统计
                var pluginsByType = await _context.Plugins
                    .GroupBy(p => p.Type)
                    .Select(g => new { Type = g.Key, Count = g.Count() })
                    .ToListAsync();

                foreach (var item in pluginsByType)
                {
                    stats.PluginsByType[item.Type] = item.Count;
                }

                // 按状态统计
                var pluginsByStatus = await _context.Plugins
                    .GroupBy(p => p.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                foreach (var item in pluginsByStatus)
                {
                    stats.PluginsByStatus[item.Status] = item.Count;
                }

                return ApiResponse<PluginStatsDto>.CreateSuccess(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取插件统计信息时发生错误");
                return ApiResponse<PluginStatsDto>.CreateError("获取插件统计信息失败");
            }
        }

        public async Task<ApiResponse<List<PluginDto>>> GetEnabledPluginsAsync()
        {
            try
            {
                var plugins = await _context.Plugins
                    .Where(p => p.Status == PluginStatus.Enabled)
                    .OrderBy(p => p.Name)
                    .ToListAsync();

                var dtos = _mapper.Map<List<PluginDto>>(plugins);
                return ApiResponse<List<PluginDto>>.CreateSuccess(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取已启用插件列表时发生错误");
                return ApiResponse<List<PluginDto>>.CreateError("获取已启用插件列表失败");
            }
        }

        public async Task<ApiResponse<string>> BatchUpdatePluginStatusAsync(List<int> pluginIds, PluginStatus status)
        {
            try
            {
                var plugins = await _context.Plugins
                    .Where(p => pluginIds.Contains(p.Id))
                    .ToListAsync();

                foreach (var plugin in plugins)
                {
                    if (!plugin.IsBuiltIn || status != PluginStatus.Disabled)
                    {
                        plugin.Status = status;
                        plugin.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                return ApiResponse<string>.CreateSuccess($"已更新 {plugins.Count} 个插件的状态");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新插件状态时发生错误");
                return ApiResponse<string>.CreateError("批量更新插件状态失败");
            }
        }

        public async Task<ApiResponse<string>> ValidatePluginFileAsync(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return ApiResponse<string>.CreateError("文件不能为空");
                }

                if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<string>.CreateError("插件文件必须是ZIP格式");
                }

                if (file.Length > 50 * 1024 * 1024) // 50MB限制
                {
                    return ApiResponse<string>.CreateError("插件文件大小不能超过50MB");
                }

                // TODO: 更详细的插件文件验证
                return ApiResponse<string>.CreateSuccess("文件验证通过");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证插件文件时发生错误");
                return ApiResponse<string>.CreateError("文件验证失败");
            }
        }

        // 简化实现的方法
        public async Task<ApiResponse<byte[]>> ExportPluginConfigAsync(int id)
        {
            return ApiResponse<byte[]>.CreateError("功能暂未实现");
        }

        public async Task<ApiResponse<string>> ImportPluginConfigAsync(int id, IFormFile configFile)
        {
            return ApiResponse<string>.CreateError("功能暂未实现");
        }

        // 私有辅助方法
        private async Task<PluginInfo?> ExtractPluginInfoAsync(IFormFile file)
        {
            try
            {
                using var stream = file.OpenReadStream();
                using var archive = new ZipArchive(stream);
                
                var manifestEntry = archive.Entries.FirstOrDefault(e => 
                    e.Name.Equals("manifest.json", StringComparison.OrdinalIgnoreCase) ||
                    e.Name.Equals("package.json", StringComparison.OrdinalIgnoreCase));

                if (manifestEntry == null) return null;

                using var reader = new StreamReader(manifestEntry.Open());
                var content = await reader.ReadToEndAsync();
                
                return JsonSerializer.Deserialize<PluginInfo>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
            }
            catch
            {
                return null;
            }
        }

        private async Task<string> CalculateFileHashAsync(string filePath)
        {
            using var stream = File.OpenRead(filePath);
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var hash = await Task.Run(() => sha256.ComputeHash(stream));
            return Convert.ToHexString(hash);
        }

        private async Task<string> ExtractPluginToFrontendAsync(string zipFilePath, string pluginId)
        {
            try
            {
                var pluginDirectory = Path.Combine(FrontendPluginsDirectory, pluginId);
                
                // 如果目录已存在，先删除
                if (Directory.Exists(pluginDirectory))
                {
                    Directory.Delete(pluginDirectory, true);
                }
                
                // 创建插件目录
                Directory.CreateDirectory(pluginDirectory);
                
                // 解压ZIP文件
                using (var archive = ZipFile.OpenRead(zipFilePath))
                {
                    foreach (var entry in archive.Entries)
                    {
                        // 跳过目录条目
                        if (string.IsNullOrEmpty(entry.Name))
                            continue;
                            
                        var destinationPath = Path.Combine(pluginDirectory, entry.FullName);
                        var destinationDir = Path.GetDirectoryName(destinationPath);
                        
                        if (!string.IsNullOrEmpty(destinationDir))
                        {
                            Directory.CreateDirectory(destinationDir);
                        }
                        
                        entry.ExtractToFile(destinationPath, true);
                    }
                }
                
                _logger.LogInformation($"Plugin {pluginId} extracted to frontend directory: {pluginDirectory}");
                return pluginDirectory;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to extract plugin {pluginId} to frontend directory");
                throw;
            }
        }

        // 插件信息类用于解析manifest.json
        private class PluginInfo
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
    }
}
