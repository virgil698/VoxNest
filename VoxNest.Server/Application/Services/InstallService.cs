using Microsoft.EntityFrameworkCore;
using System.Text;
using VoxNest.Server.Application.DTOs.Install;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Extensions;
using VoxNest.Server.Shared.Results;
using BCrypt.Net;

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
    private const string DbInitFlagFile = "db-initialized.lock";

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

        // 检查数据库配置和连接状态
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
            
            VoxNest.Server.Shared.Configuration.ServerConfiguration config;
            try
            {
                config = deserializer.Deserialize<VoxNest.Server.Shared.Configuration.ServerConfiguration>(yamlContent);
                
                // 验证配置文件的完整性
                var validationResult = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.ValidateConfiguration(config);
                if (!validationResult.IsValid)
                {
                    _logger.LogWarning("配置文件验证失败，回退到数据库配置步骤: {Errors}", string.Join("; ", validationResult.Errors));
                    status.CurrentStep = InstallStep.DatabaseConfig;
                    return status;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "配置文件解析失败，回退到数据库配置步骤");
                status.CurrentStep = InstallStep.DatabaseConfig;
                return status;
            }
            
            // 测试数据库连接
            status.DatabaseConnected = await TestDatabaseConnectionInternalAsync(config.Database);
            
            // 检查数据库是否已初始化（优先检查标记文件）
            status.DatabaseInitialized = File.Exists(DbInitFlagFile);
            if (!status.DatabaseInitialized && status.DatabaseConnected)
            {
                // 如果标记文件不存在但连接成功，再检查数据库实际状态
                status.DatabaseInitialized = await CheckDatabaseInitializedAsync(config.Database);
            }
            
            // 根据实际状态决定当前步骤
            if (!status.DatabaseInitialized)
            {
                // 数据库未初始化，无论连接是否成功都保持在初始化步骤
                // 前端可以根据连接状态决定是否允许重试或提示用户检查数据库服务
                status.CurrentStep = InstallStep.DatabaseInit;
                _logger.LogInformation("数据库未初始化，当前步骤: {Step}, 连接状态: {Connected}", 
                    status.CurrentStep, status.DatabaseConnected);
                return status;
            }

            // 数据库已初始化，检查是否有管理员账户
            if (status.DatabaseConnected)
            {
                status.HasAdminUser = await CheckAdminUserExistsAsync(config.Database);
                if (!status.HasAdminUser)
                {
                    status.CurrentStep = InstallStep.CreateAdmin;
                    return status;
                }

                status.CurrentStep = InstallStep.Completed;
            }
            else
            {
                // 数据库已初始化但当前连接失败，仍保持在管理员创建步骤
                // 可能是临时网络问题
                status.HasAdminUser = false; // 无法验证，保守设置
                status.CurrentStep = InstallStep.CreateAdmin;
                _logger.LogWarning("数据库已初始化但当前连接失败，保持在管理员创建步骤");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查安装状态时发生严重错误");
            
            // 如果配置文件存在但检查过程出现严重错误
            // 根据错误类型决定是否回退到数据库配置
            if (File.Exists(ConfigFile))
            {
                _logger.LogInformation("配置文件存在但检查失败，保持在数据库初始化步骤以允许重试");
                status.CurrentStep = InstallStep.DatabaseInit;
            }
            else
            {
                status.CurrentStep = InstallStep.DatabaseConfig;
            }
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

            // 检查是否已经初始化
            if (File.Exists(DbInitFlagFile))
            {
                _logger.LogInformation("数据库已经初始化完成");
                return Result.Success("数据库已初始化");
            }

            // 尝试直接初始化数据库（不强制重新初始化）
            _logger.LogInformation("开始直接初始化数据库...");
            var directResult = await InitializeDatabaseDirectAsync(false);
            if (directResult.IsSuccess)
            {
                return directResult;
            }

            // 如果直接初始化失败，回退到热重载机制
            _logger.LogWarning("直接初始化失败，回退到热重载机制: {Error}", directResult.Message);
            _logger.LogInformation("等待配置文件热重载机制初始化数据库...");
            
            // 等待数据库初始化完成（最多等待30秒）
            var timeout = TimeSpan.FromSeconds(30);
            var startTime = DateTime.UtcNow;
            
            while (DateTime.UtcNow - startTime < timeout)
            {
                if (File.Exists(DbInitFlagFile))
                {
                    _logger.LogInformation("数据库初始化完成");
                    return Result.Success("数据库初始化成功");
                }
                
                await Task.Delay(500); // 每500ms检查一次
            }
            
            return Result.Failure($"数据库初始化超时。直接初始化错误：{directResult.Message}。请检查配置文件和数据库连接");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库初始化时发生错误");
            return Result.Failure($"数据库初始化失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 直接初始化数据库（不依赖热重载）
    /// </summary>
    /// <param name="forceReinitialize">是否强制重新初始化，忽略已存在的标记文件</param>
    /// <returns></returns>
    public async Task<Result> InitializeDatabaseDirectAsync(bool forceReinitialize = false)
    {
        try
        {
            if (!File.Exists(ConfigFile))
            {
                return Result.Failure("配置文件不存在，请先配置数据库");
            }

            // 检查是否已经初始化（除非强制重新初始化）
            if (!forceReinitialize && File.Exists(DbInitFlagFile))
            {
                _logger.LogInformation("数据库已经初始化完成");
                return Result.Success("数据库已初始化");
            }

            // 如果强制重新初始化，先清理现有标记文件
            if (forceReinitialize && File.Exists(DbInitFlagFile))
            {
                _logger.LogInformation("强制重新初始化，清理现有标记文件");
                File.Delete(DbInitFlagFile);
            }

            _logger.LogInformation("开始直接数据库初始化流程...");

            // 加载配置文件
            var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            
            // 验证配置
            var (isValid, errors) = config.ValidateConfiguration();
            if (!isValid)
            {
                var errorMessage = $"配置文件验证失败: {string.Join("; ", errors)}";
                _logger.LogError(errorMessage);
                return Result.Failure(errorMessage);
            }

            // 测试数据库连接
            _logger.LogInformation("测试数据库连接...");
            var connectionResult = await TestDatabaseConnectionInternalAsync(config.Database);
            if (!connectionResult)
            {
                return Result.Failure("数据库连接失败，请检查配置信息");
            }
            _logger.LogInformation("数据库连接测试成功");

            // 创建数据库上下文选项
            var optionsBuilder = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<VoxNest.Server.Infrastructure.Persistence.Contexts.VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, config.Database);

            // 初始化数据库
            using var context = new VoxNest.Server.Infrastructure.Persistence.Contexts.VoxNestDbContext(optionsBuilder.Options);
            
            _logger.LogInformation("开始创建数据库表结构...");
            
            // 先检查数据库连接
            var databaseExists = await context.Database.CanConnectAsync();
            if (!databaseExists)
            {
                _logger.LogError("无法连接到数据库，请检查连接配置");
                throw new InvalidOperationException("无法连接到数据库");
            }
            
            _logger.LogInformation("数据库连接正常，开始检查和创建表结构...");
            
            // 使用更强健的表创建方法
            await EnsureTablesCreatedAsync(context, _logger);
            
            // 验证关键表是否已创建
            await ValidateTablesCreated(context);
            _logger.LogInformation("数据库表结构创建并验证完成");
            
            _logger.LogInformation("开始植入种子数据...");
            await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);
            _logger.LogInformation("种子数据植入完成");
            
            // 验证种子数据是否成功植入
            await ValidateSeedData(context);
            _logger.LogInformation("种子数据验证完成");

            // 创建初始化完成标记文件
            var initInfo = new
            {
                InitializedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                ConfigFile = ConfigFile,
                DatabaseProvider = config.Database.Provider,
                InitMethod = "Direct"
            };

            await File.WriteAllTextAsync(DbInitFlagFile, System.Text.Json.JsonSerializer.Serialize(initInfo, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
            
            _logger.LogInformation("数据库初始化完成，标记文件已创建");
            return Result.Success("数据库初始化成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "直接数据库初始化失败");
            return Result.Failure($"直接数据库初始化失败: {ex.Message}");
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
            
            // 首先验证数据库连接和表结构
            _logger.LogInformation("验证数据库连接和表结构...");
            if (!await context.Database.CanConnectAsync())
            {
                return Result.Failure("无法连接到数据库，请检查数据库服务是否正常运行");
            }
            
            // 验证关键表是否存在
            try
            {
                var roleExists = await context.Roles.AnyAsync();
                var userTableExists = await context.Users.AnyAsync();
                _logger.LogInformation("数据库表验证通过 - Roles表存在: {RoleExists}, Users表存在: {UserExists}", 
                    roleExists, userTableExists);
            }
            catch (Exception tableEx)
            {
                _logger.LogError(tableEx, "数据库表验证失败");
                return Result.Failure($"数据库表结构不完整，请重新运行数据库初始化。错误详情: {tableEx.Message}");
            }

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

    /// <inheritdoc/>
    public async Task<object> DiagnoseDatabaseAsync()
    {
        var configFileExists = File.Exists(ConfigFile);
        var configFileReadable = false;
        var configFileValid = false;
        var configFileError = string.Empty;
        var databaseConnected = false;
        var databaseProvider = string.Empty;
        var databaseConnectionString = string.Empty;
        var databaseError = string.Empty;
        var tables = new Dictionary<string, object>();
        var seedData = new Dictionary<string, object>();

        try
        {
            // 检查配置文件
            if (configFileExists)
            {
                try
                {
                    var yamlContent = await File.ReadAllTextAsync(ConfigFile);
                    var deserializer = new YamlDotNet.Serialization.DeserializerBuilder()
                        .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.UnderscoredNamingConvention.Instance)
                        .Build();
                    var config = deserializer.Deserialize<VoxNest.Server.Shared.Configuration.ServerConfiguration>(yamlContent);
                    
                    configFileReadable = true;
                    configFileValid = true;
                    
                    // 验证配置
                    var validationResult = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.ValidateConfiguration(config);
                    if (!validationResult.IsValid)
                    {
                        configFileValid = false;
                        configFileError = string.Join("; ", validationResult.Errors);
                    }
                    else
                    {
                        databaseProvider = config.Database.Provider;
                        databaseConnectionString = MaskConnectionString(config.Database.ConnectionString);

                        // 检查数据库连接
                        var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
                        ConfigureDbContext(optionsBuilder, config.Database);

                        using var context = new VoxNestDbContext(optionsBuilder.Options);
                        
                        databaseConnected = await context.Database.CanConnectAsync();
                        
                        if (databaseConnected)
                        {
                            // 检查各个表
                            tables["Users"] = await CheckTableAsync(context, () => context.Users.CountAsync());
                            tables["Roles"] = await CheckTableAsync(context, () => context.Roles.CountAsync());
                            tables["Permissions"] = await CheckTableAsync(context, () => context.Permissions.CountAsync());
                            tables["UserRoles"] = await CheckTableAsync(context, () => context.UserRoles.CountAsync());
                            tables["RolePermissions"] = await CheckTableAsync(context, () => context.RolePermissions.CountAsync());
                            tables["UserProfiles"] = await CheckTableAsync(context, () => context.UserProfiles.CountAsync());
                            tables["Posts"] = await CheckTableAsync(context, () => context.Posts.CountAsync());
                            tables["Categories"] = await CheckTableAsync(context, () => context.Categories.CountAsync());
                            tables["Tags"] = await CheckTableAsync(context, () => context.Tags.CountAsync());
                            tables["PostTags"] = await CheckTableAsync(context, () => context.PostTags.CountAsync());
                            tables["Comments"] = await CheckTableAsync(context, () => context.Comments.CountAsync());

                            // 检查种子数据
                            try
                            {
                                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
                                seedData["AdminRole"] = new { exists = adminRole != null, id = adminRole?.Id };
                                
                                var permissionCount = await context.Permissions.CountAsync();
                                seedData["Permissions"] = new { count = permissionCount, hasData = permissionCount > 0 };
                                
                                var rolePermissionCount = await context.RolePermissions.CountAsync();
                                seedData["RolePermissions"] = new { count = rolePermissionCount, hasData = rolePermissionCount > 0 };
                            }
                            catch (Exception seedEx)
                            {
                                seedData["error"] = seedEx.Message;
                            }
                        }
                    }
                }
                catch (Exception configEx)
                {
                    configFileReadable = false;
                    configFileError = configEx.Message;
                }
            }
            else
            {
                configFileError = "配置文件不存在";
            }
        }
        catch (Exception ex)
        {
            databaseError = ex.Message;
            _logger.LogError(ex, "数据库诊断过程中发生错误");
        }

        return new
        {
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
            configFile = new
            {
                exists = configFileExists,
                path = ConfigFile,
                readable = configFileReadable,
                validConfig = configFileValid,
                errorMessage = string.IsNullOrEmpty(configFileError) ? null : configFileError
            },
            database = new
            {
                connected = databaseConnected,
                connectionString = string.IsNullOrEmpty(databaseConnectionString) ? null : databaseConnectionString,
                provider = string.IsNullOrEmpty(databaseProvider) ? null : databaseProvider,
                errorMessage = string.IsNullOrEmpty(databaseError) ? null : databaseError
            },
            tables = tables,
            seedData = seedData
        };
    }

    /// <summary>
    /// 检查单个表的状态
    /// </summary>
    private static async Task<object> CheckTableAsync(VoxNestDbContext context, Func<Task<int>> countFunc)
    {
        try
        {
            var count = await countFunc();
            return new { exists = true, count = count };
        }
        catch (Exception ex)
        {
            return new { exists = false, error = ex.Message };
        }
    }

    /// <summary>
    /// 掩码连接字符串中的敏感信息
    /// </summary>
    private static string MaskConnectionString(string connectionString)
    {
        if (string.IsNullOrEmpty(connectionString))
            return connectionString;

        return System.Text.RegularExpressions.Regex.Replace(connectionString, 
            @"(Password|Pwd)=([^;]*)", 
            "$1=***", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    /// <inheritdoc/>
    public async Task<Result> RepairDatabaseAsync()
    {
        try
        {
            if (!File.Exists(ConfigFile))
            {
                return Result.Failure("配置文件不存在，请先配置数据库");
            }

            _logger.LogInformation("开始修复数据库结构...");

            // 加载配置
            var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            
            // 验证配置
            var validationResult = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.ValidateConfiguration(config);
            if (!validationResult.IsValid)
            {
                return Result.Failure($"配置文件无效: {string.Join("; ", validationResult.Errors)}");
            }

            // 创建数据库上下文选项
            var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
            ConfigureDbContext(optionsBuilder, config.Database);

            using var context = new VoxNestDbContext(optionsBuilder.Options);
            
            // 测试连接
            if (!await context.Database.CanConnectAsync())
            {
                return Result.Failure("无法连接到数据库，请检查数据库服务和连接配置");
            }

            _logger.LogInformation("开始修复数据库表结构...");
            
            // 删除现有数据库并重新创建
            _logger.LogWarning("正在删除现有数据库以确保表结构一致性");
            await context.Database.EnsureDeletedAsync();
            _logger.LogInformation("已删除现有数据库");
            
            // 重新创建数据库
            await context.Database.EnsureCreatedAsync();
            _logger.LogInformation("已重新创建数据库");
            
            // 验证表是否正确创建
            await ValidateTablesCreated(context);
            _logger.LogInformation("数据库表结构验证通过");
            
            // 重新植入种子数据
            _logger.LogInformation("开始重新植入种子数据...");
            await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);
            _logger.LogInformation("种子数据植入完成");
            
            // 验证种子数据
            await ValidateSeedData(context);
            _logger.LogInformation("种子数据验证通过");

            // 重新创建数据库初始化标记文件
            var initInfo = new
            {
                InitializedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                ConfigFile = ConfigFile,
                DatabaseProvider = config.Database.Provider,
                InitMethod = "Repair"
            };

            await File.WriteAllTextAsync(DbInitFlagFile, System.Text.Json.JsonSerializer.Serialize(initInfo, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));

            _logger.LogInformation("数据库修复完成");
            return Result.Success("数据库结构修复成功，所有表和种子数据已重新创建");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "修复数据库失败");
            return Result.Failure($"修复数据库失败: {ex.Message}");
        }
    }

    #region 私有方法

    private static string BuildConnectionString(DatabaseConfigDto config)
    {
        return config.Provider.ToUpper() switch
        {
            "MYSQL" or "MARIADB" => 
                $"Server={config.Server};Database={config.Database};User={config.Username};Password={config.Password};Port={config.Port};CharSet={config.CharSet};",
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
        // 使用BCrypt安全哈希算法，与AuthService保持一致
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// 验证数据库表是否已创建
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    private static async Task ValidateTablesCreated(VoxNest.Server.Infrastructure.Persistence.Contexts.VoxNestDbContext context)
    {
        var logger = Microsoft.Extensions.Logging.LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("TableValidation");
        
        try
        {
            // 尝试查询各个表以验证它们存在
            logger.LogInformation("验证用户相关表...");
            var userCount = await context.Users.CountAsync();
            logger.LogInformation("Users表验证成功，当前记录数：{Count}", userCount);
            
            var roleCount = await context.Roles.CountAsync();
            logger.LogInformation("Roles表验证成功，当前记录数：{Count}", roleCount);
            
            var permissionCount = await context.Permissions.CountAsync();
            logger.LogInformation("Permissions表验证成功，当前记录数：{Count}", permissionCount);
            
            var userRoleCount = await context.UserRoles.CountAsync();
            logger.LogInformation("UserRoles表验证成功，当前记录数：{Count}", userRoleCount);
            
            var rolePermissionCount = await context.RolePermissions.CountAsync();
            logger.LogInformation("RolePermissions表验证成功，当前记录数：{Count}", rolePermissionCount);
            
            var userProfileCount = await context.UserProfiles.CountAsync();
            logger.LogInformation("UserProfiles表验证成功，当前记录数：{Count}", userProfileCount);
            
            // 验证内容相关表
            logger.LogInformation("验证内容相关表...");
            var postCount = await context.Posts.CountAsync();
            logger.LogInformation("Posts表验证成功，当前记录数：{Count}", postCount);
            
            var categoryCount = await context.Categories.CountAsync();
            logger.LogInformation("Categories表验证成功，当前记录数：{Count}", categoryCount);
            
            var tagCount = await context.Tags.CountAsync();
            logger.LogInformation("Tags表验证成功，当前记录数：{Count}", tagCount);
            
            var postTagCount = await context.PostTags.CountAsync();
            logger.LogInformation("PostTags表验证成功，当前记录数：{Count}", postTagCount);
            
            var commentCount = await context.Comments.CountAsync();
            logger.LogInformation("Comments表验证成功，当前记录数：{Count}", commentCount);
            
            logger.LogInformation("所有核心数据表验证通过");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "数据表验证失败");
            throw new InvalidOperationException($"数据库表创建验证失败: {ex.Message}", ex);
        }
    }
    
    /// <summary>
    /// 验证种子数据是否正确植入
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    private static async Task ValidateSeedData(VoxNest.Server.Infrastructure.Persistence.Contexts.VoxNestDbContext context)
    {
        var logger = Microsoft.Extensions.Logging.LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("SeedValidation");
        
        try
        {
            // 验证角色数据
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole == null)
            {
                throw new InvalidOperationException("Admin角色未找到，种子数据植入失败");
            }
            logger.LogInformation("Admin角色验证成功，ID: {RoleId}", adminRole.Id);
            
            var moderatorRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Moderator");
            if (moderatorRole == null)
            {
                throw new InvalidOperationException("Moderator角色未找到，种子数据植入失败");
            }
            logger.LogInformation("Moderator角色验证成功，ID: {RoleId}", moderatorRole.Id);
            
            var userRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            if (userRole == null)
            {
                throw new InvalidOperationException("User角色未找到，种子数据植入失败");
            }
            logger.LogInformation("User角色验证成功，ID: {RoleId}", userRole.Id);
            
            // 验证权限数据
            var permissionCount = await context.Permissions.CountAsync();
            if (permissionCount == 0)
            {
                throw new InvalidOperationException("没有找到任何权限数据，种子数据植入失败");
            }
            logger.LogInformation("权限数据验证成功，总数: {Count}", permissionCount);
            
            // 验证角色权限关联
            var rolePermissionCount = await context.RolePermissions.CountAsync();
            if (rolePermissionCount == 0)
            {
                throw new InvalidOperationException("没有找到角色权限关联数据，种子数据植入失败");
            }
            logger.LogInformation("角色权限关联验证成功，总数: {Count}", rolePermissionCount);
            
            logger.LogInformation("所有种子数据验证通过");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "种子数据验证失败");
            throw new InvalidOperationException($"种子数据验证失败: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// 确保数据库表被创建（更强健的方法）
    /// </summary>
    private static async Task EnsureTablesCreatedAsync(VoxNestDbContext context, ILogger logger)
    {
        try
        {
            // 先尝试标准的EnsureCreated
            logger.LogInformation("尝试使用EnsureCreatedAsync创建表结构...");
            var created = await context.Database.EnsureCreatedAsync();
            logger.LogInformation("EnsureCreatedAsync完成，返回值: {Created}", created);
            
            // 检查关键表是否真正创建
            var missingTables = await CheckMissingTablesAsync(context, logger);
            if (missingTables.Count > 0)
            {
                logger.LogWarning("发现缺失的表: {MissingTables}，尝试手动创建", string.Join(", ", missingTables));
                
                // 如果有缺失的表，尝试手动创建
                await CreateMissingTablesManuallyAsync(context, missingTables, logger);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "数据库表创建失败");
            throw new InvalidOperationException($"数据库表创建失败: {ex.Message}", ex);
        }
    }
    
    /// <summary>
    /// 检查缺失的表
    /// </summary>
    private static async Task<List<string>> CheckMissingTablesAsync(VoxNestDbContext context, ILogger logger)
    {
        var missingTables = new List<string>();
        var expectedTables = new Dictionary<string, Func<Task<bool>>>
        {
            ["Users"] = async () => await TableExistsAsync(context, () => context.Users.CountAsync()),
            ["Roles"] = async () => await TableExistsAsync(context, () => context.Roles.CountAsync()),
            ["Permissions"] = async () => await TableExistsAsync(context, () => context.Permissions.CountAsync()),
            ["UserRoles"] = async () => await TableExistsAsync(context, () => context.UserRoles.CountAsync()),
            ["RolePermissions"] = async () => await TableExistsAsync(context, () => context.RolePermissions.CountAsync()),
            ["UserProfiles"] = async () => await TableExistsAsync(context, () => context.UserProfiles.CountAsync()),
            ["Posts"] = async () => await TableExistsAsync(context, () => context.Posts.CountAsync()),
            ["Categories"] = async () => await TableExistsAsync(context, () => context.Categories.CountAsync()),
            ["Tags"] = async () => await TableExistsAsync(context, () => context.Tags.CountAsync()),
            ["PostTags"] = async () => await TableExistsAsync(context, () => context.PostTags.CountAsync()),
            ["Comments"] = async () => await TableExistsAsync(context, () => context.Comments.CountAsync())
        };
        
        foreach (var table in expectedTables)
        {
            try
            {
                var exists = await table.Value();
                logger.LogInformation("表 {TableName} 存在状态: {Exists}", table.Key, exists);
                if (!exists)
                {
                    missingTables.Add(table.Key);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "检查表 {TableName} 时出错，认为表不存在", table.Key);
                missingTables.Add(table.Key);
            }
        }
        
        return missingTables;
    }
    
    /// <summary>
    /// 检查表是否存在
    /// </summary>
    private static async Task<bool> TableExistsAsync(VoxNestDbContext context, Func<Task<int>> countFunc)
    {
        try
        {
            await countFunc();
            return true;
        }
        catch
        {
            return false;
        }
    }
    
    /// <summary>
    /// 手动创建缺失的表
    /// </summary>
    private static async Task CreateMissingTablesManuallyAsync(VoxNestDbContext context, List<string> missingTables, ILogger logger)
    {
        logger.LogInformation("开始手动创建缺失的表: {Tables}", string.Join(", ", missingTables));
        
        try
        {
            // 删除现有数据库并重新创建（确保一致性）
            logger.LogWarning("检测到表结构不完整，将重新创建整个数据库以确保一致性");
            
            // 先删除数据库
            await context.Database.EnsureDeletedAsync();
            logger.LogInformation("已删除现有数据库");
            
            // 重新创建数据库
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("已重新创建数据库");
            
            // 再次验证
            var stillMissing = await CheckMissingTablesAsync(context, logger);
            if (stillMissing.Count > 0)
            {
                throw new InvalidOperationException($"重新创建数据库后仍有表缺失: {string.Join(", ", stillMissing)}");
            }
            
            logger.LogInformation("数据库重新创建成功，所有表已正确创建");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "手动创建表失败");
            throw new InvalidOperationException($"手动创建表失败: {ex.Message}", ex);
        }
    }

    #endregion
}
