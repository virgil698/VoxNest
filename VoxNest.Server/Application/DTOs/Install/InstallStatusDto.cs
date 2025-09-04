namespace VoxNest.Server.Application.DTOs.Install;

/// <summary>
/// 安装状态数据传输对象
/// </summary>
public class InstallStatusDto
{
    /// <summary>
    /// 是否已安装
    /// </summary>
    public bool IsInstalled { get; set; }

    /// <summary>
    /// 安装步骤
    /// </summary>
    public InstallStep CurrentStep { get; set; }

    /// <summary>
    /// 配置文件是否存在
    /// </summary>
    public bool ConfigExists { get; set; }

    /// <summary>
    /// 数据库是否已连接
    /// </summary>
    public bool DatabaseConnected { get; set; }

    /// <summary>
    /// 是否有管理员账户
    /// </summary>
    public bool HasAdminUser { get; set; }
}

/// <summary>
/// 安装步骤枚举
/// </summary>
public enum InstallStep
{
    /// <summary>
    /// 未开始
    /// </summary>
    NotStarted = 0,

    /// <summary>
    /// 配置数据库
    /// </summary>
    DatabaseConfig = 1,

    /// <summary>
    /// 初始化数据库
    /// </summary>
    DatabaseInit = 2,

    /// <summary>
    /// 创建管理员账户
    /// </summary>
    CreateAdmin = 3,

    /// <summary>
    /// 安装完成
    /// </summary>
    Completed = 4
}
