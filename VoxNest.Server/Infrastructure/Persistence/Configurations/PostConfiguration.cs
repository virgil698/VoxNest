using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Infrastructure.Persistence.Constants;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 帖子实体配置
/// </summary>
public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable(TableNames.Posts);

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Content)
            .IsRequired()
            .HasColumnType("TEXT")
            .HasComment("帖子内容 (Markdown格式)");
            
        builder.Property(p => p.HtmlContent)
            .IsRequired()
            .HasColumnType("TEXT")
            .HasDefaultValue(string.Empty)
            .HasComment("帖子HTML内容 (由Markdown转换而来)");

        builder.Property(p => p.Summary)
            .HasMaxLength(500)
            .HasComment("帖子摘要 (Markdown格式)");
            
        builder.Property(p => p.PlainTextSummary)
            .HasMaxLength(300)
            .HasComment("帖子纯文本摘要 (由HTML内容提取)");

        builder.Property(p => p.Status)
            .HasConversion<int>();

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt)
            .IsRequired();

        builder.Property(p => p.ViewCount)
            .HasDefaultValue(0);

        builder.Property(p => p.LikeCount)
            .HasDefaultValue(0);

        builder.Property(p => p.CommentCount)
            .HasDefaultValue(0);

        builder.Property(p => p.IsPinned)
            .HasDefaultValue(false);

        builder.Property(p => p.IsLocked)
            .HasDefaultValue(false);

        // 索引
        builder.HasIndex(p => p.AuthorId);
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.CreatedAt);
        builder.HasIndex(p => p.PublishedAt);
        builder.HasIndex(p => p.IsPinned);
        builder.HasIndex(p => new { p.Status, p.CreatedAt });

        // 关系
        builder.HasOne(p => p.Author)
            .WithMany(u => u.Posts)
            .HasForeignKey(p => p.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Posts)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.PostTags)
            .WithOne(pt => pt.Post)
            .HasForeignKey(pt => pt.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Comments)
            .WithOne(c => c.Post)
            .HasForeignKey(c => c.PostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
