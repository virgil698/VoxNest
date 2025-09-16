using VoxNest.Server.Application.DTOs;

namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// 服务器配置服务接口
/// </summary>
public interface IServerConfigService
{
    /// <summary>
    /// 获取完整的服务器配置
    /// </summary>
    /// <returns>完整的服务器配置</returns>
    Task<FullServerConfigDto> GetFullConfigAsync();

    /// <summary>
    /// 获取服务器基本配置
    /// </summary>
    /// <returns>服务器基本配置</returns>
    Task<ServerConfigDto> GetServerConfigAsync();

    /// <summary>
    /// 获取数据库配置（敏感信息已脱敏）
    /// </summary>
    /// <returns>数据库配置</returns>
    Task<DatabaseConfigDto> GetDatabaseConfigAsync();

    /// <summary>
    /// 获取JWT配置（敏感信息已脱敏）
    /// </summary>
    /// <returns>JWT配置</returns>
    Task<JwtConfigDto> GetJwtConfigAsync();

    /// <summary>
    /// 获取CORS配置
    /// </summary>
    /// <returns>CORS配置</returns>
    Task<CorsConfigDto> GetCorsConfigAsync();

    /// <summary>
    /// 获取日志配置
    /// </summary>
    /// <returns>日志配置</returns>
    Task<LoggingConfigDto> GetLoggingConfigAsync();

    /// <summary>
    /// 更新服务器配置
    /// </summary>
    /// <param name="config">服务器配置</param>
    /// <returns>更新结果</returns>
    Task<bool> UpdateServerConfigAsync(ServerConfigDto config);

    /// <summary>
    /// 更新数据库配置
    /// </summary>
    /// <param name="config">数据库配置</param>
    /// <returns>更新结果</returns>
    Task<bool> UpdateDatabaseConfigAsync(DatabaseConfigDto config);

    /// <summary>
    /// 更新JWT配置
    /// </summary>
    /// <param name="config">JWT配置</param>
    /// <returns>更新结果</returns>
    Task<bool> UpdateJwtConfigAsync(JwtConfigDto config);

    /// <summary>
    /// 更新CORS配置
    /// </summary>
    /// <param name="config">CORS配置</param>
    /// <returns>更新结果</returns>
    Task<bool> UpdateCorsConfigAsync(CorsConfigDto config);

    /// <summary>
    /// 更新日志配置
    /// </summary>
    /// <param name="config">日志配置</param>
    /// <returns>更新结果</returns>
    Task<bool> UpdateLoggingConfigAsync(LoggingConfigDto config);

    /// <summary>
    /// 获取所有可用时区
    /// </summary>
    /// <returns>时区信息列表</returns>
    Task<List<TimeZoneInfoDto>> GetAvailableTimeZonesAsync();

    /// <summary>
    /// 获取当前时区信息
    /// </summary>
    /// <returns>当前时区信息</returns>
    Task<TimeZoneInfoDto> GetCurrentTimeZoneAsync();

    /// <summary>
    /// 设置时区
    /// </summary>
    /// <param name="timeZoneId">时区ID</param>
    /// <returns>设置结果</returns>
    Task<bool> SetTimeZoneAsync(string timeZoneId);

    /// <summary>
    /// 验证配置有效性
    /// </summary>
    /// <param name="category">配置类别</param>
    /// <param name="configData">配置数据</param>
    /// <returns>验证结果</returns>
    Task<(bool IsValid, string ErrorMessage)> ValidateConfigAsync(string category, object configData);

    /// <summary>
    /// 备份当前配置
    /// </summary>
    /// <returns>备份文件路径</returns>
    Task<string> BackupConfigAsync();

    /// <summary>
    /// 恢复配置
    /// </summary>
    /// <param name="backupFilePath">备份文件路径</param>
    /// <returns>恢复结果</returns>
    Task<bool> RestoreConfigAsync(string backupFilePath);

    /// <summary>
    /// 重置配置为默认值
    /// </summary>
    /// <param name="category">配置类别（可选，为空则重置所有）</param>
    /// <returns>重置结果</returns>
    Task<bool> ResetConfigAsync(string? category = null);

    /// <summary>
    /// 检查配置更改是否需要重启服务
    /// </summary>
    /// <param name="category">配置类别</param>
    /// <param name="oldConfig">旧配置</param>
    /// <param name="newConfig">新配置</param>
    /// <returns>是否需要重启</returns>
    bool RequiresRestart(string category, object oldConfig, object newConfig);
}
