using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Presentation.Controllers;

/// <summary>
/// 标签管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TagController : ControllerBase
{
    private readonly ITagService _tagService;
    private readonly ILogger<TagController> _logger;

    public TagController(ITagService tagService, ILogger<TagController> logger)
    {
        _tagService = tagService;
        _logger = logger;
    }

    /// <summary>
    /// 获取所有可用标签（用于帖子编辑）
    /// </summary>
    [HttpGet("available")]
    [ProducesResponseType(typeof(ApiResponse<List<TagOptionDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<TagOptionDto>>>> GetAvailableTags()
    {
        try
        {
            var tags = await _tagService.GetAvailableTagsAsync();
            return Ok(ApiResponse<List<TagOptionDto>>.CreateSuccess(tags));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available tags");
            return StatusCode(500, ApiResponse.CreateError("获取标签列表失败"));
        }
    }

    /// <summary>
    /// 获取常驻标签列表
    /// </summary>
    [HttpGet("permanent")]
    [ProducesResponseType(typeof(ApiResponse<List<TagOptionDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<TagOptionDto>>>> GetPermanentTags()
    {
        try
        {
            var tags = await _tagService.GetPermanentTagsAsync();
            return Ok(ApiResponse<List<TagOptionDto>>.CreateSuccess(tags));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get permanent tags");
            return StatusCode(500, ApiResponse.CreateError("获取常驻标签失败"));
        }
    }

    /// <summary>
    /// 获取动态标签列表
    /// </summary>
    [HttpGet("dynamic")]
    [ProducesResponseType(typeof(ApiResponse<List<TagOptionDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<TagOptionDto>>>> GetDynamicTags([FromQuery] int? createdBy = null)
    {
        try
        {
            var tags = await _tagService.GetDynamicTagsAsync(createdBy);
            return Ok(ApiResponse<List<TagOptionDto>>.CreateSuccess(tags));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get dynamic tags");
            return StatusCode(500, ApiResponse.CreateError("获取动态标签失败"));
        }
    }

    /// <summary>
    /// 搜索标签
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<List<TagOptionDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<TagOptionDto>>>> SearchTags([FromQuery] string query, [FromQuery] int limit = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(ApiResponse<List<TagOptionDto>>.CreateSuccess(new List<TagOptionDto>()));
            }

            var tags = await _tagService.SearchTagsAsync(query, limit);
            return Ok(ApiResponse<List<TagOptionDto>>.CreateSuccess(tags));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search tags with query: {Query}", query);
            return StatusCode(500, ApiResponse.CreateError("搜索标签失败"));
        }
    }

    /// <summary>
    /// 验证帖子标签选择
    /// </summary>
    [HttpPost("validate")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<TagValidationResult>), 200)]
    public async Task<ActionResult<ApiResponse<TagValidationResult>>> ValidatePostTags([FromBody] PostTagSelectionDto tagSelection)
    {
        try
        {
            var result = await _tagService.ValidatePostTagsAsync(tagSelection);
            return Ok(ApiResponse<TagValidationResult>.CreateSuccess(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate post tags");
            return StatusCode(500, ApiResponse.CreateError("验证标签失败"));
        }
    }

    /// <summary>
    /// 处理帖子标签（创建新的动态标签并返回所有标签ID）
    /// </summary>
    [HttpPost("process")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<int>>), 200)]
    public async Task<ActionResult<ApiResponse<List<int>>>> ProcessPostTags([FromBody] PostTagSelectionDto tagSelection)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse.CreateError("无效的用户身份"));
            }

            var tagIds = await _tagService.ProcessPostTagsAsync(tagSelection, userId);
            return Ok(ApiResponse<List<int>>.CreateSuccess(tagIds));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.CreateError(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process post tags");
            return StatusCode(500, ApiResponse.CreateError("处理标签失败"));
        }
    }

    /// <summary>
    /// 创建动态标签（用户创建帖子时）
    /// </summary>
    [HttpPost("dynamic")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<AdminTagDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<AdminTagDto>>>> CreateDynamicTags([FromBody] List<string> tagNames)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse.CreateError("无效的用户身份"));
            }

            if (!tagNames.Any())
            {
                return BadRequest(ApiResponse.CreateError("标签名称不能为空"));
            }

            var tags = await _tagService.CreateDynamicTagsAsync(tagNames, userId);
            return Ok(ApiResponse<List<AdminTagDto>>.CreateSuccess(tags));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.CreateError(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create dynamic tags");
            return StatusCode(500, ApiResponse.CreateError("创建动态标签失败"));
        }
    }

    /// <summary>
    /// 检查标签名称是否有效
    /// </summary>
    [HttpPost("validate-name")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public ActionResult<ApiResponse<bool>> ValidateTagName([FromBody] string tagName)
    {
        try
        {
            var isValid = _tagService.IsValidTagName(tagName);
            return Ok(ApiResponse<bool>.CreateSuccess(isValid));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate tag name: {TagName}", tagName);
            return StatusCode(500, ApiResponse.CreateError("验证标签名称失败"));
        }
    }

    /// <summary>
    /// 检查标签是否已存在
    /// </summary>
    [HttpGet("exists")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> TagExists([FromQuery] string tagName, [FromQuery] int? excludeId = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(tagName))
            {
                return Ok(ApiResponse<bool>.CreateSuccess(false));
            }

            var exists = await _tagService.TagExistsAsync(tagName, excludeId);
            return Ok(ApiResponse<bool>.CreateSuccess(exists));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check tag existence: {TagName}", tagName);
            return StatusCode(500, ApiResponse.CreateError("检查标签存在性失败"));
        }
    }

    /// <summary>
    /// 清理无引用的动态标签
    /// </summary>
    [HttpPost("cleanup")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<int>), 200)]
    public async Task<ActionResult<ApiResponse<int>>> CleanupUnusedTags([FromQuery] int daysThreshold = 7)
    {
        try
        {
            var cleanedCount = await _tagService.CleanupUnusedDynamicTagsAsync(daysThreshold);
            return Ok(ApiResponse<int>.CreateSuccess(cleanedCount));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup unused tags");
            return StatusCode(500, ApiResponse.CreateError("清理标签失败"));
        }
    }

    /// <summary>
    /// 重新计算标签使用次数
    /// </summary>
    [HttpPost("recalculate-usage")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    public async Task<ActionResult<ApiResponse<string>>> RecalculateUsageCounts()
    {
        try
        {
            await _tagService.RecalculateTagUsageCountsAsync();
            return Ok(ApiResponse<string>.CreateSuccess("标签使用次数重新计算完成"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to recalculate tag usage counts");
            return StatusCode(500, ApiResponse.CreateError("重新计算标签使用次数失败"));
        }
    }
}
