using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.System;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 站点设置实体配置
/// </summary>
public class SiteSettingConfiguration : IEntityTypeConfiguration<SiteSetting>
{
    public void Configure(EntityTypeBuilder<SiteSetting> builder)
    {
        builder.ToTable("SiteSettings");

        // 主键
        builder.HasKey(s => s.Id);

        // 属性配置
        builder.Property(s => s.Id)
            .ValueGeneratedOnAdd();

        builder.Property(s => s.Key)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Value)
            .HasColumnType("TEXT");

        builder.Property(s => s.Type)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        builder.Property(s => s.Group)
            .HasMaxLength(50);

        builder.Property(s => s.DefaultValue)
            .HasColumnType("TEXT");

        builder.Property(s => s.ValidationRules)
            .HasColumnType("TEXT");

        builder.Property(s => s.Options)
            .HasColumnType("TEXT");

        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("UTC_TIMESTAMP()");

        builder.Property(s => s.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("UTC_TIMESTAMP()");

        // 外键关系
        builder.HasOne(s => s.UpdatedBy)
            .WithMany()
            .HasForeignKey(s => s.UpdatedById)
            .OnDelete(DeleteBehavior.SetNull);

        // 索引
        builder.HasIndex(s => s.Key)
            .IsUnique();

        builder.HasIndex(s => s.Group);
        builder.HasIndex(s => s.IsPublic);
        builder.HasIndex(s => s.IsEnabled);
        builder.HasIndex(s => new { s.Group, s.Sort, s.Name });
    }
}
