using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Application.Interfaces;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 帖子控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PostController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILogger<PostController> _logger;

    public PostController(
        IPostService postService,
        ILogger<PostController> logger)
    {
        _postService = postService;
        _logger = logger;
    }

    /// <summary>
    /// 创建帖子
    /// </summary>
    /// <param name="request">帖子信息</param>
    /// <returns>创建的帖子</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var authorId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "无效的用户身份"
            });
        }

        var result = await _postService.CreatePostAsync(request, authorId);

        if (result.IsSuccess)
        {
            return CreatedAtAction(
                nameof(GetPost),
                new { id = result.Data!.Id },
                new
                {
                    success = true,
                    message = "帖子创建成功",
                    data = result.Data
                });
        }

        return BadRequest(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 获取帖子详情
    /// </summary>
    /// <param name="id">帖子ID</param>
    /// <returns>帖子详情</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPost(int id)
    {
        var result = await _postService.GetPostByIdAsync(id);

        if (result.IsSuccess)
        {
            // 增加浏览次数
            _ = _postService.IncrementViewCountAsync(id);

            return Ok(new
            {
                success = true,
                message = "获取帖子详情成功",
                data = result.Data
            });
        }

        return NotFound(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 获取帖子列表
    /// </summary>
    /// <param name="pageNumber">页码，默认为1</param>
    /// <param name="pageSize">每页大小，默认为10，最大50</param>
    /// <param name="categoryId">分类ID，可选</param>
    /// <returns>帖子列表</returns>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? categoryId = null)
    {
        // 验证分页参数
        if (pageNumber <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "页码必须大于0"
            });
        }

        if (pageSize <= 0 || pageSize > 50)
        {
            return BadRequest(new
            {
                success = false,
                message = "每页大小必须在1-50之间"
            });
        }

        var result = await _postService.GetPostsAsync(pageNumber, pageSize, categoryId);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = "获取帖子列表成功",
                data = result.Data,
                pagination = new
                {
                    currentPage = result.PageNumber,
                    pageSize = result.PageSize,
                    totalCount = result.TotalCount,
                    totalPages = result.TotalPages,
                    hasPreviousPage = result.HasPreviousPage,
                    hasNextPage = result.HasNextPage
                }
            });
        }

        return BadRequest(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 获取用户的帖子列表
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="pageNumber">页码，默认为1</param>
    /// <param name="pageSize">每页大小，默认为10，最大50</param>
    /// <returns>用户帖子列表</returns>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUserPosts(
        int userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        // 验证分页参数
        if (pageNumber <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "页码必须大于0"
            });
        }

        if (pageSize <= 0 || pageSize > 50)
        {
            return BadRequest(new
            {
                success = false,
                message = "每页大小必须在1-50之间"
            });
        }

        var result = await _postService.GetUserPostsAsync(userId, pageNumber, pageSize);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = "获取用户帖子列表成功",
                data = result.Data,
                pagination = new
                {
                    currentPage = result.PageNumber,
                    pageSize = result.PageSize,
                    totalCount = result.TotalCount,
                    totalPages = result.TotalPages,
                    hasPreviousPage = result.HasPreviousPage,
                    hasNextPage = result.HasNextPage
                }
            });
        }

        return BadRequest(new
        {
            success = false,
            message = result.ErrorMessage,
            errors = result.ErrorDetails
        });
    }

    /// <summary>
    /// 获取当前用户的帖子列表
    /// </summary>
    /// <param name="pageNumber">页码，默认为1</param>
    /// <param name="pageSize">每页大小，默认为10，最大50</param>
    /// <returns>当前用户帖子列表</returns>
    [HttpGet("my-posts")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyPosts(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "无效的用户身份"
            });
        }

        return await GetUserPosts(userId, pageNumber, pageSize);
    }

    /// <summary>
    /// 删除帖子
    /// </summary>
    /// <param name="id">帖子ID</param>
    /// <returns>删除结果</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "无效的用户身份"
            });
        }

        var result = await _postService.DeletePostAsync(id, userId);

        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                message = "帖子删除成功"
            });
        }

        // 根据错误信息返回相应的状态码
        return result.ErrorMessage switch
        {
            "帖子不存在" => NotFound(new
            {
                success = false,
                message = result.ErrorMessage
            }),
            "没有权限删除此帖子" => Forbid(),
            _ => BadRequest(new
            {
                success = false,
                message = result.ErrorMessage,
                errors = result.ErrorDetails
            })
        };
    }
}
