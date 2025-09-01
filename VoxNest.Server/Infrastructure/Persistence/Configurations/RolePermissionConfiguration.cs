using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.User;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 角色权限关联实体配置
/// </summary>
public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions");

        // 复合主键
        builder.HasKey(rp => new { rp.RoleId, rp.PermissionId });

        builder.Property(rp => rp.GrantedAt)
            .IsRequired();

        // 索引
        builder.HasIndex(rp => rp.GrantedAt);
    }
}
