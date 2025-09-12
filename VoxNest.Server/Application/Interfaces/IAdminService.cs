using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// Admin管理服务接口
/// </summary>
public interface IAdminService
{
    #region 站点概览
    
    /// <summary>
    /// 获取站点概览信息
    /// </summary>
    Task<SiteOverviewDto> GetSiteOverviewAsync(CancellationToken cancellationToken = default);

    #endregion

    #region 站点设置

    /// <summary>
    /// 获取所有站点设置
    /// </summary>
    Task<List<SiteSettingDto>> GetSiteSettingsAsync(string? group = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取站点设置（按组）
    /// </summary>
    Task<Dictionary<string, List<SiteSettingDto>>> GetSiteSettingsByGroupAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取单个站点设置
    /// </summary>
    Task<SiteSettingDto?> GetSiteSettingAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新站点设置
    /// </summary>
    Task<SiteSettingDto> UpdateSiteSettingAsync(string key, UpdateSiteSettingDto dto, int updatedById, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量更新站点设置
    /// </summary>
    Task<List<SiteSettingDto>> BatchUpdateSiteSettingsAsync(Dictionary<string, string> settings, int updatedById, CancellationToken cancellationToken = default);

    /// <summary>
    /// 创建站点设置
    /// </summary>
    Task<SiteSettingDto> CreateSiteSettingAsync(UpdateSiteSettingDto dto, int createdById, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除站点设置
    /// </summary>
    Task<bool> DeleteSiteSettingAsync(string key, CancellationToken cancellationToken = default);

    #endregion

    #region 用户管理

    /// <summary>
    /// 获取用户列表
    /// </summary>
    Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserQueryDto query, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取用户详情
    /// </summary>
    Task<AdminUserDto?> GetUserAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新用户状态
    /// </summary>
    Task<bool> UpdateUserStatusAsync(int userId, UpdateUserStatusDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新用户角色
    /// </summary>
    Task<bool> UpdateUserRolesAsync(int userId, UpdateUserRolesDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除用户
    /// </summary>
    Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken = default);

    #endregion

    #region 帖子管理

    /// <summary>
    /// 获取帖子列表
    /// </summary>
    Task<PagedResult<AdminPostDto>> GetPostsAsync(AdminPostQueryDto query, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取帖子详情
    /// </summary>
    Task<AdminPostDto?> GetPostAsync(int postId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新帖子状态
    /// </summary>
    Task<bool> UpdatePostStatusAsync(int postId, UpdatePostStatusDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量操作帖子
    /// </summary>
    Task<int> BatchOperatePostsAsync(BatchPostOperationDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除帖子
    /// </summary>
    Task<bool> DeletePostAsync(int postId, CancellationToken cancellationToken = default);

    #endregion

    #region 标签管理

    /// <summary>
    /// 获取标签列表
    /// </summary>
    Task<PagedResult<AdminTagDto>> GetTagsAsync(AdminTagQueryDto query, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取标签统计
    /// </summary>
    Task<TagStatsDto> GetTagStatsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取标签详情
    /// </summary>
    Task<AdminTagDto?> GetTagAsync(int tagId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 创建标签
    /// </summary>
    Task<AdminTagDto> CreateTagAsync(CreateUpdateTagDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新标签
    /// </summary>
    Task<AdminTagDto?> UpdateTagAsync(int tagId, CreateUpdateTagDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除标签
    /// </summary>
    Task<bool> DeleteTagAsync(int tagId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 合并标签
    /// </summary>
    Task<bool> MergeTagsAsync(int sourceTagId, int targetTagId, CancellationToken cancellationToken = default);

    #endregion
}
