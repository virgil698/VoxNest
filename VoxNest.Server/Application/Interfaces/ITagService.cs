using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 标签管理服务接口
/// </summary>
public interface ITagService
{
    #region 基础CRUD操作

    /// <summary>
    /// 获取所有可用标签（用于帖子选择）
    /// </summary>
    Task<List<TagOptionDto>> GetAvailableTagsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取常驻标签列表
    /// </summary>
    Task<List<TagOptionDto>> GetPermanentTagsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取动态标签列表
    /// </summary>
    Task<List<TagOptionDto>> GetDynamicTagsAsync(int? createdBy = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据名称搜索标签
    /// </summary>
    Task<List<TagOptionDto>> SearchTagsAsync(string query, int limit = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// 创建标签（可以是常驻或动态标签）
    /// </summary>
    Task<AdminTagDto> CreateTagAsync(string name, string? color, bool isPermanent, int? creatorId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量创建动态标签
    /// </summary>
    Task<List<AdminTagDto>> CreateDynamicTagsAsync(List<string> tagNames, int creatorId, CancellationToken cancellationToken = default);

    #endregion

    #region 帖子标签验证和处理

    /// <summary>
    /// 验证帖子标签选择
    /// </summary>
    Task<TagValidationResult> ValidatePostTagsAsync(PostTagSelectionDto tagSelection, CancellationToken cancellationToken = default);

    /// <summary>
    /// 处理帖子标签（创建新动态标签并返回所有标签ID）
    /// </summary>
    Task<List<int>> ProcessPostTagsAsync(PostTagSelectionDto tagSelection, int authorId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新标签使用统计
    /// </summary>
    Task UpdateTagUsageAsync(List<int> tagIds, CancellationToken cancellationToken = default);

    #endregion

    #region 标签维护和清理

    /// <summary>
    /// 清理无引用的动态标签
    /// </summary>
    Task<int> CleanupUnusedDynamicTagsAsync(int daysThreshold = 7, CancellationToken cancellationToken = default);

    /// <summary>
    /// 检查标签是否可以删除
    /// </summary>
    Task<bool> CanDeleteTagAsync(int tagId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 合并标签（将源标签的所有帖子关联转移到目标标签）
    /// </summary>
    Task<bool> MergeTagsAsync(int sourceTagId, int targetTagId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 重新计算标签使用次数
    /// </summary>
    Task RecalculateTagUsageCountsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 为现有标签生成Slug值
    /// </summary>
    Task UpdateTagSlugsAsync(CancellationToken cancellationToken = default);

    #endregion

    #region 实用方法

    /// <summary>
    /// 生成标签Slug
    /// </summary>
    string GenerateTagSlug(string tagName);

    /// <summary>
    /// 验证标签名称是否有效
    /// </summary>
    bool IsValidTagName(string tagName);

    /// <summary>
    /// 检查标签名称是否已存在
    /// </summary>
    Task<bool> TagExistsAsync(string tagName, int? excludeId = null, CancellationToken cancellationToken = default);

    #endregion
}
