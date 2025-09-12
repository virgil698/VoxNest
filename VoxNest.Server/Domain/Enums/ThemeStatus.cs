/**
 * 主题状态枚举
 */

namespace VoxNest.Server.Domain.Enums
{
    public enum ThemeStatus
    {
        /// <summary>
        /// 上传中
        /// </summary>
        Uploading = 0,
        
        /// <summary>
        /// 已上传，等待安装
        /// </summary>
        Uploaded = 1,
        
        /// <summary>
        /// 已安装但未启用
        /// </summary>
        Installed = 2,
        
        /// <summary>
        /// 已启用（当前使用的主题）
        /// </summary>
        Active = 3,
        
        /// <summary>
        /// 已禁用
        /// </summary>
        Disabled = 4,
        
        /// <summary>
        /// 安装失败
        /// </summary>
        InstallFailed = 5,
        
        /// <summary>
        /// 主题文件错误
        /// </summary>
        Error = 6,
        
        /// <summary>
        /// 已卸载
        /// </summary>
        Uninstalled = 7
    }
    
    public enum ThemeType
    {
        /// <summary>
        /// 完整主题
        /// </summary>
        Complete = 0,
        
        /// <summary>
        /// 颜色主题
        /// </summary>
        Color = 1,
        
        /// <summary>
        /// 布局主题
        /// </summary>
        Layout = 2,
        
        /// <summary>
        /// 组件主题
        /// </summary>
        Component = 3
    }
}
