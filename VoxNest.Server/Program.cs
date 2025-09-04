using VoxNest.Server.Infrastructure;
using VoxNest.Server.Infrastructure.Persistence.Contexts;
using VoxNest.Server.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// 检查是否处于安装模式
const string installFlagFile = "install.lock";
var isInstalled = File.Exists(installFlagFile);
var configExists = File.Exists("server-config.yml");

if (isInstalled && configExists)
{
    // 正常模式：加载完整配置
    builder.Services.AddInfrastructure(builder.Configuration);
}
else
{
    // 安装模式：只注册必要的服务
    builder.Services.AddScoped<IInstallService, VoxNest.Server.Application.Services.InstallService>();
    
    // 配置基本的CORS策略
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("InstallPolicy", corsBuilder =>
        {
            corsBuilder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
        });
    });
}

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add Swagger for development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "VoxNest API", Version = "v1" });
        
        // 配置JWT认证
        c.AddSecurityDefinition("Bearer", new()
        {
            Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
            Name = "Authorization",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });
        
        c.AddSecurityRequirement(new()
        {
            {
                new()
                {
                    Reference = new()
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });
}

var app = builder.Build();

// 检查是否需要初始化数据库（仅在已安装且配置存在时）
if (isInstalled && configExists && app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VoxNestDbContext>();
        await context.Database.EnsureCreatedAsync();
        
        // 添加种子数据
        await VoxNest.Server.Infrastructure.Persistence.Seed.DatabaseSeeder.SeedAsync(context);
    }
    catch (Exception ex)
    {
        // 如果数据库初始化失败，记录错误但不阻止应用启动
        app.Logger.LogError(ex, "数据库初始化失败");
    }
}

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VoxNest API V1");
        c.RoutePrefix = "swagger";
    });
}

// 只在正常模式下启用HTTPS重定向
if (isInstalled && configExists)
{
    app.UseHttpsRedirection();
}

// 根据模式启用不同的CORS策略
if (isInstalled && configExists)
{
    app.UseCors("DefaultPolicy");
    
    // 启用认证和授权（仅在正常模式下）
    app.UseAuthentication();
    app.UseAuthorization();
}
else
{
    app.UseCors("InstallPolicy");
}

// 添加安装状态检查中间件
app.Use(async (context, next) =>
{
    // 允许安装API和静态资源访问
    if (context.Request.Path.StartsWithSegments("/api/install") ||
        context.Request.Path.StartsWithSegments("/install") ||
        context.Request.Path.StartsWithSegments("/assets") ||
        context.Request.Path.StartsWithSegments("/vite.svg") ||
        context.Request.Path.StartsWithSegments("/swagger") ||
        context.Request.Path.StartsWithSegments("/_framework"))
    {
        await next();
        return;
    }

    // 如果未安装，重定向到安装页面
    if (!isInstalled)
    {
        if (context.Request.Path == "/" || context.Request.Path == "/index.html")
        {
            context.Response.Redirect("/install");
            return;
        }
        
        if (!context.Request.Path.StartsWithSegments("/install"))
        {
            context.Response.StatusCode = 503;
            await context.Response.WriteAsync("System is not installed. Please visit /install to complete installation.");
            return;
        }
    }

    await next();
});

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
