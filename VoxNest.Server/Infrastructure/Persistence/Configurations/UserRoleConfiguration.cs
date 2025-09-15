using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Infrastructure.Persistence.Constants;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 用户角色关联实体配置
/// </summary>
public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable(TableNames.UserRoles);

        // 复合主键
        builder.HasKey(ur => new { ur.UserId, ur.RoleId });

        builder.Property(ur => ur.GrantedAt)
            .IsRequired();

        // 索引
        builder.HasIndex(ur => ur.GrantedAt);
    }
}
