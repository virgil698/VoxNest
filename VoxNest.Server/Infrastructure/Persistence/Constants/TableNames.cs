using System;

namespace VoxNest.Server.Infrastructure.Persistence.Constants;

/// <summary>
/// 数据库表名常量
/// 使用统一的命名规范：voxnest_main_表名
/// </summary>
public static class TableNames
{
    /// <summary>
    /// 表名前缀
    /// </summary>
    public const string Prefix = "voxnest_main_";

    #region User Tables
    /// <summary>
    /// 用户表
    /// </summary>
    public const string Users = Prefix + "users";

    /// <summary>
    /// 用户配置文件表
    /// </summary>
    public const string UserProfiles = Prefix + "user_profiles";

    /// <summary>
    /// 角色表
    /// </summary>
    public const string Roles = Prefix + "roles";

    /// <summary>
    /// 权限表
    /// </summary>
    public const string Permissions = Prefix + "permissions";

    /// <summary>
    /// 用户角色关联表
    /// </summary>
    public const string UserRoles = Prefix + "user_roles";

    /// <summary>
    /// 角色权限关联表
    /// </summary>
    public const string RolePermissions = Prefix + "role_permissions";

    /// <summary>
    /// 用户统计表
    /// </summary>
    public const string UserStats = Prefix + "user_stats";
    #endregion

    #region Content Tables
    /// <summary>
    /// 帖子表
    /// </summary>
    public const string Posts = Prefix + "posts";

    /// <summary>
    /// 分类表
    /// </summary>
    public const string Categories = Prefix + "categories";

    /// <summary>
    /// 标签表
    /// </summary>
    public const string Tags = Prefix + "tags";

    /// <summary>
    /// 帖子标签关联表
    /// </summary>
    public const string PostTags = Prefix + "post_tags";

    /// <summary>
    /// 评论表
    /// </summary>
    public const string Comments = Prefix + "comments";
    #endregion

    #region System Tables
    /// <summary>
    /// 安装锁表
    /// </summary>
    public const string InstallLocks = Prefix + "install_locks";

    /// <summary>
    /// 日志条目表
    /// </summary>
    public const string LogEntries = Prefix + "log_entries";

    /// <summary>
    /// 站点设置表
    /// </summary>
    public const string SiteSettings = Prefix + "site_settings";
    #endregion

    #region Extension Tables
    /// <summary>
    /// 插件表
    /// </summary>
    public const string Plugins = Prefix + "plugins";

    /// <summary>
    /// 插件版本表
    /// </summary>
    public const string PluginVersions = Prefix + "plugin_versions";

    /// <summary>
    /// 主题表
    /// </summary>
    public const string Themes = Prefix + "themes";
    #endregion

    /// <summary>
    /// 为扩展系统生成表名
    /// </summary>
    /// <param name="extensionName">扩展名称</param>
    /// <param name="tableName">表名</param>
    /// <returns>完整的表名</returns>
    public static string ForExtension(string extensionName, string tableName)
    {
        if (string.IsNullOrWhiteSpace(extensionName))
            throw new ArgumentException("Extension name cannot be null or empty", nameof(extensionName));
        
        if (string.IsNullOrWhiteSpace(tableName))
            throw new ArgumentException("Table name cannot be null or empty", nameof(tableName));

        // 规范化名称（去除特殊字符，转为小写）
        var cleanExtensionName = extensionName.ToLowerInvariant()
            .Replace("-", "_")
            .Replace(" ", "_");
        
        var cleanTableName = tableName.ToLowerInvariant()
            .Replace("-", "_")
            .Replace(" ", "_");

        return $"voxnest_ext_{cleanExtensionName}_{cleanTableName}";
    }
}
