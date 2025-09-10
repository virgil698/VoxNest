using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Infrastructure.Extensions;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 帖子服务实现
/// </summary>
public class PostService : IPostService
{
    private readonly VoxNestDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<PostService> _logger;

    public PostService(
        VoxNestDbContext dbContext,
        IMapper mapper,
        ILogger<PostService> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<PostDto>> CreatePostAsync(CreatePostRequestDto request, int authorId)
    {
        try
        {
            // 验证分类是否存在
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _dbContext.Categories
                    .AnyAsync(c => c.Id == request.CategoryId.Value && c.IsEnabled);
                
                if (!categoryExists)
                {
                    return Result<PostDto>.Failure("指定的分类不存在");
                }
            }

            // 验证标签是否存在
            var existingTagIds = await _dbContext.Tags
                .Where(t => request.TagIds.Contains(t.Id))
                .Select(t => t.Id)
                .ToListAsync();

            var invalidTagIds = request.TagIds.Except(existingTagIds).ToList();
            if (invalidTagIds.Any())
            {
                return Result<PostDto>.Failure($"标签不存在: {string.Join(", ", invalidTagIds)}");
            }

            // 创建帖子
            var post = new Post
            {
                Title = request.Title,
                Content = request.Content,
                Summary = request.Summary ?? GenerateSummary(request.Content),
                Status = PostStatus.Published,
                AuthorId = authorId,
                CategoryId = request.CategoryId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PublishedAt = DateTime.UtcNow
            };

            _dbContext.Posts.Add(post);
            await _dbContext.SaveChangesAsync();

            // 添加标签关联
            if (request.TagIds.Any())
            {
                var postTags = request.TagIds.Select(tagId => new PostTag
                {
                    PostId = post.Id,
                    TagId = tagId,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _dbContext.PostTags.AddRange(postTags);

                // 更新标签使用次数
                var tags = await _dbContext.Tags
                    .Where(t => request.TagIds.Contains(t.Id))
                    .ToListAsync();

                foreach (var tag in tags)
                {
                    tag.UseCount++;
                }

                await _dbContext.SaveChangesAsync();
            }

            // 获取完整的帖子信息
            var postWithDetails = await GetPostWithDetailsAsync(post.Id);
            var postDto = _mapper.Map<PostDto>(postWithDetails);

            _logger.LogInformation("帖子创建成功: {PostTitle} by {AuthorId}", post.Title, authorId);

            return Result<PostDto>.Success(postDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建帖子失败: AuthorId={AuthorId}", authorId);
            return Result<PostDto>.Failure("创建帖子失败，请稍后重试");
        }
    }

    public async Task<Result<PostDto>> GetPostByIdAsync(int postId)
    {
        try
        {
            var post = await GetPostWithDetailsAsync(postId);

            if (post == null)
            {
                return Result<PostDto>.Failure("帖子不存在");
            }

            // 检查帖子状态
            if (post.Status == PostStatus.Deleted)
            {
                return Result<PostDto>.Failure("帖子已被删除");
            }

            var postDto = _mapper.Map<PostDto>(post);
            return Result<PostDto>.Success(postDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取帖子详情失败: PostId={PostId}", postId);
            return Result<PostDto>.Failure("获取帖子详情失败");
        }
    }

    public async Task<PagedResult<PostListDto>> GetPostsAsync(int pageNumber = 1, int pageSize = 10, int? categoryId = null)
    {
        try
        {
            var query = _dbContext.GetOptimizedPostsQuery();

            // 按分类筛选
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // 排序：置顶帖子优先，然后按发布时间倒序
            query = query.OrderByDescending(p => p.IsPinned)
                         .ThenByDescending(p => p.PublishedAt);

            var totalCount = await query.CountAsync();
            var posts = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var postListDtos = _mapper.Map<List<PostListDto>>(posts);

            return PagedResult<PostListDto>.Success(postListDtos, totalCount, pageNumber, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取帖子列表失败: CategoryId={CategoryId}", categoryId);
            return PagedResult<PostListDto>.Failure("获取帖子列表失败");
        }
    }

    public async Task<PagedResult<PostListDto>> GetUserPostsAsync(int userId, int pageNumber = 1, int pageSize = 10)
    {
        try
        {
            var query = _dbContext.GetOptimizedUserPostsQuery(userId)
                .OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var posts = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var postListDtos = _mapper.Map<List<PostListDto>>(posts);

            return PagedResult<PostListDto>.Success(postListDtos, totalCount, pageNumber, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户帖子列表失败: UserId={UserId}", userId);
            return PagedResult<PostListDto>.Failure("获取用户帖子列表失败");
        }
    }

    public async Task<Result> IncrementViewCountAsync(int postId)
    {
        try
        {
            // 使用优化的批量更新方法，避免加载整个实体
            await _dbContext.IncrementPostViewCountAsync(postId);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新帖子浏览次数失败: PostId={PostId}", postId);
            return Result.Failure("更新浏览次数失败");
        }
    }

    public async Task<Result> DeletePostAsync(int postId, int userId)
    {
        try
        {
            var post = await _dbContext.Posts.FindAsync(postId);

            if (post == null)
            {
                return Result.Failure("帖子不存在");
            }

            // 验证权限（只有作者可以删除自己的帖子）
            if (post.AuthorId != userId)
            {
                return Result.Failure("没有权限删除此帖子");
            }

            post.Status = PostStatus.Deleted;
            post.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("帖子删除成功: PostId={PostId} by UserId={UserId}", postId, userId);

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "删除帖子失败: PostId={PostId}, UserId={UserId}", postId, userId);
            return Result.Failure("删除帖子失败，请稍后重试");
        }
    }

    private async Task<Post?> GetPostWithDetailsAsync(int postId)
    {
        return await _dbContext.Posts
            .Include(p => p.Author)
            .ThenInclude(a => a.Profile)
            .Include(p => p.Category)
            .Include(p => p.PostTags)
            .ThenInclude(pt => pt.Tag)
            .FirstOrDefaultAsync(p => p.Id == postId);
    }

    private static string GenerateSummary(string content, int maxLength = 200)
    {
        if (string.IsNullOrEmpty(content))
        {
            return string.Empty;
        }

        // 移除HTML标签（简单处理）
        var plainText = System.Text.RegularExpressions.Regex.Replace(content, "<.*?>", "");

        if (plainText.Length <= maxLength)
        {
            return plainText;
        }

        return plainText[..maxLength] + "...";
    }
}
