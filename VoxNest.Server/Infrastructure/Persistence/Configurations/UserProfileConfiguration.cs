using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Infrastructure.Persistence.Constants;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 用户配置文件实体配置
/// </summary>
public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable(TableNames.UserProfiles);

        builder.HasKey(p => p.UserId);

        builder.Property(p => p.DisplayName)
            .HasMaxLength(100);

        builder.Property(p => p.Avatar)
            .HasMaxLength(500);

        builder.Property(p => p.Bio)
            .HasMaxLength(1000);

        builder.Property(p => p.Location)
            .HasMaxLength(100);

        builder.Property(p => p.Website)
            .HasMaxLength(500);

        builder.Property(p => p.Gender)
            .HasMaxLength(10);
    }
}
