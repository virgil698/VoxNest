using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 帖子服务接口
/// </summary>
public interface IPostService
{
    /// <summary>
    /// 创建帖子
    /// </summary>
    /// <param name="request"></param>
    /// <param name="authorId"></param>
    /// <returns></returns>
    Task<Result<PostDto>> CreatePostAsync(CreatePostRequestDto request, int authorId);

    /// <summary>
    /// 根据ID获取帖子详情
    /// </summary>
    /// <param name="postId"></param>
    /// <returns></returns>
    Task<Result<PostDto>> GetPostByIdAsync(int postId);

    /// <summary>
    /// 获取帖子列表
    /// </summary>
    /// <param name="pageNumber"></param>
    /// <param name="pageSize"></param>
    /// <param name="categoryId"></param>
    /// <returns></returns>
    Task<PagedResult<PostListDto>> GetPostsAsync(int pageNumber = 1, int pageSize = 10, int? categoryId = null);

    /// <summary>
    /// 获取用户的帖子列表
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="pageNumber"></param>
    /// <param name="pageSize"></param>
    /// <returns></returns>
    Task<PagedResult<PostListDto>> GetUserPostsAsync(int userId, int pageNumber = 1, int pageSize = 10);

    /// <summary>
    /// 根据标签获取帖子列表
    /// </summary>
    /// <param name="tagId">标签ID</param>
    /// <param name="pageNumber">页码</param>
    /// <param name="pageSize">每页大小</param>
    /// <returns></returns>
    Task<Result<PagedResult<PostListDto>>> GetPostsByTagAsync(int tagId, int pageNumber = 1, int pageSize = 10);

    /// <summary>
    /// 更新帖子浏览次数
    /// </summary>
    /// <param name="postId"></param>
    /// <returns></returns>
    Task<Result> IncrementViewCountAsync(int postId);

    /// <summary>
    /// 删除帖子
    /// </summary>
    /// <param name="postId"></param>
    /// <param name="userId"></param>
    /// <returns></returns>
    Task<Result> DeletePostAsync(int postId, int userId);
}
