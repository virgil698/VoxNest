using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Domain.Entities.User;

namespace VoxNest.Server.Infrastructure.Persistence.Contexts;

/// <summary>
/// VoxNest数据库上下文
/// </summary>
public class VoxNestDbContext : DbContext
{
    public VoxNestDbContext(DbContextOptions<VoxNestDbContext> options) : base(options)
    {
    }

    #region User Entities

    /// <summary>
    /// 用户表
    /// </summary>
    public DbSet<User> Users { get; set; }

    /// <summary>
    /// 用户配置文件表
    /// </summary>
    public DbSet<UserProfile> UserProfiles { get; set; }

    /// <summary>
    /// 角色表
    /// </summary>
    public DbSet<Role> Roles { get; set; }

    /// <summary>
    /// 权限表
    /// </summary>
    public DbSet<Permission> Permissions { get; set; }

    /// <summary>
    /// 用户角色关联表
    /// </summary>
    public DbSet<UserRole> UserRoles { get; set; }

    /// <summary>
    /// 角色权限关联表
    /// </summary>
    public DbSet<RolePermission> RolePermissions { get; set; }

    #endregion

    #region Content Entities

    /// <summary>
    /// 帖子表
    /// </summary>
    public DbSet<Post> Posts { get; set; }

    /// <summary>
    /// 分类表
    /// </summary>
    public DbSet<Category> Categories { get; set; }

    /// <summary>
    /// 标签表
    /// </summary>
    public DbSet<Tag> Tags { get; set; }

    /// <summary>
    /// 帖子标签关联表
    /// </summary>
    public DbSet<PostTag> PostTags { get; set; }

    /// <summary>
    /// 评论表
    /// </summary>
    public DbSet<Comment> Comments { get; set; }

    #endregion

    #region System Entities

    /// <summary>
    /// 安装锁表
    /// </summary>
    public DbSet<InstallLock> InstallLocks { get; set; }

    #endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 应用所有配置
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(VoxNestDbContext).Assembly);
    }
}
