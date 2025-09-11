using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using VoxNest.Server.Infrastructure.Persistence.Contexts;

namespace VoxNest.Server.Infrastructure.Persistence.Design;

/// <summary>
/// 设计时DbContext工厂，用于EF Core工具
/// </summary>
public class VoxNestDbContextFactory : IDesignTimeDbContextFactory<VoxNestDbContext>
{
    public VoxNestDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<VoxNestDbContext>();
        
        // 使用MySQL配置进行设计时操作（仅用于迁移生成）
        var connectionString = Environment.GetEnvironmentVariable("MIGRATION_CONNECTION_STRING") 
            ?? "Server=localhost;Database=VoxNest_Migration;User=root;Password=;Port=3306;CharSet=utf8mb4;";
        
        // 设置MySQL版本，不需要实际连接数据库来生成迁移
        optionsBuilder.UseMySql(connectionString, 
            new MySqlServerVersion(new Version(8, 0, 33)));

        return new VoxNestDbContext(optionsBuilder.Options);
    }
}
