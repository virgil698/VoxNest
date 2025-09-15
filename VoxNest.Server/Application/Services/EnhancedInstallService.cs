using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using System.Text;
using VoxNest.Server.Application.DTOs.Install;
using VoxNest.Server.Application.DTOs.Auth;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Extensions;
using VoxNest.Server.Shared.Results;
using BCrypt.Net;
using AutoMapper;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 增强版安装服务实现
/// </summary>
public class EnhancedInstallService : IInstallService
{
    private readonly IInstallationDbContextService? _installationDbContextService;
    private readonly IDbContextFactory<VoxNestDbContext>? _contextFactory;
    private readonly IInstallLockService _lockService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<EnhancedInstallService> _logger;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IMapper _mapper;
    private readonly ServerConfiguration _serverConfig;
    private readonly IConfigurationReloadService? _configurationReloadService;
    
    private const string InstallFlagFile = "install.lock";
    private const string ConfigFile = "server-config.yml";
    private const string DbInitFlagFile = "db-initialized.lock";

    public EnhancedInstallService(
        IInstallLockService lockService,
        IWebHostEnvironment environment,
        ILogger<EnhancedInstallService> logger,
        IJwtTokenService jwtTokenService,
        IMapper mapper,
        ServerConfiguration serverConfig,
        IInstallationDbContextService? installationDbContextService = null,
        IDbContextFactory<VoxNestDbContext>? contextFactory = null,
        IConfigurationReloadService? configurationReloadService = null)
    {
        _lockService = lockService;
        _environment = environment;
        _logger = logger;
        _jwtTokenService = jwtTokenService;
        _mapper = mapper;
        _serverConfig = serverConfig;
        _configurationReloadService = configurationReloadService;
        _installationDbContextService = installationDbContextService;
        _contextFactory = contextFactory;
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

        try
        {
            // 检查配置文件是否存在且包含有效的数据库连接
            if (!status.ConfigExists)
            {
                status.CurrentStep = InstallStep.DatabaseConfig;
                return status;
            }

            // 检查配置文件中是否有有效的数据库连接字符串
            try
            {
                var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
                if (string.IsNullOrWhiteSpace(config.Database.ConnectionString))
                {
                    _logger.LogDebug("配置文件存在但数据库连接字符串为空，需要用户配置");
                    status.CurrentStep = InstallStep.DatabaseConfig;
                    return status;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "配置文件格式有误，需要重新配置");
                status.CurrentStep = InstallStep.DatabaseConfig;
                return status;
            }

            // 检查数据库状态（优先数据库状态而非文件标记）
            var dbStatus = await CheckDatabaseStatusAsync();
            
            status.DatabaseConnected = dbStatus.Connected;
            status.DatabaseInitialized = dbStatus.Initialized;
            status.HasAdminUser = dbStatus.HasAdmin;

            // 根据数据库状态决定当前步骤
            if (!status.DatabaseInitialized)
            {
                status.CurrentStep = InstallStep.DatabaseInit;
            }
            else if (!status.HasAdminUser)
            {
                status.CurrentStep = InstallStep.CreateAdmin;
            }
            else
            {
                status.CurrentStep = InstallStep.Completed;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查安装状态时发生错误");
            // 出错时保守设置到数据库配置步骤
            status.CurrentStep = status.ConfigExists ? InstallStep.DatabaseInit : InstallStep.DatabaseConfig;
        }

        return status;
    }

    /// <inheritdoc/>
    public async Task<Result> TestDatabaseConnectionAsync(DatabaseConfigDto config)
    {
        try
        {
            var connectionString = BuildConnectionString(config);
            using var connection = new MySqlConnection(connectionString);
            
            await connection.OpenAsync();
            await connection.CloseAsync();
            
            _logger.LogInformation("数据库连接测试成功: {Server}:{Port}/{Database}", config.Server, config.Port, config.Database);
            return Result.Success("数据库连接成功");
        }
        catch (MySqlException ex)
        {
            _logger.LogError(ex, "MySQL连接失败: {ErrorCode}", ex.ErrorCode);
            return ex.ErrorCode switch
            {
                MySqlErrorCode.UnableToConnectToHost => Result.Failure("无法连接到MySQL服务器，请检查服务器地址和端口"),
                MySqlErrorCode.AccessDenied => Result.Failure("数据库访问被拒绝，请检查用户名和密码"),
                MySqlErrorCode.UnknownDatabase => Result.Failure("指定的数据库不存在，请检查数据库名称"),
                _ => Result.Failure($"MySQL连接错误: {ex.Message}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库连接测试失败");
            return Result.Failure($"数据库连接失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> SaveDatabaseConfigAsync(DatabaseConfigDto config)
    {
        var lockResult = await _lockService.AcquireLockAsync("save_database_config", 30);
        if (!lockResult.IsSuccess)
        {
            return Result.Failure(lockResult.Message);
        }

        await using var lockObj = lockResult.Data!;

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

            // 验证配置文件是否成功保存并包含正确的连接字符串
            try
            {
                var savedConfig = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
                if (string.IsNullOrWhiteSpace(savedConfig.Database.ConnectionString) || 
                    savedConfig.Database.ConnectionString != BuildConnectionString(config))
                {
                    _logger.LogWarning("保存的配置文件验证失败，连接字符串不匹配");
                    return Result.Failure("配置文件保存验证失败，请重试");
                }
                
                _logger.LogInformation("数据库配置已保存并验证通过");
                _logger.LogDebug("连接字符串: {ConnectionString}", savedConfig.Database.ConnectionString.Substring(0, Math.Min(50, savedConfig.Database.ConnectionString.Length)) + "...");
                
                // 给系统一些时间来处理文件更新
                await Task.Delay(1000);
                
                // 再次测试连接以确保配置已生效
                var finalTest = await TestDatabaseConnectionAsync(config);
                if (!finalTest.IsSuccess)
                {
                    _logger.LogWarning("配置保存后的最终连接测试失败: {Message}", finalTest.Message);
                    return Result.Failure($"配置已保存但连接测试失败: {finalTest.Message}。请检查数据库服务是否正常运行");
                }
                
                _logger.LogInformation("数据库配置保存成功，连接测试通过");
                return Result.Success("数据库配置保存成功，配置文件已更新并验证");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证保存的配置文件时出错");
                return Result.Failure("配置文件保存后验证失败，请检查文件权限");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "保存数据库配置失败");
            return Result.Failure($"保存数据库配置失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> InitializeDatabaseAsync()
    {
        return await InitializeDatabaseDirectAsync(false);
    }

    /// <inheritdoc/>
    public async Task<Result> InitializeDatabaseDirectAsync(bool forceReinitialize = false)
    {
        var lockResult = await _lockService.AcquireLockAsync("database_initialization", 120);
        if (!lockResult.IsSuccess)
        {
            return Result.Failure(lockResult.Message);
        }

        await using var lockObj = lockResult.Data!;

        try
        {
            if (!File.Exists(ConfigFile))
            {
                return Result.Failure("配置文件不存在，请先配置数据库");
            }

            // 检查是否已经初始化（除非强制重新初始化）
            if (!forceReinitialize)
            {
                var dbStatus = await CheckDatabaseStatusAsync();
                if (dbStatus.Initialized)
                {
                    _logger.LogInformation("数据库已经初始化完成");
                    // 确保标记文件存在
                    await CreateInitializationFlagAsync();
                    return Result.Success("数据库已初始化");
                }
            }

            _logger.LogInformation("开始数据库初始化流程...");

            // 重新加载配置文件以确保获取最新的数据库配置
            _logger.LogDebug("重新加载配置文件: {ConfigFile}", ConfigFile);
            var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            
            // 验证数据库连接字符串不为空
            if (string.IsNullOrWhiteSpace(config.Database.ConnectionString))
            {
                _logger.LogError("配置文件中的数据库连接字符串为空");
                return Result.Failure("数据库连接字符串未配置，请先完成数据库配置步骤");
            }
            
            _logger.LogDebug("使用数据库连接: Provider={Provider}, ConnectionString前缀={ConnectionPrefix}", 
                config.Database.Provider, 
                config.Database.ConnectionString.Substring(0, Math.Min(30, config.Database.ConnectionString.Length)) + "...");
            
            // 验证配置
            var (isValid, errors) = config.ValidateConfiguration();
            if (!isValid)
            {
                var errorMessage = $"配置文件验证失败: {string.Join("; ", errors)}";
                _logger.LogError(errorMessage);
                return Result.Failure(errorMessage);
            }

            // 执行数据库初始化
            var initResult = await PerformDatabaseInitializationAsync(config, forceReinitialize);
            if (!initResult.IsSuccess)
            {
                return initResult;
            }

            // 创建初始化完成标记
            await CreateInitializationFlagAsync();
            
            _logger.LogInformation("数据库初始化完成");
            
            // 检查是否需要重载配置
            await TriggerConfigurationReloadIfNeededAsync();
            
            return Result.Success("数据库初始化成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库初始化失败");
            return Result.Failure($"数据库初始化失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result<CreateAdminResponseDto>> CreateAdminUserAsync(CreateAdminDto adminInfo)
    {
        var lockResult = await _lockService.AcquireLockAsync("create_admin_user", 60);
        if (!lockResult.IsSuccess)
        {
            return Result<CreateAdminResponseDto>.Failure(lockResult.Message);
        }

        await using var lockObj = lockResult.Data!;

        try
        {
            if (!File.Exists(ConfigFile))
            {
                return Result<CreateAdminResponseDto>.Failure("配置文件不存在");
            }

            using var context = await CreateDbContextAsync();
            
            // 验证数据库连接和表结构
            var dbValidation = await ValidateDatabaseStructureAsync(context);
            if (!dbValidation.IsSuccess)
            {
                return Result<CreateAdminResponseDto>.Failure(dbValidation.Message);
            }

            // 检查用户名和邮箱是否已存在
            var existingUser = await context.Users
                .FirstOrDefaultAsync(u => u.Username == adminInfo.Username || u.Email == adminInfo.Email);
            
            if (existingUser != null)
            {
                var conflict = existingUser.Username == adminInfo.Username ? "用户名" : "邮箱";
                return Result<CreateAdminResponseDto>.Failure($"{conflict}已存在，请选择其他{conflict}");
            }

            // 创建管理员用户
            var result = await CreateAdminUserInternalAsync(context, adminInfo);
            if (!result.IsSuccess)
            {
                return Result<CreateAdminResponseDto>.Failure(result.Message);
            }

            // 获取创建的用户完整信息（包含角色等）
            var adminUser = await context.Users
                .Include(u => u.Profile)
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == adminInfo.Username);

            if (adminUser == null)
            {
                return Result<CreateAdminResponseDto>.Failure("无法获取创建的管理员用户信息");
            }

            // 生成JWT令牌
            var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(adminUser);
            
            // 更新最后登录时间
            adminUser.LastLoginAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            // 映射用户DTO
            var userDto = _mapper.Map<UserDto>(adminUser);

            // 创建登录响应数据
            var authData = new LoginResponseDto
            {
                AccessToken = accessToken,
                TokenType = "Bearer",
                ExpiresIn = _serverConfig.Jwt.ExpireMinutes * 60,
                User = userDto
            };

            // 创建成功响应
            var response = CreateAdminResponseDto.CreateSuccess("管理员账户创建成功", authData);

            _logger.LogInformation("管理员账户创建完成并已自动登录: {Username}", adminInfo.Username);
            return Result<CreateAdminResponseDto>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建管理员账户失败");
            return Result<CreateAdminResponseDto>.Failure($"创建管理员账户失败: {ex.Message}");
        }
    }

    /// <inheritdoc/>
    public async Task<Result> CompleteInstallationAsync(SiteConfigDto siteConfig)
    {
        var lockResult = await _lockService.AcquireLockAsync("complete_installation", 30);
        if (!lockResult.IsSuccess)
        {
            return Result.Failure(lockResult.Message);
        }

        await using var lockObj = lockResult.Data!;

        try
        {
            // 最后验证安装状态
            var finalStatus = await GetInstallStatusAsync();
            if (!finalStatus.DatabaseInitialized || !finalStatus.HasAdminUser)
            {
                return Result.Failure("安装未完成，请确保数据库已初始化且已创建管理员账户");
            }

            // 创建安装标识文件
            var installInfo = new
            {
                IsInstalled = true,
                InstalledAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                SiteName = siteConfig.SiteName,
                AdminEmail = siteConfig.AdminEmail,
                Version = GetType().Assembly.GetName().Version?.ToString() ?? "Unknown",
                ConfigFile = ConfigFile,
                DatabaseInitialized = true,
                HasAdminUser = true
            };

            var installInfoJson = System.Text.Json.JsonSerializer.Serialize(installInfo, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(InstallFlagFile, installInfoJson);
            
            // 验证安装锁文件是否成功创建
            if (File.Exists(InstallFlagFile))
            {
                _logger.LogInformation("✅ 安装锁文件创建成功: {InstallFlagFile}", InstallFlagFile);
            }
            else
            {
                _logger.LogError("❌ 安装锁文件创建失败: {InstallFlagFile}", InstallFlagFile);
                return Result.Failure("安装锁文件创建失败，安装可能未完全成功");
            }
            
            _logger.LogInformation("VoxNest 安装完成: {SiteName}", siteConfig.SiteName);
            return Result.Success("安装完成，系统即将重启");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "完成安装失败");
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
            // 删除标记文件
            var filesToDelete = new[] { InstallFlagFile, ConfigFile, DbInitFlagFile };
            foreach (var file in filesToDelete)
            {
                if (File.Exists(file))
                {
                    File.Delete(file);
                    _logger.LogInformation("已删除文件: {File}", file);
                }
            }

            _logger.LogInformation("安装状态已重置");
            return Task.FromResult(Result.Success("安装状态重置成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "重置安装状态失败");
            return Task.FromResult(Result.Failure($"重置安装状态失败: {ex.Message}"));
        }
    }

    /// <inheritdoc/>
    public async Task<object> DiagnoseDatabaseAsync()
    {
        var diagnosis = new
        {
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
            ConfigFile = await DiagnoseConfigFileAsync(),
            Database = await DiagnoseDatabaseConnectionAsync(),
            Installation = await DiagnoseInstallationStatusAsync()
        };

        return diagnosis;
    }

    /// <inheritdoc/>
    public async Task<Result> RepairDatabaseAsync()
    {
        var lockResult = await _lockService.AcquireLockAsync("repair_database", 300);
        if (!lockResult.IsSuccess)
        {
            return Result.Failure(lockResult.Message);
        }

        await using var lockObj = lockResult.Data!;

        try
        {
            _logger.LogInformation("开始数据库修复流程...");

            // 强制重新初始化数据库
            var repairResult = await InitializeDatabaseDirectAsync(true);
            if (!repairResult.IsSuccess)
            {
                return repairResult;
            }

            _logger.LogInformation("数据库修复完成");
            return Result.Success("数据库修复成功，所有表和种子数据已重新创建");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库修复失败");
            return Result.Failure($"数据库修复失败: {ex.Message}");
        }
    }

    #region Private Methods

    /// <summary>
    /// 检查数据库状态
    /// </summary>
    private async Task<(bool Connected, bool Initialized, bool HasAdmin)> CheckDatabaseStatusAsync()
    {
        try
        {
            if (!File.Exists(ConfigFile))
            {
                _logger.LogDebug("配置文件不存在: {ConfigFile}", ConfigFile);
                return (false, false, false);
            }

            // 重新加载配置文件以确保获取最新配置
            var config = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.LoadServerConfigurationFromYaml(ConfigFile);
            
            // 检查连接字符串是否为空
            if (string.IsNullOrWhiteSpace(config.Database.ConnectionString))
            {
                _logger.LogDebug("配置文件中数据库连接字符串为空");
                return (false, false, false);
            }
            
            // 测试连接
            var connectionResult = await TestConnectionInternalAsync(config.Database.ConnectionString);
            if (!connectionResult)
            {
                _logger.LogDebug("数据库连接测试失败");
                return (false, false, false);
            }

            // 检查数据库初始化状态
            using var context = await CreateDbContextAsync();
            
            var initialized = await CheckTablesExistAsync(context);
            var hasAdmin = false;

            if (initialized)
            {
                hasAdmin = await CheckAdminExistsAsync(context);
            }

            return (true, initialized, hasAdmin);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查数据库状态失败");
            return (false, false, false);
        }
    }

    /// <summary>
    /// 执行数据库初始化
    /// </summary>
    private async Task<Result> PerformDatabaseInitializationAsync(ServerConfiguration config, bool forceReinitialize)
    {
        try
        {
            using var context = await CreateDbContextAsync(config);
            
            _logger.LogInformation("测试数据库连接...");
            if (!await context.Database.CanConnectAsync())
            {
                return Result.Failure("数据库连接失败，请检查配置信息");
            }

            if (forceReinitialize)
            {
                _logger.LogInformation("强制重新初始化，删除现有数据库...");
                await context.Database.EnsureDeletedAsync();
            }

            _logger.LogInformation("创建数据库表结构...");
            var created = await context.Database.EnsureCreatedAsync();
            _logger.LogInformation("数据库表创建完成: {Created}", created);

            // 验证表是否正确创建
            var validationResult = await ValidateTablesCreatedAsync(context);
            if (!validationResult.IsSuccess)
            {
                return validationResult;
            }

            // 植入种子数据
            _logger.LogInformation("植入种子数据...");
            await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);

            // 验证种子数据
            var seedValidation = await ValidateSeedDataAsync(context);
            if (!seedValidation.IsSuccess)
            {
                return seedValidation;
            }

            return Result.Success("数据库初始化完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "执行数据库初始化失败");
            return Result.Failure($"数据库初始化失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 创建数据库上下文
    /// </summary>
    private async Task<VoxNestDbContext> CreateDbContextAsync(ServerConfiguration? config = null)
    {
        // 在安装模式下使用 IInstallationDbContextService
        if (_installationDbContextService != null)
        {
            if (config != null)
            {
                return await _installationDbContextService.CreateDbContextAsync(config);
            }
            else if (File.Exists(ConfigFile))
            {
                return await _installationDbContextService.CreateDbContextFromFileAsync(ConfigFile);
            }
            else
            {
                throw new InvalidOperationException("配置文件不存在，无法创建数据库上下文");
            }
        }
        
        // 在正常模式下使用 IDbContextFactory
        if (_contextFactory != null)
        {
            return await _contextFactory.CreateDbContextAsync();
        }

        throw new InvalidOperationException("无法创建数据库上下文：缺少必要的服务依赖");
    }

    /// <summary>
    /// 验证数据库表结构
    /// </summary>
    private async Task<Result> ValidateDatabaseStructureAsync(VoxNestDbContext context)
    {
        try
        {
            if (!await context.Database.CanConnectAsync())
            {
                return Result.Failure("无法连接到数据库，请检查数据库服务是否正常运行");
            }

            // 验证关键表是否存在
            var tables = new[]
            {
                ("Users", (Func<Task<bool>>)(() => context.Users.AnyAsync())),
                ("Roles", (Func<Task<bool>>)(() => context.Roles.AnyAsync())),
                ("UserRoles", (Func<Task<bool>>)(() => context.UserRoles.AnyAsync()))
            };

            foreach (var (tableName, checkFunc) in tables)
            {
                try
                {
                    await checkFunc();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "验证表 {TableName} 失败", tableName);
                    return Result.Failure($"数据库表结构不完整，缺少 {tableName} 表，请重新运行数据库初始化");
                }
            }

            return Result.Success("数据库表结构验证通过");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "验证数据库表结构失败");
            return Result.Failure($"数据库表结构验证失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 内部创建管理员用户
    /// </summary>
    private async Task<Result> CreateAdminUserInternalAsync(VoxNestDbContext context, CreateAdminDto adminInfo)
    {
        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // 创建管理员用户
            var adminUser = new User
            {
                Username = adminInfo.Username,
                Email = adminInfo.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminInfo.Password),
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            // 创建用户档案
            var userProfile = new UserProfile
            {
                UserId = adminUser.Id,
                DisplayName = adminInfo.DisplayName ?? adminInfo.Username
            };

            context.UserProfiles.Add(userProfile);

            // 分配管理员角色
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole == null)
            {
                return Result.Failure("系统错误：找不到管理员角色，请重新初始化数据库");
            }

            var userRole = new UserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id,
                GrantedAt = DateTime.UtcNow
            };

            context.UserRoles.Add(userRole);
            await context.SaveChangesAsync();

            await transaction.CommitAsync();
            return Result.Success("管理员用户创建成功");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "创建管理员用户事务失败");
            return Result.Failure($"创建管理员用户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 构建连接字符串
    /// </summary>
    private static string BuildConnectionString(DatabaseConfigDto config)
    {
        return config.Provider.ToUpper() switch
        {
            "MYSQL" or "MARIADB" => 
                $"Server={config.Server};Database={config.Database};User={config.Username};Password={config.Password};Port={config.Port};CharSet={config.CharSet};",
            _ => throw new NotSupportedException($"不支持的数据库提供商: {config.Provider}")
        };
    }

    /// <summary>
    /// 测试数据库连接（内部方法）
    /// </summary>
    private async Task<bool> TestConnectionInternalAsync(string connectionString)
    {
        try
        {
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 检查表是否存在
    /// </summary>
    private async Task<bool> CheckTablesExistAsync(VoxNestDbContext context)
    {
        try
        {
            await context.Users.AnyAsync();
            await context.Roles.AnyAsync();
            await context.Permissions.AnyAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 检查管理员是否存在
    /// </summary>
    private async Task<bool> CheckAdminExistsAsync(VoxNestDbContext context)
    {
        try
        {
            return await context.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.Role!.Name == "Admin");
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 验证表是否正确创建
    /// </summary>
    private async Task<Result> ValidateTablesCreatedAsync(VoxNestDbContext context)
    {
        try
        {
            var tables = new Dictionary<string, Func<Task<int>>>
            {
                ["Users"] = () => context.Users.CountAsync(),
                ["Roles"] = () => context.Roles.CountAsync(),
                ["Permissions"] = () => context.Permissions.CountAsync(),
                ["UserRoles"] = () => context.UserRoles.CountAsync(),
                ["RolePermissions"] = () => context.RolePermissions.CountAsync(),
                ["Posts"] = () => context.Posts.CountAsync(),
                ["Categories"] = () => context.Categories.CountAsync()
            };

            foreach (var (tableName, countFunc) in tables)
            {
                try
                {
                    await countFunc();
                    _logger.LogDebug("表 {TableName} 验证通过", tableName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "表 {TableName} 验证失败", tableName);
                    return Result.Failure($"表 {tableName} 创建失败或不可访问");
                }
            }

            return Result.Success("所有数据表验证通过");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "验证数据表失败");
            return Result.Failure($"验证数据表失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 验证种子数据
    /// </summary>
    private async Task<Result> ValidateSeedDataAsync(VoxNestDbContext context)
    {
        try
        {
            // 验证角色数据
            var roles = new[] { "Admin", "Moderator", "User" };
            foreach (var roleName in roles)
            {
                var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                if (role == null)
                {
                    return Result.Failure($"角色 {roleName} 未找到，种子数据植入失败");
                }
            }

            // 验证权限数据
            var permissionCount = await context.Permissions.CountAsync();
            if (permissionCount == 0)
            {
                return Result.Failure("权限数据为空，种子数据植入失败");
            }

            // 验证角色权限关联
            var rolePermissionCount = await context.RolePermissions.CountAsync();
            if (rolePermissionCount == 0)
            {
                return Result.Failure("角色权限关联数据为空，种子数据植入失败");
            }

            _logger.LogInformation("种子数据验证通过: 角色 {RoleCount}, 权限 {PermissionCount}, 关联 {RolePermissionCount}",
                roles.Length, permissionCount, rolePermissionCount);

            return Result.Success("种子数据验证通过");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "验证种子数据失败");
            return Result.Failure($"种子数据验证失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 创建初始化标记文件
    /// </summary>
    private async Task CreateInitializationFlagAsync()
    {
        var initInfo = new
        {
            InitializedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"),
            ConfigFile = ConfigFile,
            InitMethod = "Enhanced",
            Version = GetType().Assembly.GetName().Version?.ToString() ?? "Unknown"
        };

        await File.WriteAllTextAsync(DbInitFlagFile, 
            System.Text.Json.JsonSerializer.Serialize(initInfo, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
    }

    /// <summary>
    /// 诊断配置文件
    /// </summary>
    private async Task<object> DiagnoseConfigFileAsync()
    {
        try
        {
            var exists = File.Exists(ConfigFile);
            if (!exists)
            {
                return new { exists = false, error = "配置文件不存在" };
            }

            var content = await File.ReadAllTextAsync(ConfigFile);
            var deserializer = new YamlDotNet.Serialization.DeserializerBuilder()
                .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.UnderscoredNamingConvention.Instance)
                .Build();

            var config = deserializer.Deserialize<ServerConfiguration>(content);
            var validation = VoxNest.Server.Shared.Extensions.ConfigurationExtensions.ValidateConfiguration(config);

            return new
            {
                exists = true,
                readable = true,
                valid = validation.IsValid,
                errors = validation.IsValid ? null : validation.Errors,
                provider = config.Database.Provider
            };
        }
        catch (Exception ex)
        {
            return new { exists = File.Exists(ConfigFile), readable = false, error = ex.Message };
        }
    }

    /// <summary>
    /// 诊断数据库连接
    /// </summary>
    private async Task<object> DiagnoseDatabaseConnectionAsync()
    {
        try
        {
            var dbStatus = await CheckDatabaseStatusAsync();
            return new
            {
                connected = dbStatus.Connected,
                initialized = dbStatus.Initialized,
                hasAdmin = dbStatus.HasAdmin
            };
        }
        catch (Exception ex)
        {
            return new { connected = false, error = ex.Message };
        }
    }

    /// <summary>
    /// 诊断安装状态
    /// </summary>
    private async Task<object> DiagnoseInstallationStatusAsync()
    {
        try
        {
            var installStatus = await GetInstallStatusAsync();
            return new
            {
                isInstalled = installStatus.IsInstalled,
                currentStep = installStatus.CurrentStep.ToString(),
                configExists = installStatus.ConfigExists,
                databaseConnected = installStatus.DatabaseConnected,
                databaseInitialized = installStatus.DatabaseInitialized,
                hasAdminUser = installStatus.HasAdminUser
            };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message };
        }
    }

    /// <summary>
    /// 触发配置重载（如果需要）
    /// </summary>
    private async Task TriggerConfigurationReloadIfNeededAsync()
    {
        try
        {
            if (_configurationReloadService != null)
            {
                var shouldReload = await _configurationReloadService.ShouldReloadConfigurationAsync();
                if (shouldReload)
                {
                    _logger.LogInformation("检测到需要重载配置，触发应用重启...");
                    var reloadResult = await _configurationReloadService.ReloadConfigurationAsync();
                    if (reloadResult.IsSuccess)
                    {
                        // 延迟重启，给当前请求时间完成
                        _ = Task.Run(async () =>
                        {
                            await Task.Delay(3000);
                            await _configurationReloadService.TriggerApplicationRestartAsync();
                        });
                        
                        _logger.LogInformation("配置重载已触发，应用将在3秒后重启");
                    }
                    else
                    {
                        _logger.LogWarning("配置重载失败: {Message}", reloadResult.Message);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "触发配置重载时出错");
        }
    }

    #endregion
}
