using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// Admin服务 - 帖子管理功能
/// </summary>
public partial class AdminService
{
    #region 帖子管理

    /// <summary>
    /// 获取帖子列表
    /// </summary>
    public async Task<PagedResult<AdminPostDto>> GetPostsAsync(AdminPostQueryDto query, CancellationToken cancellationToken = default)
    {
        try
        {
            var dbQuery = _context.Posts
                .Include(p => p.Author)
                    .ThenInclude(a => a.Profile)
                .Include(p => p.Category)
                .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .AsQueryable();

            // 搜索筛选
            if (!string.IsNullOrEmpty(query.Search))
            {
                var searchLower = query.Search.ToLower();
                dbQuery = dbQuery.Where(p => 
                    p.Title.ToLower().Contains(searchLower) ||
                    p.Content.ToLower().Contains(searchLower) ||
                    p.Author.Username.ToLower().Contains(searchLower));
            }

            // 状态筛选
            if (query.Status.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.Status == query.Status.Value);
            }

            // 分类筛选
            if (query.CategoryId.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.CategoryId == query.CategoryId.Value);
            }

            // 作者筛选
            if (query.AuthorId.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.AuthorId == query.AuthorId.Value);
            }

            // 标签筛选
            if (!string.IsNullOrEmpty(query.Tag))
            {
                dbQuery = dbQuery.Where(p => p.PostTags.Any(pt => pt.Tag.Name == query.Tag));
            }

            // 置顶筛选
            if (query.IsSticky.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.IsPinned == query.IsSticky.Value);
            }

            // 时间范围筛选
            if (query.StartDate.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.CreatedAt >= query.StartDate.Value);
            }

            if (query.EndDate.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.CreatedAt <= query.EndDate.Value);
            }

            // 排序
            dbQuery = query.SortBy.ToLower() switch
            {
                "title" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.Title) 
                    : dbQuery.OrderByDescending(p => p.Title),
                "author" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.Author.Username) 
                    : dbQuery.OrderByDescending(p => p.Author.Username),
                "status" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.Status) 
                    : dbQuery.OrderByDescending(p => p.Status),
                "viewcount" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.ViewCount) 
                    : dbQuery.OrderByDescending(p => p.ViewCount),
                "commentcount" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.CommentCount) 
                    : dbQuery.OrderByDescending(p => p.CommentCount),
                "likecount" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.LikeCount) 
                    : dbQuery.OrderByDescending(p => p.LikeCount),
                "updatedat" => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.UpdatedAt) 
                    : dbQuery.OrderByDescending(p => p.UpdatedAt),
                _ => query.SortDirection.ToLower() == "asc" 
                    ? dbQuery.OrderBy(p => p.CreatedAt) 
                    : dbQuery.OrderByDescending(p => p.CreatedAt)
            };

            var totalCount = await dbQuery.CountAsync(cancellationToken);
            
            var posts = await dbQuery
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync(cancellationToken);

            var postDtos = posts.Select(p => new AdminPostDto
            {
                Id = p.Id,
                Title = p.Title,
                Summary = p.PlainTextSummary ?? (p.Content.Length > 200 ? p.Content.Substring(0, 200) + "..." : p.Content),
                Author = new PostAuthorDto
                {
                    Id = p.Author.Id,
                    Username = p.Author.Username,
                    DisplayName = p.Author.Profile?.DisplayName ?? p.Author.Username,
                    Avatar = p.Author.Profile?.Avatar
                },
                Category = p.Category != null ? new CategoryDto
                {
                    Id = p.Category.Id,
                    Name = p.Category.Name,
                    Slug = p.Category.Slug,
                    Description = p.Category.Description,
                    Icon = p.Category.Icon,
                    Color = p.Category.Color
                } : null,
                Tags = p.PostTags.Select(pt => new TagDto
                {
                    Id = pt.Tag.Id,
                    Name = pt.Tag.Name,
                    Color = pt.Tag.Color,
                    UseCount = pt.Tag.UseCount
                }).ToList(),
                Status = p.Status,
                StatusName = GetPostStatusName(p.Status),
                ViewCount = p.ViewCount,
                CommentCount = p.CommentCount,
                LikeCount = p.LikeCount,
                IsSticky = p.IsPinned,
                IsFeatured = false, // 暂时没有推荐功能
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return PagedResult<AdminPostDto>.Success(postDtos, totalCount, query.PageNumber, query.PageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取帖子列表失败");
            return PagedResult<AdminPostDto>.Failure("获取帖子列表失败");
        }
    }

    /// <summary>
    /// 获取帖子详情
    /// </summary>
    public async Task<AdminPostDto?> GetPostAsync(int postId, CancellationToken cancellationToken = default)
    {
        try
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                    .ThenInclude(a => a.Profile)
                .Include(p => p.Category)
                .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

            if (post == null) return null;

            return new AdminPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Summary = post.PlainTextSummary ?? (post.Content.Length > 200 ? post.Content.Substring(0, 200) + "..." : post.Content),
                Author = new PostAuthorDto
                {
                    Id = post.Author.Id,
                    Username = post.Author.Username,
                    DisplayName = post.Author.Profile?.DisplayName ?? post.Author.Username,
                    Avatar = post.Author.Profile?.Avatar
                },
                Category = post.Category != null ? new CategoryDto
                {
                    Id = post.Category.Id,
                    Name = post.Category.Name,
                    Slug = post.Category.Slug,
                    Description = post.Category.Description,
                    Icon = post.Category.Icon,
                    Color = post.Category.Color
                } : null,
                Tags = post.PostTags.Select(pt => new TagDto
                {
                    Id = pt.Tag.Id,
                    Name = pt.Tag.Name,
                    Color = pt.Tag.Color,
                    UseCount = pt.Tag.UseCount
                }).ToList(),
                Status = post.Status,
                StatusName = GetPostStatusName(post.Status),
                ViewCount = post.ViewCount,
                CommentCount = post.CommentCount,
                LikeCount = post.LikeCount,
                IsSticky = post.IsPinned,
                IsFeatured = false,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取帖子详情失败: PostId={PostId}", postId);
            return null;
        }
    }

    /// <summary>
    /// 更新帖子状态
    /// </summary>
    public async Task<bool> UpdatePostStatusAsync(int postId, UpdatePostStatusDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var post = await _context.Posts.FindAsync(new object[] { postId }, cancellationToken);
            if (post == null) return false;

            var oldStatus = post.Status;
            post.Status = dto.Status;
            post.UpdatedAt = DateTime.UtcNow;

            // 处理发布状态变更
            if (dto.Status == PostStatus.Published && oldStatus != PostStatus.Published)
            {
                post.PublishedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("管理员更新帖子状态: PostId={PostId}, OldStatus={OldStatus}, NewStatus={NewStatus}", 
                postId, oldStatus, dto.Status);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新帖子状态失败: PostId={PostId}", postId);
            return false;
        }
    }

    /// <summary>
    /// 批量操作帖子
    /// </summary>
    public async Task<int> BatchOperatePostsAsync(BatchPostOperationDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var posts = await _context.Posts
                .Where(p => dto.PostIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            if (!posts.Any()) return 0;

            var successCount = 0;

            // 使用执行策略处理事务，避免与MySQL重试策略冲突
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    switch (dto.Operation.ToLower())
                    {
                        case "publish":
                            foreach (var post in posts)
                            {
                                if (post.Status != PostStatus.Published)
                                {
                                    post.Status = PostStatus.Published;
                                    post.PublishedAt = DateTime.UtcNow;
                                    post.UpdatedAt = DateTime.UtcNow;
                                    successCount++;
                                }
                            }
                            break;

                        case "draft":
                            foreach (var post in posts)
                            {
                                if (post.Status != PostStatus.Draft)
                                {
                                    post.Status = PostStatus.Draft;
                                    post.UpdatedAt = DateTime.UtcNow;
                                    successCount++;
                                }
                            }
                            break;

                        case "lock":
                            foreach (var post in posts)
                            {
                                if (post.Status != PostStatus.Locked)
                                {
                                    post.Status = PostStatus.Locked;
                                    post.UpdatedAt = DateTime.UtcNow;
                                    successCount++;
                                }
                            }
                            break;

                        case "pin":
                            foreach (var post in posts)
                            {
                                if (!post.IsPinned)
                                {
                                    post.IsPinned = true;
                                    post.UpdatedAt = DateTime.UtcNow;
                                    successCount++;
                                }
                            }
                            break;

                        case "unpin":
                            foreach (var post in posts)
                            {
                                if (post.IsPinned)
                                {
                                    post.IsPinned = false;
                                    post.UpdatedAt = DateTime.UtcNow;
                                    successCount++;
                                }
                            }
                            break;

                        case "delete":
                            foreach (var post in posts)
                            {
                                if (post.Status != PostStatus.Deleted)
                                {
                                    post.Status = PostStatus.Deleted;
                                    post.UpdatedAt = DateTime.UtcNow;
                                    successCount++;
                                }
                            }
                            break;

                        default:
                            throw new ArgumentException($"不支持的操作类型: {dto.Operation}");
                    }

                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    _logger.LogInformation("批量操作帖子成功: Operation={Operation}, PostCount={PostCount}, SuccessCount={SuccessCount}", 
                        dto.Operation, dto.PostIds.Count, successCount);

                    return successCount;
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "批量操作帖子失败: Operation={Operation}, PostIds={PostIds}", 
                dto.Operation, string.Join(",", dto.PostIds));
            return 0;
        }
    }

    /// <summary>
    /// 删除帖子
    /// </summary>
    public async Task<bool> DeletePostAsync(int postId, CancellationToken cancellationToken = default)
    {
        try
        {
            var post = await _context.Posts
                .Include(p => p.PostTags)
                .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

            if (post == null) return false;

            // 使用执行策略处理事务，避免与MySQL重试策略冲突
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    // 删除帖子标签关联
                    _context.PostTags.RemoveRange(post.PostTags);

                    // 更新相关标签的使用计数
                    if (post.PostTags.Any())
                    {
                        var tagIds = post.PostTags.Select(pt => pt.TagId).ToList();
                        var tags = await _context.Tags
                            .Where(t => tagIds.Contains(t.Id))
                            .ToListAsync(cancellationToken);

                        foreach (var tag in tags)
                        {
                            tag.UseCount = Math.Max(0, tag.UseCount - 1);
                        }
                    }

                    // 软删除帖子（标记为已删除状态）
                    post.Status = PostStatus.Deleted;
                    post.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    _logger.LogInformation("管理员删除帖子: PostId={PostId}, Title={Title}", postId, post.Title);
                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "删除帖子失败: PostId={PostId}", postId);
            return false;
        }
    }

    /// <summary>
    /// 更新帖子标签
    /// </summary>
    public async Task<bool> UpdatePostTagsAsync(int postId, List<int> tagIds, CancellationToken cancellationToken = default)
    {
        try
        {
            var post = await _context.Posts
                .Include(p => p.PostTags)
                .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

            if (post == null) return false;

            // 验证标签ID的有效性
            var existingTags = await _context.Tags
                .Where(t => tagIds.Contains(t.Id))
                .ToListAsync(cancellationToken);

            var validTagIds = existingTags.Select(t => t.Id).ToList();
            var invalidTagIds = tagIds.Except(validTagIds).ToList();
            
            if (invalidTagIds.Any())
            {
                _logger.LogWarning("更新帖子标签时发现无效标签ID: PostId={PostId}, InvalidTagIds={InvalidTagIds}", 
                    postId, string.Join(",", invalidTagIds));
            }

            // 检查是否至少包含一个常驻标签
            var permanentTagCount = existingTags.Count(t => t.IsPermanent && validTagIds.Contains(t.Id));
            if (permanentTagCount == 0)
            {
                throw new InvalidOperationException("必须至少选择一个常驻标签");
            }

            // 使用事务执行标签更新操作
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    // 获取当前标签关联
                    var currentPostTags = post.PostTags.ToList();
                    var currentTagIds = currentPostTags.Select(pt => pt.TagId).ToList();

                    // 计算需要删除和添加的标签
                    var tagsToRemove = currentTagIds.Except(validTagIds).ToList();
                    var tagsToAdd = validTagIds.Except(currentTagIds).ToList();

                    // 删除不再需要的标签关联
                    if (tagsToRemove.Any())
                    {
                        var postTagsToRemove = currentPostTags.Where(pt => tagsToRemove.Contains(pt.TagId)).ToList();
                        _context.PostTags.RemoveRange(postTagsToRemove);

                        // 更新被移除标签的使用计数
                        var removedTags = await _context.Tags
                            .Where(t => tagsToRemove.Contains(t.Id))
                            .ToListAsync(cancellationToken);
                        
                        foreach (var tag in removedTags)
                        {
                            tag.UseCount = Math.Max(0, tag.UseCount - 1);
                        }
                    }

                    // 添加新的标签关联
                    if (tagsToAdd.Any())
                    {
                        var now = DateTime.UtcNow;
                        var newPostTags = tagsToAdd.Select(tagId => new Domain.Entities.Content.PostTag
                        {
                            PostId = postId,
                            TagId = tagId,
                            CreatedAt = now
                        }).ToList();

                        _context.PostTags.AddRange(newPostTags);

                        // 更新新添加标签的使用计数
                        var addedTags = await _context.Tags
                            .Where(t => tagsToAdd.Contains(t.Id))
                            .ToListAsync(cancellationToken);
                        
                        foreach (var tag in addedTags)
                        {
                            tag.UseCount++;
                            tag.LastUsedAt = now;
                        }
                    }

                    // 更新帖子的修改时间
                    post.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    _logger.LogInformation("更新帖子标签成功: PostId={PostId}, OldTags={OldTags}, NewTags={NewTags}", 
                        postId, string.Join(",", currentTagIds), string.Join(",", validTagIds));

                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新帖子标签失败: PostId={PostId}, TagIds={TagIds}", 
                postId, string.Join(",", tagIds));
            return false;
        }
    }

    /// <summary>
    /// 获取帖子状态名称
    /// </summary>
    private static string GetPostStatusName(PostStatus status)
    {
        return status switch
        {
            PostStatus.Draft => "草稿",
            PostStatus.Published => "已发布",
            PostStatus.Locked => "已锁定",
            PostStatus.Pinned => "已置顶",
            PostStatus.Deleted => "已删除",
            _ => "未知"
        };
    }

    #endregion
}
