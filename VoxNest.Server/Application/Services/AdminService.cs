using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Shared.Results;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Domain.Entities.System;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 简化版Admin管理服务实现
/// </summary>
public partial class AdminService : IAdminService
{
    private readonly VoxNestDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<AdminService> _logger;
    private readonly ISystemInfoService _systemInfoService;

    public AdminService(
        VoxNestDbContext context, 
        IMapper mapper, 
        ILogger<AdminService> logger,
        ISystemInfoService systemInfoService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _systemInfoService = systemInfoService;
    }

    /// <summary>
    /// 获取站点概览信息
    /// </summary>
    public async Task<SiteOverviewDto> GetSiteOverviewAsync(CancellationToken cancellationToken = default)
    {
        var userCount = await _context.Users.CountAsync(cancellationToken);
        var postCount = await _context.Posts.CountAsync(cancellationToken);
        var tagCount = await _context.Tags.CountAsync(cancellationToken);
        
        // 计算真实统计数据
        var today = DateTime.UtcNow.Date;
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        var newUsersToday = await _context.Users
            .CountAsync(u => u.CreatedAt.Date == today, cancellationToken);

        var newPostsToday = await _context.Posts
            .CountAsync(p => p.CreatedAt.Date == today, cancellationToken);

        var totalComments = await _context.Comments
            .CountAsync(cancellationToken);

        var newCommentsToday = await _context.Comments
            .CountAsync(c => c.CreatedAt.Date == today, cancellationToken);

        var recentActiveUsers = await _context.UserStats
            .CountAsync(us => us.LastActiveAt >= sevenDaysAgo, cancellationToken);

        var activeUsers = await _context.Users
            .CountAsync(u => u.Status == UserStatus.Active, cancellationToken);

        return new SiteOverviewDto
        {
            UserStats = new UserStatsDto
            {
                TotalUsers = userCount,
                NewUsersToday = newUsersToday,
                ActiveUsers = recentActiveUsers,
                OnlineUsers = 0 // 在线用户数通过前端计算
            },
            PostStats = new PostStatsDto
            {
                TotalPosts = postCount,
                NewPostsToday = newPostsToday,
                TotalComments = totalComments,
                NewCommentsToday = newCommentsToday
            },
            SystemStats = new SystemStatsDto
            {
                ExtensionCount = 0,
                ActiveExtensionCount = 0
            },
            RecentActivity = new RecentActivityDto()
        };
    }

    /// <summary>
    /// 获取站点基础统计信息 - 用于首页显示
    /// </summary>
    public async Task<SiteStatsDto> GetSiteStatsAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        // 基础统计
        var totalUsers = await _context.Users.CountAsync(cancellationToken);
        var totalPosts = await _context.Posts.CountAsync(cancellationToken);
        var totalComments = await _context.Comments.CountAsync(cancellationToken);

        // 今日新增
        var newUsersToday = await _context.Users
            .CountAsync(u => u.CreatedAt.Date == today, cancellationToken);

        var newPostsToday = await _context.Posts
            .CountAsync(p => p.CreatedAt.Date == today, cancellationToken);

        // 活跃用户统计
        var activeUsers = await _context.Users
            .CountAsync(u => u.Status == UserStatus.Active, cancellationToken);

        var recentActiveUsers = await _context.UserStats
            .CountAsync(us => us.LastActiveAt >= sevenDaysAgo, cancellationToken);

        return new SiteStatsDto
        {
            TotalUsers = totalUsers,
            OnlineUsers = 0, // 在线用户数由前端实时计算
            ActiveUsers = activeUsers,
            TotalPosts = totalPosts,
            TotalComments = totalComments,
            NewPostsToday = newPostsToday,
            NewUsersToday = newUsersToday,
            RecentActiveUsers = recentActiveUsers,
            GeneratedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 获取站点设置列表
    /// </summary>
    public async Task<List<SiteSettingDto>> GetSiteSettingsAsync(string? group = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SiteSettings.AsQueryable();
        if (!string.IsNullOrEmpty(group))
        {
            query = query.Where(s => s.Group == group);
        }
        var settings = await query.ToListAsync(cancellationToken);
        return _mapper.Map<List<SiteSettingDto>>(settings);
    }

    /// <summary>
    /// 获取分组站点设置
    /// </summary>
    public async Task<Dictionary<string, List<SiteSettingDto>>> GetSiteSettingsByGroupAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetSiteSettingsAsync(cancellationToken: cancellationToken);
        return settings.GroupBy(s => s.Group ?? "General")
                      .ToDictionary(g => g.Key, g => g.ToList());
    }

    /// <summary>
    /// 获取单个站点设置
    /// </summary>
    public async Task<SiteSettingDto?> GetSiteSettingAsync(string key, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
        return setting != null ? _mapper.Map<SiteSettingDto>(setting) : null;
    }

    /// <summary>
    /// 更新站点设置
    /// </summary>
    public async Task<SiteSettingDto> UpdateSiteSettingAsync(string key, UpdateSiteSettingDto dto, int updatedById, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
        if (setting == null) 
            throw new ArgumentException($"Setting with key '{key}' not found.");

        setting.Value = dto.Value;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return _mapper.Map<SiteSettingDto>(setting);
    }

    /// <summary>
    /// 批量更新站点设置
    /// </summary>
    public async Task<List<SiteSettingDto>> BatchUpdateSiteSettingsAsync(Dictionary<string, string> settings, int updatedById, CancellationToken cancellationToken = default)
    {
        var results = new List<SiteSettingDto>();
        foreach (var kvp in settings)
        {
            var dto = new UpdateSiteSettingDto { Key = kvp.Key, Value = kvp.Value };
            var result = await UpdateSiteSettingAsync(kvp.Key, dto, updatedById, cancellationToken);
            results.Add(result);
        }
        return results;
    }

    /// <summary>
    /// 创建站点设置
    /// </summary>
    public async Task<SiteSettingDto> CreateSiteSettingAsync(UpdateSiteSettingDto dto, int createdById, CancellationToken cancellationToken = default)
    {
        var setting = new SiteSetting
        {
            Key = dto.Key,
            Value = dto.Value,
            Type = 0, // 默认类型
            Group = "General", // 默认分组
            Name = dto.Key,
            Description = "",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SiteSettings.Add(setting);
        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<SiteSettingDto>(setting);
    }

    /// <summary>
    /// 删除站点设置
    /// </summary>
    public async Task<bool> DeleteSiteSettingAsync(string key, CancellationToken cancellationToken = default)
    {
        var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
        if (setting == null) return false;

        _context.SiteSettings.Remove(setting);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    // 帖子管理方法实现在 AdminServicePostManagement.cs 中
    // 标签管理方法实现在 AdminServiceTagManagement.cs 中

    /// <summary>
    /// 获取系统信息
    /// </summary>
    public async Task<SystemInfoDto> GetSystemInfoAsync(CancellationToken cancellationToken = default)
    {
        return await _systemInfoService.GetSystemInfoAsync(cancellationToken);
    }
}
