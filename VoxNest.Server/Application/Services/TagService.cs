using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 标签管理服务实现
/// </summary>
public class TagService : ITagService
{
    private readonly VoxNestDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<TagService> _logger;

    public TagService(VoxNestDbContext context, IMapper mapper, ILogger<TagService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    #region 基础CRUD操作

    public async Task<List<TagOptionDto>> GetAvailableTagsAsync(CancellationToken cancellationToken = default)
    {
        var tags = await _context.Tags
            .OrderByDescending(t => t.IsPermanent)
            .ThenByDescending(t => t.UseCount)
            .ThenBy(t => t.Name)
            .Select(t => new TagOptionDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                IsPermanent = t.IsPermanent,
                UseCount = t.UseCount
            })
            .ToListAsync(cancellationToken);

        return tags;
    }

    public async Task<List<TagOptionDto>> GetPermanentTagsAsync(CancellationToken cancellationToken = default)
    {
        var tags = await _context.Tags
            .Where(t => t.IsPermanent)
            .OrderBy(t => t.Name)
            .Select(t => new TagOptionDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                IsPermanent = t.IsPermanent,
                UseCount = t.UseCount
            })
            .ToListAsync(cancellationToken);

        return tags;
    }

    public async Task<List<TagOptionDto>> GetDynamicTagsAsync(int? createdBy = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tags.Where(t => !t.IsPermanent);
        
        if (createdBy.HasValue)
        {
            query = query.Where(t => t.CreatedBy == createdBy.Value);
        }

        var tags = await query
            .OrderByDescending(t => t.UseCount)
            .ThenBy(t => t.Name)
            .Select(t => new TagOptionDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                IsPermanent = t.IsPermanent,
                UseCount = t.UseCount
            })
            .ToListAsync(cancellationToken);

        return tags;
    }

    public async Task<List<TagOptionDto>> SearchTagsAsync(string query, int limit = 10, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<TagOptionDto>();
        }

        var tags = await _context.Tags
            .Where(t => t.Name.Contains(query))
            .OrderByDescending(t => t.IsPermanent)
            .ThenByDescending(t => t.UseCount)
            .ThenBy(t => t.Name)
            .Take(limit)
            .Select(t => new TagOptionDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                IsPermanent = t.IsPermanent,
                UseCount = t.UseCount
            })
            .ToListAsync(cancellationToken);

        return tags;
    }

    public async Task<AdminTagDto> CreateTagAsync(string name, string? color, bool isPermanent, int? creatorId, CancellationToken cancellationToken = default)
    {
        if (!IsValidTagName(name))
        {
            throw new ArgumentException("标签名称无效");
        }

        if (await TagExistsAsync(name, cancellationToken: cancellationToken))
        {
            throw new InvalidOperationException("标签已存在");
        }

        var tag = new Tag
        {
            Name = name.Trim(),
            Slug = GenerateTagSlug(name),
            Color = color,
            IsPermanent = isPermanent,
            CreatedBy = isPermanent ? null : creatorId,
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = null
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {TagType} tag: {TagName} (ID: {TagId})", 
            isPermanent ? "permanent" : "dynamic", name, tag.Id);

        return await GetTagDtoAsync(tag.Id, cancellationToken);
    }

    public async Task<List<AdminTagDto>> CreateDynamicTagsAsync(List<string> tagNames, int creatorId, CancellationToken cancellationToken = default)
    {
        var results = new List<AdminTagDto>();
        
        foreach (var tagName in tagNames.Where(name => !string.IsNullOrWhiteSpace(name)))
        {
            try
            {
                // 检查是否已存在
                if (await TagExistsAsync(tagName, cancellationToken: cancellationToken))
                {
                    // 如果标签已存在，获取现有标签
                    var existingTag = await _context.Tags
                        .FirstOrDefaultAsync(t => t.Name == tagName.Trim(), cancellationToken);
                    
                    if (existingTag != null)
                    {
                        results.Add(await GetTagDtoAsync(existingTag.Id, cancellationToken));
                    }
                    continue;
                }

                var tagDto = await CreateTagAsync(tagName, null, false, creatorId, cancellationToken);
                results.Add(tagDto);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create dynamic tag: {TagName}", tagName);
            }
        }

        return results;
    }

    #endregion

    #region 帖子标签验证和处理

    public async Task<TagValidationResult> ValidatePostTagsAsync(PostTagSelectionDto tagSelection, CancellationToken cancellationToken = default)
    {
        var result = new TagValidationResult { IsValid = false };

        // 验证现有标签ID
        if (tagSelection.ExistingTagIds.Any())
        {
            var existingTags = await _context.Tags
                .Where(t => tagSelection.ExistingTagIds.Contains(t.Id))
                .ToListAsync(cancellationToken);

            var validTagIds = existingTags.Select(t => t.Id).ToList();
            var invalidTagIds = tagSelection.ExistingTagIds.Except(validTagIds).ToList();

            if (invalidTagIds.Any())
            {
                result.ErrorMessage = $"以下标签ID无效: {string.Join(", ", invalidTagIds)}";
                return result;
            }

            // 分离常驻标签和动态标签
            result.ValidPermanentTagIds = existingTags.Where(t => t.IsPermanent).Select(t => t.Id).ToList();
            result.ValidDynamicTagIds = existingTags.Where(t => !t.IsPermanent).Select(t => t.Id).ToList();
        }

        // 验证新动态标签名称
        if (tagSelection.NewDynamicTags.Any())
        {
            var validNewTags = new List<string>();
            foreach (var tagName in tagSelection.NewDynamicTags)
            {
                if (string.IsNullOrWhiteSpace(tagName))
                    continue;

                if (!IsValidTagName(tagName))
                {
                    result.ErrorMessage = $"标签名称无效: {tagName}";
                    return result;
                }

                // 检查是否已存在
                if (await TagExistsAsync(tagName, cancellationToken: cancellationToken))
                {
                    // 如果已存在，获取该标签ID
                    var existingTag = await _context.Tags
                        .FirstOrDefaultAsync(t => t.Name == tagName.Trim(), cancellationToken);
                    
                    if (existingTag != null)
                    {
                        if (existingTag.IsPermanent)
                            result.ValidPermanentTagIds.Add(existingTag.Id);
                        else
                            result.ValidDynamicTagIds.Add(existingTag.Id);
                    }
                }
                else
                {
                    validNewTags.Add(tagName.Trim());
                }
            }
            result.NewDynamicTagNames = validNewTags;
        }

        // 验证必须至少有一个常驻标签
        if (!result.ValidPermanentTagIds.Any())
        {
            result.ErrorMessage = "必须至少选择一个常驻标签";
            return result;
        }

        result.IsValid = true;
        return result;
    }

    public async Task<List<int>> ProcessPostTagsAsync(PostTagSelectionDto tagSelection, int authorId, CancellationToken cancellationToken = default)
    {
        var validation = await ValidatePostTagsAsync(tagSelection, cancellationToken);
        if (!validation.IsValid)
        {
            throw new ArgumentException(validation.ErrorMessage ?? "标签验证失败");
        }

        var allTagIds = new List<int>();
        
        // 添加现有标签ID
        allTagIds.AddRange(validation.ValidPermanentTagIds);
        allTagIds.AddRange(validation.ValidDynamicTagIds);

        // 创建新的动态标签
        if (validation.NewDynamicTagNames.Any())
        {
            var newTags = await CreateDynamicTagsAsync(validation.NewDynamicTagNames, authorId, cancellationToken);
            allTagIds.AddRange(newTags.Select(t => t.Id));
        }

        return allTagIds.Distinct().ToList();
    }

    public async Task UpdateTagUsageAsync(List<int> tagIds, CancellationToken cancellationToken = default)
    {
        if (!tagIds.Any()) return;

        var tags = await _context.Tags
            .Where(t => tagIds.Contains(t.Id))
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        
        foreach (var tag in tags)
        {
            tag.UseCount++;
            tag.LastUsedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogDebug("Updated usage for {Count} tags", tags.Count);
    }

    #endregion

    #region 标签维护和清理

    public async Task<int> CleanupUnusedDynamicTagsAsync(int daysThreshold = 7, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysThreshold);
        
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

    public async Task<bool> CanDeleteTagAsync(int tagId, CancellationToken cancellationToken = default)
    {
        var hasReferences = await _context.PostTags
            .AnyAsync(pt => pt.TagId == tagId, cancellationToken);
        
        return !hasReferences;
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

    public async Task RecalculateTagUsageCountsAsync(CancellationToken cancellationToken = default)
    {
        var tagUsageCounts = await _context.PostTags
            .GroupBy(pt => pt.TagId)
            .Select(g => new { TagId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var allTags = await _context.Tags.ToListAsync(cancellationToken);

        foreach (var tag in allTags)
        {
            var usage = tagUsageCounts.FirstOrDefault(uc => uc.TagId == tag.Id);
            tag.UseCount = usage?.Count ?? 0;
        }

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Recalculated usage counts for {Count} tags", allTags.Count);
    }

    public async Task UpdateTagSlugsAsync(CancellationToken cancellationToken = default)
    {
        var tagsWithoutSlug = await _context.Tags
            .Where(t => string.IsNullOrEmpty(t.Slug))
            .ToListAsync(cancellationToken);
            
        if (tagsWithoutSlug.Count == 0)
        {
            _logger.LogInformation("All tags already have slugs");
            return;
        }

        foreach (var tag in tagsWithoutSlug)
        {
            tag.Slug = GenerateTagSlug(tag.Name);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated slugs for {Count} tags", tagsWithoutSlug.Count);
    }

    #endregion

    #region 实用方法

    public string GenerateTagSlug(string tagName)
    {
        if (string.IsNullOrWhiteSpace(tagName))
            return string.Empty;

        // 转换为小写，移除特殊字符，将空格替换为连字符
        var slug = tagName.Trim().ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\u4e00-\u9fa5\s-]", ""); // 保留中文字符
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = slug.Trim('-');
        
        return slug;
    }

    public bool IsValidTagName(string tagName)
    {
        if (string.IsNullOrWhiteSpace(tagName))
            return false;

        tagName = tagName.Trim();
        
        // 检查长度
        if (tagName.Length < 1 || tagName.Length > 50)
            return false;

        // 检查是否包含有效字符（字母、数字、中文、连字符、下划线）
        return Regex.IsMatch(tagName, @"^[\w\u4e00-\u9fa5\s-]+$");
    }

    public async Task<bool> TagExistsAsync(string tagName, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(tagName))
            return false;

        var query = _context.Tags.Where(t => t.Name == tagName.Trim());
        
        if (excludeId.HasValue)
        {
            query = query.Where(t => t.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    #endregion

    #region 私有辅助方法

    private async Task<AdminTagDto> GetTagDtoAsync(int tagId, CancellationToken cancellationToken = default)
    {
        var tag = await _context.Tags
            .Include(t => t.Creator)
            .FirstOrDefaultAsync(t => t.Id == tagId, cancellationToken);

        if (tag == null)
        {
            throw new InvalidOperationException($"Tag with ID {tagId} not found");
        }

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

    #endregion
}
