using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Application.DTOs.User;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 用户个人主页服务实现
/// </summary>
public class UserProfileService : IUserProfileService
{
    private readonly VoxNestDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(
        VoxNestDbContext context,
        IMapper mapper,
        ILogger<UserProfileService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<UserProfilePageDto>> GetUserProfilePageAsync(string username, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);

            if (user == null)
            {
                return Result<UserProfilePageDto>.Failure("用户不存在");
            }

            return await GetUserProfilePageAsync(user.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户个人主页失败: {Username}", username);
            return Result<UserProfilePageDto>.Failure("获取用户信息失败");
        }
    }

    public async Task<Result<UserProfilePageDto>> GetUserProfilePageAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            // 获取用户基本信息
            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                return Result<UserProfilePageDto>.Failure("用户不存在");
            }

            // 检查用户状态
            if (user.Status != UserStatus.Active)
            {
                return Result<UserProfilePageDto>.Failure("用户账户已被禁用");
            }

            // 获取用户统计信息
            var userStats = await _context.UserStats
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            // 构建用户资料DTO
            var profileDto = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.Profile?.DisplayName,
                Avatar = user.Profile?.Avatar,
                Bio = user.Profile?.Bio,
                Location = user.Profile?.Location,
                Website = user.Profile?.Website,
                Birthday = user.Profile?.Birthday,
                Gender = user.Profile?.Gender,
                Status = user.Status,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
                Stats = userStats != null ? new UserStatsDto
                {
                    PostCount = userStats.PostCount,
                    CommentCount = userStats.CommentCount,
                    LikeCount = userStats.LikeCount,
                    ViewCount = userStats.ViewCount,
                    FollowerCount = userStats.FollowerCount,
                    FollowingCount = userStats.FollowingCount,
                    Score = userStats.Score,
                    Level = userStats.Level,
                    Experience = userStats.Experience,
                    ContinuousSignInDays = userStats.ContinuousSignInDays,
                    LastSignInAt = userStats.LastSignInAt,
                    LastActiveAt = userStats.LastActiveAt
                } : null
            };

            // 获取最近活动
            var recentActivitiesResult = await GetUserRecentActivitiesAsync(userId, 5, cancellationToken);
            var recentActivities = recentActivitiesResult.IsSuccess ? recentActivitiesResult.Data ?? new List<UserRecentActivityDto>() : new List<UserRecentActivityDto>();

            // 获取最近帖子
            var recentPostsResult = await GetUserRecentPostsAsync(userId, 5, cancellationToken);
            var recentPosts = recentPostsResult.IsSuccess ? recentPostsResult.Data ?? new List<UserRecentPostDto>() : new List<UserRecentPostDto>();

            var result = new UserProfilePageDto
            {
                Profile = profileDto,
                RecentActivities = recentActivities,
                RecentPosts = recentPosts
            };

            return Result<UserProfilePageDto>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户个人主页失败: {UserId}", userId);
            return Result<UserProfilePageDto>.Failure("获取用户信息失败");
        }
    }

    public async Task<Result<List<UserRecentActivityDto>>> GetUserRecentActivitiesAsync(int userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            var activities = new List<UserRecentActivityDto>();

            // 获取最近的帖子活动
            var recentPosts = await _context.Posts
                .Where(p => p.AuthorId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Take(limit / 2)
                .Select(p => new UserRecentActivityDto
                {
                    Id = p.Id,
                    Type = "post",
                    Description = $"发布了帖子「{p.Title}」",
                    Link = $"/posts/{p.Id}",
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync(cancellationToken);

            activities.AddRange(recentPosts);

            // 这里可以添加更多类型的活动，比如评论、点赞等
            // 由于当前数据模型中没有评论实体，我们暂时只显示帖子活动

            // 按时间排序并限制数量
            activities = activities
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .ToList();

            return Result<List<UserRecentActivityDto>>.Success(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户最近活动失败: {UserId}", userId);
            return Result<List<UserRecentActivityDto>>.Failure("获取用户活动失败");
        }
    }

    public async Task<Result<List<UserRecentPostDto>>> GetUserRecentPostsAsync(int userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            var posts = await _context.Posts
                .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .Where(p => p.AuthorId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Take(limit)
                .Select(p => new UserRecentPostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Summary = p.Summary,
                    ViewCount = p.ViewCount,
                    LikeCount = p.LikeCount,
                    CommentCount = p.CommentCount,
                    CreatedAt = p.CreatedAt,
                    Tags = p.PostTags.Select(pt => pt.Tag.Name).ToList()
                })
                .ToListAsync(cancellationToken);

            return Result<List<UserRecentPostDto>>.Success(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户最近帖子失败: {UserId}", userId);
            return Result<List<UserRecentPostDto>>.Failure("获取用户帖子失败");
        }
    }
}
