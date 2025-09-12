/**
 * 插件版本实体
 */

using System.ComponentModel.DataAnnotations;

namespace VoxNest.Server.Domain.Entities.Extension
{
    public class PluginVersion
    {
        [Key]
        public int Id { get; set; }
        
        /// <summary>
        /// 关联的插件ID
        /// </summary>
        public int PluginId { get; set; }
        
        /// <summary>
        /// 版本号
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Version { get; set; } = string.Empty;
        
        /// <summary>
        /// 版本描述/更新日志
        /// </summary>
        public string? ReleaseNotes { get; set; }
        
        /// <summary>
        /// 版本文件路径
        /// </summary>
        [MaxLength(500)]
        public string? FilePath { get; set; }
        
        /// <summary>
        /// 版本文件大小（字节）
        /// </summary>
        public long FileSize { get; set; }
        
        /// <summary>
        /// 版本文件哈希值
        /// </summary>
        [MaxLength(128)]
        public string? FileHash { get; set; }
        
        /// <summary>
        /// 版本配置JSON
        /// </summary>
        public string? Config { get; set; }
        
        /// <summary>
        /// 是否为当前活跃版本
        /// </summary>
        public bool IsActive { get; set; }
        
        /// <summary>
        /// 是否为预发布版本
        /// </summary>
        public bool IsPrerelease { get; set; }
        
        /// <summary>
        /// 下载次数
        /// </summary>
        public int DownloadCount { get; set; }
        
        /// <summary>
        /// 发布时间
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; }
        
        // 导航属性
        public virtual Plugin Plugin { get; set; } = null!;
    }
}
