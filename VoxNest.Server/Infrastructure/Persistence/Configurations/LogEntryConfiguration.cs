using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Infrastructure.Persistence.Constants;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 日志条目实体配置
/// </summary>
public class LogEntryConfiguration : IEntityTypeConfiguration<LogEntry>
{
    public void Configure(EntityTypeBuilder<LogEntry> builder)
    {
        builder.ToTable(TableNames.LogEntries);

        // 主键
        builder.HasKey(l => l.Id);

        // 属性配置
        builder.Property(l => l.Id)
            .ValueGeneratedOnAdd();

        builder.Property(l => l.Level)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(l => l.Category)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(l => l.Message)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(l => l.Details)
            .HasColumnType("TEXT");

        builder.Property(l => l.Exception)
            .HasColumnType("TEXT");

        builder.Property(l => l.Source)
            .HasMaxLength(200);

        builder.Property(l => l.IpAddress)
            .HasMaxLength(45); // IPv6最大长度

        builder.Property(l => l.UserAgent)
            .HasMaxLength(500);

        builder.Property(l => l.RequestUrl)
            .HasMaxLength(500);

        builder.Property(l => l.HttpMethod)
            .HasMaxLength(10);

        builder.Property(l => l.RelatedEntityType)
            .HasMaxLength(100);

        builder.Property(l => l.Metadata)
            .HasColumnType("TEXT");

        builder.Property(l => l.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("UTC_TIMESTAMP()");

        // 外键关系
        builder.HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // 索引
        builder.HasIndex(l => l.Level);
        builder.HasIndex(l => l.Category);
        builder.HasIndex(l => l.CreatedAt);
        builder.HasIndex(l => l.UserId);
        builder.HasIndex(l => l.IpAddress);
        builder.HasIndex(l => l.Source);
        
        // 复合索引用于常见查询
        builder.HasIndex(l => new { l.Level, l.Category, l.CreatedAt });
        builder.HasIndex(l => new { l.UserId, l.CreatedAt });
    }
}
