/**
 * 前端主题实体
 */

using System.ComponentModel.DataAnnotations;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;

namespace VoxNest.Server.Domain.Entities.Extension
{
    public class Theme
    {
        [Key]
        public int Id { get; set; }
        
        /// <summary>
        /// 主题唯一标识符
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string UniqueId { get; set; } = string.Empty;
        
        /// <summary>
        /// 主题名称
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        /// <summary>
        /// 主题描述
        /// </summary>
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        /// <summary>
        /// 主题版本
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Version { get; set; } = string.Empty;
        
        /// <summary>
        /// 主题作者
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Author { get; set; } = string.Empty;
        
        /// <summary>
        /// 主题主页URL
        /// </summary>
        [MaxLength(500)]
        public string? Homepage { get; set; }
        
        /// <summary>
        /// 主题仓库URL
        /// </summary>
        [MaxLength(500)]
        public string? Repository { get; set; }
        
        /// <summary>
        /// 主题类型
        /// </summary>
        public ThemeType Type { get; set; }
        
        /// <summary>
        /// 主题状态
        /// </summary>
        public ThemeStatus Status { get; set; }
        
        /// <summary>
        /// 主题文件路径
        /// </summary>
        [MaxLength(500)]
        public string? FilePath { get; set; }
        
        /// <summary>
        /// 主题文件大小（字节）
        /// </summary>
        public long FileSize { get; set; }
        
        /// <summary>
        /// 主题文件哈希值
        /// </summary>
        [MaxLength(128)]
        public string? FileHash { get; set; }
        
        /// <summary>
        /// 主题配置JSON
        /// </summary>
        public string? Config { get; set; }
        
        /// <summary>
        /// 主题变量JSON（CSS变量定义）
        /// </summary>
        public string? Variables { get; set; }
        
        /// <summary>
        /// 自定义CSS
        /// </summary>
        public string? CustomCss { get; set; }
        
        /// <summary>
        /// 主题预览图路径
        /// </summary>
        [MaxLength(500)]
        public string? PreviewImagePath { get; set; }
        
        /// <summary>
        /// 主题截图JSON数组
        /// </summary>
        public string? Screenshots { get; set; }
        
        /// <summary>
        /// 主题标签JSON数组
        /// </summary>
        public string? Tags { get; set; }
        
        /// <summary>
        /// 主题颜色方案JSON
        /// </summary>
        public string? ColorScheme { get; set; }
        
        /// <summary>
        /// 支持的主题模式（light, dark, auto）
        /// </summary>
        [MaxLength(100)]
        public string? SupportedModes { get; set; }
        
        /// <summary>
        /// 下载次数
        /// </summary>
        public int DownloadCount { get; set; }
        
        /// <summary>
        /// 使用次数
        /// </summary>
        public int UseCount { get; set; }
        
        /// <summary>
        /// 是否为系统内置主题
        /// </summary>
        public bool IsBuiltIn { get; set; }
        
        /// <summary>
        /// 是否已验证（官方认证）
        /// </summary>
        public bool IsVerified { get; set; }
        
        /// <summary>
        /// 是否为默认主题
        /// </summary>
        public bool IsDefault { get; set; }
        
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
        /// 激活时间
        /// </summary>
        public DateTime? ActivatedAt { get; set; }
        
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
    }
}
