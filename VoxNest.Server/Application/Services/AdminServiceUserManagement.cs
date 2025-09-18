using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VoxNest.Server.Application.DTOs.Admin;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Models;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// AdminService用户管理部分实现
/// </summary>
public partial class AdminService
{
    #region 用户管理

    /// <summary>
    /// 获取用户列表
    /// </summary>
    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserQueryDto query, CancellationToken cancellationToken = default)
    {
        var usersQuery = _context.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        // 搜索过滤
        if (!string.IsNullOrEmpty(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            usersQuery = usersQuery.Where(u => 
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.Profile != null && u.Profile.DisplayName != null && u.Profile.DisplayName.ToLower().Contains(search)));
        }

        // 状态过滤
        if (query.Status.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.Status == query.Status.Value);
        }

        // 角色过滤
        if (!string.IsNullOrEmpty(query.Role))
        {
            usersQuery = usersQuery.Where(u => u.UserRoles.Any(ur => ur.Role.Name == query.Role));
        }

        // 日期范围过滤
        if (query.StartDate.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.CreatedAt >= query.StartDate.Value);
        }
        if (query.EndDate.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.CreatedAt <= query.EndDate.Value);
        }

        // 排序
        usersQuery = query.SortBy.ToLower() switch
        {
            "username" => query.SortDirection == "asc" ? usersQuery.OrderBy(u => u.Username) : usersQuery.OrderByDescending(u => u.Username),
            "email" => query.SortDirection == "asc" ? usersQuery.OrderBy(u => u.Email) : usersQuery.OrderByDescending(u => u.Email),
            "lastloginat" => query.SortDirection == "asc" ? usersQuery.OrderBy(u => u.LastLoginAt) : usersQuery.OrderByDescending(u => u.LastLoginAt),
            "status" => query.SortDirection == "asc" ? usersQuery.OrderBy(u => u.Status) : usersQuery.OrderByDescending(u => u.Status),
            _ => query.SortDirection == "asc" ? usersQuery.OrderBy(u => u.CreatedAt) : usersQuery.OrderByDescending(u => u.CreatedAt)
        };

        // 分页
        var totalCount = await usersQuery.CountAsync(cancellationToken);
        var users = await usersQuery
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        // 转换为DTO
        var userDtos = new List<AdminUserDto>();
        foreach (var user in users)
        {
            var userDto = new AdminUserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                DisplayName = user.Profile?.DisplayName,
                Avatar = user.Profile?.Avatar,
                Status = user.Status,
                StatusName = GetUserStatusName(user.Status),
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            };

            // 获取用户统计
            var userStats = await _context.UserStats.FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);
            if (userStats != null)
            {
                userDto.Stats = new AdminUserStatsDto
                {
                    PostCount = userStats.PostCount,
                    CommentCount = userStats.CommentCount,
                    LikeCount = userStats.LikeCount,
                    ViewCount = userStats.ViewCount,
                    Score = userStats.Score,
                    Level = userStats.Level,
                    LastActiveAt = userStats.LastActiveAt
                };
            }

            userDtos.Add(userDto);
        }

        return PagedResult<AdminUserDto>.Success(userDtos, totalCount, query.PageNumber, query.PageSize);
    }

    /// <summary>
    /// 获取用户详情
    /// </summary>
    public async Task<AdminUserDto?> GetUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return null;

        var userDto = new AdminUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.Profile?.DisplayName,
            Avatar = user.Profile?.Avatar,
            Status = user.Status,
            StatusName = GetUserStatusName(user.Status),
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };

        // 获取用户统计
        var userStats = await _context.UserStats.FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);
        if (userStats != null)
        {
            userDto.Stats = new AdminUserStatsDto
            {
                PostCount = userStats.PostCount,
                CommentCount = userStats.CommentCount,
                LikeCount = userStats.LikeCount,
                ViewCount = userStats.ViewCount,
                Score = userStats.Score,
                Level = userStats.Level,
                LastActiveAt = userStats.LastActiveAt
            };
        }

        return userDto;
    }

    /// <summary>
    /// 创建用户
    /// </summary>
    public async Task<AdminUserDto> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        // 检查用户名是否已存在
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username, cancellationToken))
        {
            throw new InvalidOperationException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email, cancellationToken))
        {
            throw new InvalidOperationException("邮箱已存在");
        }

        // 使用执行策略处理事务，避免与MySQL重试策略冲突
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // 创建用户
                var user = new Domain.Entities.User.User
                {
                    Username = dto.Username,
                    Email = dto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Status = dto.Status,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(cancellationToken);

                // 创建用户配置文件
                var profile = new Domain.Entities.User.UserProfile
                {
                    UserId = user.Id,
                    DisplayName = dto.DisplayName ?? dto.Username,
                    Avatar = dto.Avatar
                };

                _context.UserProfiles.Add(profile);

                // 分配角色
                if (dto.RoleIds.Count > 0)
                {
                    foreach (var roleId in dto.RoleIds)
                    {
                        var userRole = new Domain.Entities.User.UserRole
                        {
                            UserId = user.Id,
                            RoleId = roleId,
                            GrantedAt = DateTime.UtcNow
                        };
                        _context.UserRoles.Add(userRole);
                    }
                }

                // 创建用户统计
                var userStats = new Domain.Entities.System.UserStats
                {
                    UserId = user.Id,
                    PostCount = 0,
                    CommentCount = 0,
                    LikeCount = 0,
                    ViewCount = 0,
                    Score = 0,
                    Level = 1,
                    LastActiveAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.UserStats.Add(userStats);
                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("管理员创建用户成功: {Username}", user.Username);

                // 重新查询用户详情并返回
                return await GetUserAsync(user.Id, cancellationToken) ?? throw new InvalidOperationException("创建用户后获取详情失败");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// 更新用户信息
    /// </summary>
    public async Task<AdminUserDto?> UpdateUserAsync(int userId, UpdateUserDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return null;

        // 检查用户名是否被其他用户使用
        if (await _context.Users.AnyAsync(u => u.Id != userId && u.Username == dto.Username, cancellationToken))
        {
            throw new InvalidOperationException("用户名已被其他用户使用");
        }

        // 检查邮箱是否被其他用户使用
        if (await _context.Users.AnyAsync(u => u.Id != userId && u.Email == dto.Email, cancellationToken))
        {
            throw new InvalidOperationException("邮箱已被其他用户使用");
        }

        // 使用执行策略处理事务，避免与MySQL重试策略冲突
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // 更新用户基本信息
                user.Username = dto.Username;
                user.Email = dto.Email;
                user.Status = dto.Status;

                // 更新密码（如果提供）
                if (!string.IsNullOrEmpty(dto.NewPassword))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                }

                // 更新用户配置文件
                if (user.Profile == null)
                {
                    user.Profile = new Domain.Entities.User.UserProfile { UserId = userId };
                    _context.UserProfiles.Add(user.Profile);
                }

                user.Profile.DisplayName = dto.DisplayName ?? dto.Username;
                user.Profile.Avatar = dto.Avatar;

                // 更新角色
                if (dto.RoleIds.Count > 0)
                {
                    // 删除现有角色
                    _context.UserRoles.RemoveRange(user.UserRoles);

                    // 添加新角色
                    foreach (var roleId in dto.RoleIds)
                    {
                        var userRole = new Domain.Entities.User.UserRole
                        {
                            UserId = userId,
                            RoleId = roleId,
                            GrantedAt = DateTime.UtcNow
                        };
                        _context.UserRoles.Add(userRole);
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("管理员更新用户成功: {Username}", user.Username);

                // 重新查询用户详情并返回
                return await GetUserAsync(userId, cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// 更新用户状态
    /// </summary>
    public async Task<bool> UpdateUserStatusAsync(int userId, UpdateUserStatusDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null) return false;

        user.Status = dto.Status;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("管理员更新用户状态: UserId={UserId}, Status={Status}", userId, dto.Status);
        return true;
    }

    /// <summary>
    /// 更新用户角色
    /// </summary>
    public async Task<bool> UpdateUserRolesAsync(int userId, UpdateUserRolesDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return false;

        // 使用执行策略处理事务，避免与MySQL重试策略冲突
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // 删除现有角色
                _context.UserRoles.RemoveRange(user.UserRoles);

                // 添加新角色
                foreach (var roleId in dto.RoleIds)
                {
                    var userRole = new Domain.Entities.User.UserRole
                    {
                        UserId = userId,
                        RoleId = roleId,
                        GrantedAt = DateTime.UtcNow
                    };
                    _context.UserRoles.Add(userRole);
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("管理员更新用户角色: UserId={UserId}, Roles={RoleIds}", userId, string.Join(",", dto.RoleIds));
                return true;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// 删除用户
    /// </summary>
    public async Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Posts)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return false;

        // 检查是否是系统管理员（防止删除）
        var isAdmin = user.UserRoles.Any(ur => ur.Role.Name == "Admin" || ur.Role.Name == "SuperAdmin");
        if (isAdmin)
        {
            throw new InvalidOperationException("不能删除管理员用户");
        }

        // 使用执行策略处理事务，避免与MySQL重试策略冲突
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // 删除相关数据
                if (user.Profile != null)
                {
                    _context.UserProfiles.Remove(user.Profile);
                }

                // 删除用户统计
                var userStats = await _context.UserStats.FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
                if (userStats != null)
                {
                    _context.UserStats.Remove(userStats);
                }

                // 删除用户角色关联
                _context.UserRoles.RemoveRange(user.UserRoles);

                // 可以选择删除用户的帖子或者保留（将作者设为已删除用户）
                // 这里选择保留帖子，但标记作者为已删除
                foreach (var post in user.Posts)
                {
                    post.AuthorId = 0; // 0表示已删除用户
                }

                // 删除用户
                _context.Users.Remove(user);

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("管理员删除用户: UserId={UserId}, Username={Username}", userId, user.Username);
                return true;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// 获取用户状态名称
    /// </summary>
    private static string GetUserStatusName(UserStatus status)
    {
        return status switch
        {
            UserStatus.Pending => "待验证",
            UserStatus.Active => "正常",
            UserStatus.Disabled => "已禁用",
            UserStatus.Deleted => "已删除",
            _ => "未知"
        };
    }

    #endregion
}
