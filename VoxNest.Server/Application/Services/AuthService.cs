using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VoxNest.Server.Application.DTOs.Auth;
using VoxNest.Server.Application.Interfaces;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Enums;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Shared.Configuration;
using VoxNest.Server.Shared.Results;
using BCrypt.Net;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// 认证服务实现
/// </summary>
public class AuthService : IAuthService
{
    private readonly VoxNestDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        VoxNestDbContext dbContext,
        IJwtTokenService jwtTokenService,
        IMapper mapper,
        ServerConfiguration serverConfig,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _mapper = mapper;
        _jwtSettings = serverConfig.Jwt;
        _logger = logger;
    }

    public async Task<Result<UserDto>> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            // 检查用户名是否已存在
            if (await IsUsernameExistsAsync(request.Username))
            {
                return Result<UserDto>.Failure("用户名已存在");
            }

            // 检查邮箱是否已存在
            if (await IsEmailExistsAsync(request.Email))
            {
                return Result<UserDto>.Failure("邮箱地址已存在");
            }

            // 创建用户
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            // 创建用户配置文件
            user.Profile = new UserProfile
            {
                UserId = user.Id,
                DisplayName = request.Username
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // 分配默认角色（如果存在）
            var defaultRole = await _dbContext.Roles
                .FirstOrDefaultAsync(r => r.Name == "User");

            if (defaultRole != null)
            {
                _dbContext.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = defaultRole.Id,
                    GrantedAt = DateTime.UtcNow
                });
                await _dbContext.SaveChangesAsync();
            }

            _logger.LogInformation("用户注册成功: {Username}", user.Username);

            // 重新加载用户以包含关联数据
            var userWithDetails = await GetUserWithDetailsAsync(user.Id);
            var userDto = _mapper.Map<UserDto>(userWithDetails);

            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "用户注册失败: {Username}", request.Username);
            return Result<UserDto>.Failure("注册失败，请稍后重试");
        }
    }

    public async Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto request)
    {
        try
        {
            // 查找用户（支持用户名或邮箱登录）
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => 
                    u.Username == request.UsernameOrEmail || 
                    u.Email == request.UsernameOrEmail);

            if (user == null)
            {
                return Result<LoginResponseDto>.Failure("用户名或密码错误");
            }

            // 验证密码
            _logger.LogInformation("开始验证用户 {UsernameOrEmail} 的密码", request.UsernameOrEmail);
            _logger.LogDebug("输入密码长度: {PasswordLength}, 密码哈希: {PasswordHashPrefix}", 
                request.Password.Length, user.PasswordHash.Substring(0, Math.Min(20, user.PasswordHash.Length)) + "...");
                
            var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            _logger.LogInformation("用户 {UsernameOrEmail} 密码验证结果: {IsValid}", request.UsernameOrEmail, isPasswordValid);
            
            if (!isPasswordValid)
            {
                _logger.LogWarning("用户 {UsernameOrEmail} 密码验证失败", request.UsernameOrEmail);
                return Result<LoginResponseDto>.Failure("用户名或密码错误");
            }

            // 检查用户状态
            if (user.Status != UserStatus.Active)
            {
                _logger.LogWarning("用户 {UsernameOrEmail} 账户状态异常: {Status}", request.UsernameOrEmail, user.Status);
                return Result<LoginResponseDto>.Failure("账户已被禁用");
            }

            // 生成JWT令牌
            var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(user);

            // 更新最后登录时间
            user.LastLoginAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                TokenType = "Bearer",
                ExpiresIn = _jwtSettings.ExpireMinutes * 60,
                User = userDto
            };

            _logger.LogInformation("用户登录成功: {Username}", user.Username);

            return Result<LoginResponseDto>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "用户登录失败: {UsernameOrEmail}", request.UsernameOrEmail);
            return Result<LoginResponseDto>.Failure("登录失败，请稍后重试");
        }
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(int userId)
    {
        try
        {
            var user = await GetUserWithDetailsAsync(userId);

            if (user == null)
            {
                return Result<UserDto>.Failure("用户不存在");
            }

            var userDto = _mapper.Map<UserDto>(user);
            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户信息失败: UserId={UserId}", userId);
            return Result<UserDto>.Failure("获取用户信息失败");
        }
    }

    public async Task<Result<UserDto>> GetUserByUsernameAsync(string username)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return Result<UserDto>.Failure("用户不存在");
            }

            var userDto = _mapper.Map<UserDto>(user);
            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户信息失败: Username={Username}", username);
            return Result<UserDto>.Failure("获取用户信息失败");
        }
    }

    public async Task<bool> IsUsernameExistsAsync(string username)
    {
        return await _dbContext.Users.AnyAsync(u => u.Username == username);
    }

    public async Task<bool> IsEmailExistsAsync(string email)
    {
        return await _dbContext.Users.AnyAsync(u => u.Email == email);
    }

    private async Task<User?> GetUserWithDetailsAsync(int userId)
    {
        return await _dbContext.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    /// <summary>
    /// 重置管理员密码（仅开发环境）
    /// </summary>
    /// <param name="email">管理员邮箱</param>
    /// <param name="newPassword">新密码</param>
    /// <returns>重置结果</returns>
    public async Task<Result<string>> ResetAdminPasswordAsync(string email, string newPassword)
    {
        try
        {
            // 查找用户
            var user = await _dbContext.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return Result<string>.Failure("用户不存在");
            }

            // 检查是否是管理员
            var isAdmin = user.UserRoles.Any(ur => ur.Role.Name == "Admin");
            if (!isAdmin)
            {
                return Result<string>.Failure("该用户不是管理员");
            }

            // 更新密码
            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.PasswordHash = newPasswordHash;

            await _dbContext.SaveChangesAsync();

            _logger.LogWarning("管理员密码已重置: {Email}", email);

            return Result<string>.Success($"管理员 {email} 密码重置成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "重置管理员密码失败: {Email}", email);
            return Result<string>.Failure($"密码重置失败: {ex.Message}");
        }
    }
}
