using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Infrastructure.Persistence.Constants;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 标签实体配置
/// </summary>
public class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable(TableNames.Tags);

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.Slug)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.Color)
            .HasMaxLength(7);

        builder.Property(t => t.UseCount)
            .HasDefaultValue(0);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        // 索引
        builder.HasIndex(t => t.Name).IsUnique();
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.HasIndex(t => t.UseCount);

        // 关系
        builder.HasMany(t => t.PostTags)
            .WithOne(pt => pt.Tag)
            .HasForeignKey(pt => pt.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
