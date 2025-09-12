/**
 * 前端插件实体
 */

using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Domain.Entities.Extension
{
    public class Plugin
    {
        [Key]
        public int Id { get; set; }
        
        /// <summary>
        /// 插件唯一标识符
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string UniqueId { get; set; } = string.Empty;
        
        /// <summary>
        /// 插件名称
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        /// <summary>
        /// 插件描述
        /// </summary>
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        /// <summary>
        /// 插件版本
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Version { get; set; } = string.Empty;
        
        /// <summary>
        /// 插件作者
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Author { get; set; } = string.Empty;
        
        /// <summary>
        /// 插件主页URL
        /// </summary>
        [MaxLength(500)]
        public string? Homepage { get; set; }
        
        /// <summary>
        /// 插件仓库URL
        /// </summary>
        [MaxLength(500)]
        public string? Repository { get; set; }
        
        /// <summary>
        /// 插件类型
        /// </summary>
        public PluginType Type { get; set; }
        
        /// <summary>
        /// 插件状态
        /// </summary>
        public PluginStatus Status { get; set; }
        
        /// <summary>
        /// 插件文件路径
        /// </summary>
        [MaxLength(500)]
        public string? FilePath { get; set; }
        
        /// <summary>
        /// 插件文件大小（字节）
        /// </summary>
        public long FileSize { get; set; }
        
        /// <summary>
        /// 插件文件哈希值
        /// </summary>
        [MaxLength(128)]
        public string? FileHash { get; set; }
        
        /// <summary>
        /// 插件配置JSON
        /// </summary>
        public string? Config { get; set; }
        
        /// <summary>
        /// 插件依赖JSON数组
        /// </summary>
        public string? Dependencies { get; set; }
        
        /// <summary>
        /// 最小VoxNest版本要求
        /// </summary>
        [MaxLength(50)]
        public string? MinVoxNestVersion { get; set; }
        
        /// <summary>
        /// 最大VoxNest版本支持
        /// </summary>
        [MaxLength(50)]
        public string? MaxVoxNestVersion { get; set; }
        
        /// <summary>
        /// 插件图标路径
        /// </summary>
        [MaxLength(500)]
        public string? IconPath { get; set; }
        
        /// <summary>
        /// 插件截图JSON数组
        /// </summary>
        public string? Screenshots { get; set; }
        
        /// <summary>
        /// 插件标签JSON数组
        /// </summary>
        public string? Tags { get; set; }
        
        /// <summary>
        /// 下载次数
        /// </summary>
        public int DownloadCount { get; set; }
        
        /// <summary>
        /// 是否为系统内置插件
        /// </summary>
        public bool IsBuiltIn { get; set; }
        
        /// <summary>
        /// 是否已验证（官方认证）
        /// </summary>
        public bool IsVerified { get; set; }
        
        /// <summary>
        /// 上传用户ID
        /// </summary>
        public int? UploadedByUserId { get; set; }
        
        /// <summary>
        /// 最后错误信息
        /// </summary>
        public string? LastError { get; set; }
        
        /// <summary>
        /// 安装时间
        /// </summary>
        public DateTime? InstalledAt { get; set; }
        
        /// <summary>
        /// 启用时间
        /// </summary>
        public DateTime? EnabledAt { get; set; }
        
        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; }
        
        // 导航属性
        public virtual VoxNest.Server.Domain.Entities.User.User? UploadedBy { get; set; }
        public virtual ICollection<PluginVersion>? Versions { get; set; }
    }
}
