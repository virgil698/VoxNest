using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// AdminService的标签管理部分
/// </summary>
public partial class AdminService
{
    public async Task<PagedResult<AdminTagDto>> GetTagsAsync(AdminTagQueryDto query, CancellationToken cancellationToken = default)
    {
        var queryBuilder = _context.Tags.AsQueryable();

        // 应用筛选条件
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            queryBuilder = queryBuilder.Where(t => t.Name.Contains(query.Search) || 
                                                   t.Slug.Contains(query.Search));
        }

        if (query.IsPermanent.HasValue)
        {
            queryBuilder = queryBuilder.Where(t => t.IsPermanent == query.IsPermanent.Value);
        }

        if (query.MinUseCount.HasValue)
        {
            queryBuilder = queryBuilder.Where(t => t.UseCount >= query.MinUseCount.Value);
        }

        if (query.CreatedBy.HasValue)
        {
            queryBuilder = queryBuilder.Where(t => t.CreatedBy == query.CreatedBy.Value);
        }

        // 应用排序
        queryBuilder = query.SortBy.ToLower() switch
        {
            "name" => query.SortDirection.ToLower() == "desc" 
                ? queryBuilder.OrderByDescending(t => t.Name)
                : queryBuilder.OrderBy(t => t.Name),
            "createdat" => query.SortDirection.ToLower() == "desc"
                ? queryBuilder.OrderByDescending(t => t.CreatedAt)
                : queryBuilder.OrderBy(t => t.CreatedAt),
            "lastusedAT" => query.SortDirection.ToLower() == "desc"
                ? queryBuilder.OrderByDescending(t => t.LastUsedAt)
                : queryBuilder.OrderBy(t => t.LastUsedAt),
            _ => query.SortDirection.ToLower() == "desc"
                ? queryBuilder.OrderByDescending(t => t.UseCount)
                : queryBuilder.OrderBy(t => t.UseCount),
        };

        var totalCount = await queryBuilder.CountAsync(cancellationToken);
        
        var tags = await queryBuilder
            .Include(t => t.Creator)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t => new AdminTagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                UseCount = t.UseCount,
                IsPermanent = t.IsPermanent,
                CreatedBy = t.CreatedBy,
                CreatorName = t.Creator != null ? t.Creator.Username : null,
                CreatedAt = t.CreatedAt,
                LastUsedAt = t.LastUsedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<AdminTagDto>.Success(tags, totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<TagStatsDto> GetTagStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalTags = await _context.Tags.CountAsync(cancellationToken);
        var permanentTags = await _context.Tags.CountAsync(t => t.IsPermanent, cancellationToken);
        var dynamicTags = await _context.Tags.CountAsync(t => !t.IsPermanent, cancellationToken);
        var unusedTags = await _context.Tags.CountAsync(t => t.UseCount == 0, cancellationToken);

        // 计算需要清理的动态标签数量
        var cutoffDate = DateTime.UtcNow.AddDays(-7);
        var tagsToClean = await _context.Tags.CountAsync(
            t => !t.IsPermanent && 
                 t.UseCount == 0 && 
                 (t.CreatedAt < cutoffDate && t.LastUsedAt == null ||
                  t.LastUsedAt != null && t.LastUsedAt < cutoffDate),
            cancellationToken);

        // 获取热门标签
        var topTags = await _context.Tags
            .OrderByDescending(t => t.UseCount)
            .Take(10)
            .Include(t => t.Creator)
            .Select(t => new AdminTagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                UseCount = t.UseCount,
                IsPermanent = t.IsPermanent,
                CreatedBy = t.CreatedBy,
                CreatorName = t.Creator != null ? t.Creator.Username : null,
                CreatedAt = t.CreatedAt,
                LastUsedAt = t.LastUsedAt
            })
            .ToListAsync(cancellationToken);

        // 获取最近创建的标签
        var recentTags = await _context.Tags
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Include(t => t.Creator)
            .Select(t => new AdminTagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                UseCount = t.UseCount,
                IsPermanent = t.IsPermanent,
                CreatedBy = t.CreatedBy,
                CreatorName = t.Creator != null ? t.Creator.Username : null,
                CreatedAt = t.CreatedAt,
                LastUsedAt = t.LastUsedAt
            })
            .ToListAsync(cancellationToken);

        return new TagStatsDto
        {
            TotalTags = totalTags,
            PermanentTags = permanentTags,
            DynamicTags = dynamicTags,
            UnusedTags = unusedTags,
            TagsToClean = tagsToClean,
            TopTags = topTags,
            RecentTags = recentTags
        };
    }

    public async Task<AdminTagDto?> GetTagAsync(int tagId, CancellationToken cancellationToken = default)
    {
        var tag = await _context.Tags
            .Include(t => t.Creator)
            .FirstOrDefaultAsync(t => t.Id == tagId, cancellationToken);

        if (tag == null) return null;

        return new AdminTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            Slug = tag.Slug,
            Color = tag.Color,
            UseCount = tag.UseCount,
            IsPermanent = tag.IsPermanent,
            CreatedBy = tag.CreatedBy,
            CreatorName = tag.Creator?.Username,
            CreatedAt = tag.CreatedAt,
            LastUsedAt = tag.LastUsedAt
        };
    }

    public async Task<AdminTagDto> CreateTagAsync(CreateTagDto dto, int creatorId, CancellationToken cancellationToken = default)
    {
        // 直接在AdminService中实现标签创建逻辑，避免依赖问题
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("标签名称不能为空");
        }

        var trimmedName = dto.Name.Trim();
        
        // 检查标签是否已存在
        var existingTag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Name == trimmedName, cancellationToken);
        
        if (existingTag != null)
        {
            throw new InvalidOperationException("标签已存在");
        }

        // 生成Slug
        var slug = GenerateTagSlug(trimmedName);

        var tag = new Domain.Entities.Content.Tag
        {
            Name = trimmedName,
            Slug = slug,
            Color = dto.Color,
            IsPermanent = dto.IsPermanent,
            CreatedBy = dto.IsPermanent ? null : creatorId,
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = null
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {TagType} tag: {TagName} (ID: {TagId})", 
            dto.IsPermanent ? "permanent" : "dynamic", trimmedName, tag.Id);

        return new AdminTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            Slug = tag.Slug,
            Color = tag.Color,
            UseCount = tag.UseCount,
            IsPermanent = tag.IsPermanent,
            CreatedBy = tag.CreatedBy,
            CreatorName = null, // Creator will be loaded if needed
            CreatedAt = tag.CreatedAt,
            LastUsedAt = tag.LastUsedAt
        };
    }

    public async Task<AdminTagDto?> UpdateTagAsync(int tagId, UpdateTagDto dto, CancellationToken cancellationToken = default)
    {
        var tag = await _context.Tags.FindAsync(new object[] { tagId }, cancellationToken);
        if (tag == null) return null;

        var trimmedName = dto.Name.Trim();
        
        // 验证标签名称
        if (!IsValidTagName(trimmedName))
        {
            throw new ArgumentException("标签名称无效");
        }

        // 检查名称是否已存在（排除当前标签）
        var existingTag = await _context.Tags
            .Where(t => t.Name == trimmedName && t.Id != tagId)
            .FirstOrDefaultAsync(cancellationToken);
            
        if (existingTag != null)
        {
            throw new InvalidOperationException("标签名称已存在");
        }

        tag.Name = trimmedName;
        tag.Slug = GenerateTagSlug(trimmedName);
        tag.Color = dto.Color;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated tag: {TagName} (ID: {TagId})", trimmedName, tagId);

        return await GetTagAsync(tagId, cancellationToken);
    }

    public async Task<bool> DeleteTagAsync(int tagId, CancellationToken cancellationToken = default)
    {
        var tag = await _context.Tags.FindAsync(new object[] { tagId }, cancellationToken);
        if (tag == null) return false;

        // 检查是否可以删除（有无帖子引用）
        var hasReferences = await _context.PostTags
            .AnyAsync(pt => pt.TagId == tagId, cancellationToken);

        if (hasReferences)
        {
            throw new InvalidOperationException("无法删除被帖子引用的标签");
        }

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted tag: {TagName} (ID: {TagId})", tag.Name, tagId);
        return true;
    }

    public async Task<bool> MergeTagsAsync(int sourceTagId, int targetTagId, CancellationToken cancellationToken = default)
    {
        if (sourceTagId == targetTagId)
        {
            return false;
        }

        var sourceTag = await _context.Tags.FindAsync(new object[] { sourceTagId }, cancellationToken);
        var targetTag = await _context.Tags.FindAsync(new object[] { targetTagId }, cancellationToken);

        if (sourceTag == null || targetTag == null)
        {
            return false;
        }

        // 获取源标签的所有帖子关联
        var sourcePostTags = await _context.PostTags
            .Where(pt => pt.TagId == sourceTagId)
            .ToListAsync(cancellationToken);

        foreach (var postTag in sourcePostTags)
        {
            // 检查目标标签是否已经关联到该帖子
            var existingTargetPostTag = await _context.PostTags
                .FirstOrDefaultAsync(pt => pt.PostId == postTag.PostId && pt.TagId == targetTagId, cancellationToken);

            if (existingTargetPostTag == null)
            {
                // 将关联转移到目标标签
                postTag.TagId = targetTagId;
            }
            else
            {
                // 如果目标标签已经关联，删除源标签的关联
                _context.PostTags.Remove(postTag);
            }
        }

        // 更新目标标签的使用次数
        var newUseCount = await _context.PostTags
            .CountAsync(pt => pt.TagId == targetTagId, cancellationToken);
        
        targetTag.UseCount = newUseCount;
        targetTag.LastUsedAt = DateTime.UtcNow;

        // 删除源标签
        _context.Tags.Remove(sourceTag);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Merged tag {SourceTagId} into {TargetTagId}", sourceTagId, targetTagId);
        return true;
    }

    public async Task<int> CleanupUnusedDynamicTagsAsync(CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-7);
        
        // 查找需要清理的动态标签：
        // 1. 非常驻标签
        // 2. 使用次数为0
        // 3. 创建时间超过阈值且从未使用，或最后使用时间超过阈值
        var tagsToDelete = await _context.Tags
            .Where(t => !t.IsPermanent && 
                       t.UseCount == 0 && 
                       (t.CreatedAt < cutoffDate && t.LastUsedAt == null ||
                        t.LastUsedAt != null && t.LastUsedAt < cutoffDate))
            .ToListAsync(cancellationToken);

        if (!tagsToDelete.Any())
        {
            return 0;
        }

        _context.Tags.RemoveRange(tagsToDelete);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cleaned up {Count} unused dynamic tags", tagsToDelete.Count);
        return tagsToDelete.Count;
    }

    public async Task<int> BatchDeleteDynamicTagsAsync(List<int> tagIds, CancellationToken cancellationToken = default)
    {
        if (!tagIds.Any()) return 0;

        // 只删除动态标签且无引用的标签
        var tagsToDelete = await _context.Tags
            .Where(t => tagIds.Contains(t.Id) && !t.IsPermanent)
            .Where(t => !_context.PostTags.Any(pt => pt.TagId == t.Id))
            .ToListAsync(cancellationToken);

        _context.Tags.RemoveRange(tagsToDelete);
        var deletedCount = tagsToDelete.Count;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Batch deleted {Count} dynamic tags", deletedCount);
        return deletedCount;
    }

    #region 辅助方法

    /// <summary>
    /// 生成标签Slug
    /// </summary>
    private string GenerateTagSlug(string tagName)
    {
        if (string.IsNullOrWhiteSpace(tagName))
            return string.Empty;

        // 转换为小写，移除特殊字符，将空格替换为连字符
        var slug = tagName.Trim().ToLowerInvariant();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\u4e00-\u9fa5\s-]", ""); // 保留中文字符
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        slug = slug.Trim('-');
        
        return slug;
    }

    /// <summary>
    /// 验证标签名称是否有效
    /// </summary>
    private bool IsValidTagName(string tagName)
    {
        if (string.IsNullOrWhiteSpace(tagName))
            return false;

        tagName = tagName.Trim();
        
        // 检查长度
        if (tagName.Length < 1 || tagName.Length > 50)
            return false;

        // 检查是否包含有效字符（字母、数字、中文、连字符、下划线）
        return System.Text.RegularExpressions.Regex.IsMatch(tagName, @"^[\w\u4e00-\u9fa5\s-]+$");
    }

    #endregion
}
