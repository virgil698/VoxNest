using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.Content;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 帖子标签关联实体配置
/// </summary>
public class PostTagConfiguration : IEntityTypeConfiguration<PostTag>
{
    public void Configure(EntityTypeBuilder<PostTag> builder)
    {
        builder.ToTable("PostTags");

        // 复合主键
        builder.HasKey(pt => new { pt.PostId, pt.TagId });

        builder.Property(pt => pt.CreatedAt)
            .IsRequired();

        // 索引
        builder.HasIndex(pt => pt.CreatedAt);
    }
}
