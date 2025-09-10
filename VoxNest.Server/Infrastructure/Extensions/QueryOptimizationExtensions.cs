using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Extensions;

/// <summary>
/// 查询优化扩展方法
/// </summary>
public static class QueryOptimizationExtensions
{
    /// <summary>
    /// 获取优化的帖子列表查询
    /// </summary>
    public static IQueryable<Post> GetOptimizedPostsQuery(this VoxNestDbContext context)
    {
        return context.Posts
            .Include(p => p.Author)
            .ThenInclude(a => a.Profile)
            .Include(p => p.Category)
            .Include(p => p.PostTags.Take(10)) // 限制标签数量
            .ThenInclude(pt => pt.Tag)
            .Where(p => p.Status == PostStatus.Published)
            .AsSplitQuery(); // 使用分割查询优化性能
    }

    /// <summary>
    /// 获取优化的帖子详情查询
    /// </summary>
    public static IQueryable<Post> GetOptimizedPostDetailQuery(this VoxNestDbContext context)
    {
        return context.Posts
            .Include(p => p.Author)
            .ThenInclude(a => a.Profile)
            .Include(p => p.Category)
            .Include(p => p.PostTags)
            .ThenInclude(pt => pt.Tag)
            .Include(p => p.Comments.Where(c => c.ParentId == null).Take(20)) // 只加载顶级评论，限制数量
            .ThenInclude(c => c.User)
            .ThenInclude(u => u.Profile)
            .AsSplitQuery();
    }

    /// <summary>
    /// 获取用户帖子的优化查询
    /// </summary>
    public static IQueryable<Post> GetOptimizedUserPostsQuery(this VoxNestDbContext context, int userId)
    {
        return context.Posts
            .Include(p => p.Category)
            .Include(p => p.PostTags.Take(5))
            .ThenInclude(pt => pt.Tag)
            .Where(p => p.AuthorId == userId && p.Status != PostStatus.Deleted)
            .AsSplitQuery();
    }

    /// <summary>
    /// 获取优化的用户查询（包含统计信息）
    /// </summary>
    public static async Task<User?> GetUserWithStatsAsync(this VoxNestDbContext context, int userId)
    {
        var user = await context.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user != null)
        {
            // 分别查询统计信息以优化性能
            var postCount = await context.Posts
                .Where(p => p.AuthorId == userId && p.Status == PostStatus.Published)
                .CountAsync();

            var commentCount = await context.Comments
                .Where(c => c.UserId == userId)
                .CountAsync();

            // 这里可以将统计信息添加到用户对象或返回复合对象
        }

        return user;
    }

    /// <summary>
    /// 获取热门帖子的优化查询
    /// </summary>
    public static IQueryable<Post> GetHotPostsQuery(this VoxNestDbContext context, int days = 7)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);
        
        return context.Posts
            .Include(p => p.Author)
            .ThenInclude(a => a.Profile)
            .Include(p => p.Category)
            .Where(p => p.Status == PostStatus.Published 
                       && p.PublishedAt >= cutoffDate)
            .OrderByDescending(p => p.ViewCount + p.LikeCount * 3 + p.CommentCount * 2) // 热度算法
            .AsSplitQuery();
    }

    /// <summary>
    /// 获取分类帖子数量的优化查询
    /// </summary>
    public static async Task<Dictionary<int, int>> GetCategoryPostCountsAsync(this VoxNestDbContext context)
    {
        return await context.Posts
            .Where(p => p.Status == PostStatus.Published && p.CategoryId.HasValue)
            .GroupBy(p => p.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);
    }

    /// <summary>
    /// 获取标签使用统计的优化查询
    /// </summary>
    public static async Task<List<TagStatistic>> GetTagStatisticsAsync(this VoxNestDbContext context, int limit = 50)
    {
        return await context.Tags
            .Select(t => new TagStatistic
            {
                TagId = t.Id,
                TagName = t.Name,
                Color = t.Color,
                UseCount = t.PostTags.Count(pt => pt.Post.Status == PostStatus.Published)
            })
            .Where(ts => ts.UseCount > 0)
            .OrderByDescending(ts => ts.UseCount)
            .Take(limit)
            .ToListAsync();
    }

    /// <summary>
    /// 搜索帖子的优化查询
    /// </summary>
    public static IQueryable<Post> SearchPosts(this VoxNestDbContext context, string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return context.GetOptimizedPostsQuery();
        }

        var normalizedSearchTerm = searchTerm.Trim().ToLower();
        
        return context.Posts
            .Include(p => p.Author)
            .ThenInclude(a => a.Profile)
            .Include(p => p.Category)
            .Where(p => p.Status == PostStatus.Published &&
                       (EF.Functions.Like(p.Title.ToLower(), $"%{normalizedSearchTerm}%") ||
                        EF.Functions.Like(p.Content.ToLower(), $"%{normalizedSearchTerm}%") ||
                        EF.Functions.Like(p.Summary!.ToLower(), $"%{normalizedSearchTerm}%")))
            .OrderByDescending(p => 
                // 标题匹配权重最高
                (EF.Functions.Like(p.Title.ToLower(), $"%{normalizedSearchTerm}%") ? 3 : 0) +
                // 摘要匹配权重中等
                (EF.Functions.Like(p.Summary!.ToLower(), $"%{normalizedSearchTerm}%") ? 2 : 0) +
                // 内容匹配权重最低
                (EF.Functions.Like(p.Content.ToLower(), $"%{normalizedSearchTerm}%") ? 1 : 0))
            .AsSplitQuery();
    }

    /// <summary>
    /// 获取用户活跃度统计
    /// </summary>
    public static async Task<UserActivityStats> GetUserActivityStatsAsync(this VoxNestDbContext context, int userId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        var stats = new UserActivityStats
        {
            UserId = userId,
            TotalPosts = await context.Posts
                .Where(p => p.AuthorId == userId && p.Status == PostStatus.Published)
                .CountAsync(),
            
            PostsLast30Days = await context.Posts
                .Where(p => p.AuthorId == userId && p.Status == PostStatus.Published 
                           && p.CreatedAt >= thirtyDaysAgo)
                .CountAsync(),
            
            PostsLast7Days = await context.Posts
                .Where(p => p.AuthorId == userId && p.Status == PostStatus.Published 
                           && p.CreatedAt >= sevenDaysAgo)
                .CountAsync(),
            
            TotalComments = await context.Comments
                .Where(c => c.UserId == userId)
                .CountAsync(),
            
            CommentsLast30Days = await context.Comments
                .Where(c => c.UserId == userId && c.CreatedAt >= thirtyDaysAgo)
                .CountAsync(),
            
            TotalViews = await context.Posts
                .Where(p => p.AuthorId == userId && p.Status == PostStatus.Published)
                .SumAsync(p => p.ViewCount),
            
            TotalLikes = await context.Posts
                .Where(p => p.AuthorId == userId && p.Status == PostStatus.Published)
                .SumAsync(p => p.LikeCount)
        };

        return stats;
    }

    /// <summary>
    /// 批量更新帖子浏览次数（优化性能）
    /// </summary>
    public static async Task IncrementPostViewCountAsync(this VoxNestDbContext context, int postId)
    {
        // 使用原生SQL直接更新，避免加载整个实体
        await context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE Posts SET ViewCount = ViewCount + 1 WHERE Id = {postId}");
    }

    /// <summary>
    /// 批量更新标签使用次数
    /// </summary>
    public static async Task UpdateTagUsageCountsAsync(this VoxNestDbContext context, IEnumerable<int> tagIds)
    {
        foreach (var tagId in tagIds)
        {
            await context.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE Tags SET UseCount = (
                    SELECT COUNT(*) FROM PostTags pt 
                    INNER JOIN Posts p ON pt.PostId = p.Id 
                    WHERE pt.TagId = {tagId} AND p.Status = {(int)PostStatus.Published}
                ) WHERE Id = {tagId}");
        }
    }
}

/// <summary>
/// 标签统计信息
/// </summary>
public class TagStatistic
{
    public int TagId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int UseCount { get; set; }
}

/// <summary>
/// 用户活跃度统计
/// </summary>
public class UserActivityStats
{
    public int UserId { get; set; }
    public int TotalPosts { get; set; }
    public int PostsLast30Days { get; set; }
    public int PostsLast7Days { get; set; }
    public int TotalComments { get; set; }
    public int CommentsLast30Days { get; set; }
    public int TotalViews { get; set; }
    public int TotalLikes { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
