/**
 * 插件状态枚举
 */

namespace VoxNest.Server.Domain.Enums
{
    public enum PluginStatus
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
        /// 已启用
        /// </summary>
        Enabled = 3,
        
        /// <summary>
        /// 已禁用
        /// </summary>
        Disabled = 4,
        
        /// <summary>
        /// 安装失败
        /// </summary>
        InstallFailed = 5,
        
        /// <summary>
        /// 运行时错误
        /// </summary>
        Error = 6,
        
        /// <summary>
        /// 已卸载
        /// </summary>
        Uninstalled = 7
    }
    
    public enum PluginType
    {
        /// <summary>
        /// 功能插件
        /// </summary>
        Feature = 0,
        
        /// <summary>
        /// UI组件插件
        /// </summary>
        Component = 1,
        
        /// <summary>
        /// 集成插件
        /// </summary>
        Integration = 2,
        
        /// <summary>
        /// 工具插件
        /// </summary>
        Tool = 3
    }
}
