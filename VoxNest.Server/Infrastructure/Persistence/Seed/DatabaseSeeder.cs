using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Persistence.Seed;

/// <summary>
/// 数据库种子数据
/// </summary>
public static class DatabaseSeeder
{
    /// <summary>
    /// 初始化种子数据
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    public static async Task SeedAsync(VoxNestDbContext context)
    {
        await SeedRolesAsync(context);
        await SeedPermissionsAsync(context);
        await SeedRolePermissionsAsync(context);
    }

    /// <summary>
    /// 初始化角色数据
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    private static async Task SeedRolesAsync(VoxNestDbContext context)
    {
        if (!await context.Roles.AnyAsync())
        {
            var roles = new[]
            {
                new Role
                {
                    Name = "Admin",
                    Description = "系统管理员，拥有所有权限",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    Name = "Moderator",
                    Description = "版主，拥有内容管理权限",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    Name = "User",
                    Description = "普通用户",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// 初始化权限数据
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    private static async Task SeedPermissionsAsync(VoxNestDbContext context)
    {
        if (!await context.Permissions.AnyAsync())
        {
            var permissions = new[]
            {
                // 用户管理权限
                new Permission
                {
                    Name = "user.create",
                    Resource = "User",
                    Action = "Create",
                    Description = "创建用户",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "user.read",
                    Resource = "User",
                    Action = "Read",
                    Description = "查看用户信息",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "user.update",
                    Resource = "User",
                    Action = "Update",
                    Description = "更新用户信息",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "user.delete",
                    Resource = "User",
                    Action = "Delete",
                    Description = "删除用户",
                    CreatedAt = DateTime.UtcNow
                },

                // 帖子管理权限
                new Permission
                {
                    Name = "post.create",
                    Resource = "Post",
                    Action = "Create",
                    Description = "创建帖子",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "post.read",
                    Resource = "Post",
                    Action = "Read",
                    Description = "查看帖子",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "post.update",
                    Resource = "Post",
                    Action = "Update",
                    Description = "更新帖子",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "post.delete",
                    Resource = "Post",
                    Action = "Delete",
                    Description = "删除帖子",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "post.manage",
                    Resource = "Post",
                    Action = "Manage",
                    Description = "管理所有帖子",
                    CreatedAt = DateTime.UtcNow
                },

                // 分类管理权限
                new Permission
                {
                    Name = "category.create",
                    Resource = "Category",
                    Action = "Create",
                    Description = "创建分类",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "category.update",
                    Resource = "Category",
                    Action = "Update",
                    Description = "更新分类",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "category.delete",
                    Resource = "Category",
                    Action = "Delete",
                    Description = "删除分类",
                    CreatedAt = DateTime.UtcNow
                },

                // 系统管理权限
                new Permission
                {
                    Name = "admin.access",
                    Resource = "Admin",
                    Action = "Access",
                    Description = "访问管理后台",
                    CreatedAt = DateTime.UtcNow
                },
                new Permission
                {
                    Name = "admin.settings",
                    Resource = "Admin",
                    Action = "Settings",
                    Description = "修改系统设置",
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Permissions.AddRange(permissions);
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// 初始化角色权限关联数据
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    private static async Task SeedRolePermissionsAsync(VoxNestDbContext context)
    {
        if (!await context.RolePermissions.AnyAsync())
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
            var moderatorRole = await context.Roles.FirstAsync(r => r.Name == "Moderator");
            var userRole = await context.Roles.FirstAsync(r => r.Name == "User");

            var allPermissions = await context.Permissions.ToListAsync();

            var rolePermissions = new List<RolePermission>();

            // 管理员拥有所有权限
            rolePermissions.AddRange(allPermissions.Select(p => new RolePermission
            {
                RoleId = adminRole.Id,
                PermissionId = p.Id,
                GrantedAt = DateTime.UtcNow
            }));

            // 版主拥有内容管理权限
            var moderatorPermissions = allPermissions
                .Where(p => p.Resource == "Post" || p.Resource == "Category")
                .ToList();
            rolePermissions.AddRange(moderatorPermissions.Select(p => new RolePermission
            {
                RoleId = moderatorRole.Id,
                PermissionId = p.Id,
                GrantedAt = DateTime.UtcNow
            }));

            // 普通用户拥有基本权限
            var userPermissions = allPermissions
                .Where(p => p.Name == "post.create" || p.Name == "post.read" || p.Name == "user.read")
                .ToList();
            rolePermissions.AddRange(userPermissions.Select(p => new RolePermission
            {
                RoleId = userRole.Id,
                PermissionId = p.Id,
                GrantedAt = DateTime.UtcNow
            }));

            context.RolePermissions.AddRange(rolePermissions);
            await context.SaveChangesAsync();
        }
    }
}
