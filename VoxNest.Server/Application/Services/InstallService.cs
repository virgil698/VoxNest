using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using VoxNest.Server.Application.DTOs.Install;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Extensions;
using VoxNest.Server.Shared.Results;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 安装服务实现
/// </summary>
public class InstallService : IInstallService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<InstallService> _logger;
    private const string InstallFlagFile = "install.lock";
    private const string ConfigFile = "server-config.yml";

    public InstallService(IWebHostEnvironment environment, ILogger<InstallService> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<InstallStatusDto> GetInstallStatusAsync()
    {
        var status = new InstallStatusDto
        {
            IsInstalled = IsInstalled(),
            ConfigExists = File.Exists(ConfigFile),
            CurrentStep = InstallStep.NotStarted
        };

        if (status.IsInstalled)
        {
            status.CurrentStep = InstallStep.Completed;
            return status;
        }

        // 检查配置文件
        if (!status.ConfigExists)
        {
            status.CurrentStep = InstallStep.DatabaseConfig;
            return status;
        }

        // 检查数据库连接
        try
        {
            // 在安装模式下，如果配置文件不存在，不要自动创建
            if (!File.Exists(ConfigFile))
            {
                status.CurrentStep = InstallStep.DatabaseConfig;
                return status;
            }

            // 手动读取配置文件，避免自动生成
            var yamlContent = await File.ReadAllTextAsync(ConfigFile);
            var deserializer = new YamlDotNet.Serialization.DeserializerBuilder()
                .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.UnderscoredNamingConvention.Instance)
                .Build();
            var config = deserializer.Deserialize<VoxNest.Server.Shared.Configuration.ServerConfiguration>(yamlContent);
            
            status.DatabaseConnected = await TestDatabaseConnectionInternalAsync(config.Database);
            
            if (!status.DatabaseConnected)
            {
                status.CurrentStep = InstallStep.DatabaseConfig;
                return status;
            }

            // 检查数据库是否已初始化
            var dbInitialized = await CheckDatabaseInitializedAsync(config.Database);
            if (!dbInitialized)
            {
                status.CurrentStep = InstallStep.DatabaseInit;
                return status;
            }

            // 检查是否有管理员账户
            status.HasAdminUser = await CheckAdminUserExistsAsync(config.Database);
            if (!status.HasAdminUser)
            {
                status.CurrentStep = InstallStep.CreateAdmin;
                return status;
            }

            status.CurrentStep = InstallStep.Completed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查安装状态时发生错误");
            status.CurrentStep = InstallStep.DatabaseConfig;
        }

        return status;
    }

    /// <inheritdoc/>
    public async Task<Result> TestDatabaseConnectionAsync(DatabaseConfigDto config)
    {
        try
        {
            var dbSettings = new DatabaseSettings
            {
                Provider = config.Provider,
                ConnectionString = BuildConnectionString(config),
                EnableSensitiveDataLogging = false,
                EnableDetailedErrors = false
            };

            var connected = await TestDatabaseConnectionInternalAsync(dbSettings);
            return connected ? Result.Success("数据库连接成功") : Result.Failure("数据库连接失败");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "测试数据库连接时发生错误");
            return Result.Failure($"数据库连接测试失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> SaveDatabaseConfigAsync(DatabaseConfigDto config)
    {
        try
        {
            // 测试连接
            var testResult = await TestDatabaseConnectionAsync(config);
            if (!testResult.IsSuccess)
            {
                return testResult;
            }

            // 加载或创建配置
            ServerConfiguration serverConfig;
            if (File.Exists(ConfigFile))
            {
                serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            }
            else
            {
                serverConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.CreateDefaultConfiguration();
            }

            // 更新数据库配置
            serverConfig.Database.Provider = config.Provider;
            serverConfig.Database.ConnectionString = BuildConnectionString(config);

            // 保存配置文件
            VoxNest.Server.Shared.Extensions.ConfigurationExtensions.SaveConfigurationToYaml(serverConfig, ConfigFile);

            _logger.LogInformation("数据库配置已保存");
            return Result.Success("数据库配置保存成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "保存数据库配置时发生错误");
            return Result.Failure($"保存数据库配置失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> InitializeDatabaseAsync()
    {
        try
        {
            if (!File.Exists(ConfigFile))
            {
                return Result.Failure("配置文件不存在，请先配置数据库");
            }

            var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            
            // 创建数据库上下文
            var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, config.Database);

            using var context = new VoxNestDbContext(optionsBuilder.Options);
            
            // 创建数据库
            await context.Database.EnsureCreatedAsync();
            
            // 运行种子数据
            await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);

            _logger.LogInformation("数据库初始化完成");
            return Result.Success("数据库初始化成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "初始化数据库时发生错误");
            return Result.Failure($"数据库初始化失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> CreateAdminUserAsync(CreateAdminDto adminInfo)
    {
        try
        {
            if (!File.Exists(ConfigFile))
            {
                return Result.Failure("配置文件不存在");
            }

            var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            
            var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, config.Database);

            using var context = new VoxNestDbContext(optionsBuilder.Options);

            // 检查用户名和邮箱是否已存在
            var existingUser = await context.Users
                .FirstOrDefaultAsync(u => u.Username == adminInfo.Username || u.Email == adminInfo.Email);
            
            if (existingUser != null)
            {
                return Result.Failure("用户名或邮箱已存在");
            }

            // 创建管理员用户
            var adminUser = new User
            {
                Username = adminInfo.Username,
                Email = adminInfo.Email,
                PasswordHash = HashPassword(adminInfo.Password),
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            // 先保存用户以获取ID
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            // 创建用户档案
            var userProfile = new UserProfile
            {
                UserId = adminUser.Id,
                DisplayName = adminInfo.DisplayName ?? adminInfo.Username
            };

            context.UserProfiles.Add(userProfile);

            // 查找或创建管理员角色（使用种子数据中的角色名称）
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole == null)
            {
                adminRole = new Role
                {
                    Name = "Admin",
                    Description = "系统管理员",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Roles.Add(adminRole);
                await context.SaveChangesAsync(); // 保存角色以获取ID
            }

            // 分配管理员角色
            var userRole = new UserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id,
                GrantedAt = DateTime.UtcNow
            };

            context.UserRoles.Add(userRole);
            await context.SaveChangesAsync();

            _logger.LogInformation("管理员账户创建完成: {Username}", adminInfo.Username);
            return Result.Success("管理员账户创建成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建管理员账户时发生错误");
            return Result.Failure($"创建管理员账户失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> CompleteInstallationAsync(SiteConfigDto siteConfig)
    {
        try
        {
            // 创建安装标识文件
            await File.WriteAllTextAsync(InstallFlagFile, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            
            _logger.LogInformation("VoxNest 安装完成");
            return Result.Success("安装完成，系统即将重启");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "完成安装时发生错误");
            return Result.Failure($"完成安装失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public bool IsInstalled()
    {
        return File.Exists(InstallFlagFile);
    }

    /// <inheritdoc/>
    public Task<Result> ResetInstallationAsync()
    {
        if (!_environment.IsDevelopment())
        {
            return Task.FromResult(Result.Failure("只能在开发环境下重置安装状态"));
        }

        try
        {
            if (File.Exists(InstallFlagFile))
            {
                File.Delete(InstallFlagFile);
            }

            if (File.Exists(ConfigFile))
            {
                File.Delete(ConfigFile);
            }

            _logger.LogInformation("安装状态已重置");
            return Task.FromResult(Result.Success("安装状态重置成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "重置安装状态时发生错误");
            return Task.FromResult(Result.Failure($"重置安装状态失败: {ex.Message}"));
        }
    }

    #region 私有方法

    private static string BuildConnectionString(DatabaseConfigDto config)
    {
        return config.Provider.ToUpper() switch
        {
            "MYSQL" or "MARIADB" => 
                $"Server={config.Server};Database={config.Database};User={config.Username};Password={config.Password};Port={config.Port};CharSet={config.CharSet};",
            "POSTGRESQL" => 
                $"Host={config.Server};Port={config.Port};Database={config.Database};Username={config.Username};Password={config.Password};",
            _ => throw new NotSupportedException($"不支持的数据库提供商: {config.Provider}")
        };
    }

    private static async Task<bool> TestDatabaseConnectionInternalAsync(DatabaseSettings dbSettings)
    {
        try
        {
            var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, dbSettings);

            using var context = new VoxNestDbContext(optionsBuilder.Options);
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    private static void ConfigureDbContext(DbContextOptionsBuilder optionsBuilder, DatabaseSettings dbSettings)
    {
        switch (dbSettings.Provider.ToUpper())
        {
            case "MYSQL":
            case "MARIADB":
                var serverVersion = ServerVersion.AutoDetect(dbSettings.ConnectionString);
                optionsBuilder.UseMySql(dbSettings.ConnectionString, serverVersion);
                break;
            case "POSTGRESQL":
                throw new NotSupportedException("PostgreSQL支持需要安装Npgsql.EntityFrameworkCore.PostgreSQL包");
            default:
                throw new NotSupportedException($"不支持的数据库提供商: {dbSettings.Provider}");
        }

        if (dbSettings.EnableSensitiveDataLogging)
        {
            optionsBuilder.EnableSensitiveDataLogging();
        }

        if (dbSettings.EnableDetailedErrors)
        {
            optionsBuilder.EnableDetailedErrors();
        }
    }

    private static async Task<bool> CheckDatabaseInitializedAsync(DatabaseSettings dbSettings)
    {
        try
        {
            var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, dbSettings);

            using var context = new VoxNestDbContext(optionsBuilder.Options);
            
            // 检查是否存在用户表
            return await context.Users.AnyAsync();
        }
        catch
        {
            return false;
        }
    }

    private static async Task<bool> CheckAdminUserExistsAsync(DatabaseSettings dbSettings)
    {
        try
        {
            var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, dbSettings);

            using var context = new VoxNestDbContext(optionsBuilder.Options);
            
            // 检查是否存在管理员角色的用户
            var adminExists = await context.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.Role!.Name == "Admin");

            return adminExists;
        }
        catch
        {
            return false;
        }
    }

    private static string HashPassword(string password)
    {
        // 使用BCrypt或其他安全的密码哈希算法
        // 这里简化为SHA256，实际项目应使用BCrypt
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "VoxNest_Salt"));
        return Convert.ToBase64String(hashedBytes);
    }

    #endregion
}
