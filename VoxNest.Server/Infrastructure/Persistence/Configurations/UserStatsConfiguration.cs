using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.System;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 用户统计实体配置
/// </summary>
public class UserStatsConfiguration : IEntityTypeConfiguration<UserStats>
{
    public void Configure(EntityTypeBuilder<UserStats> builder)
    {
        builder.ToTable("UserStats");

        // 主键
        builder.HasKey(s => s.Id);

        // 属性配置
        builder.Property(s => s.Id)
            .ValueGeneratedOnAdd();

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.Property(s => s.PostCount)
            .HasDefaultValue(0);

        builder.Property(s => s.CommentCount)
            .HasDefaultValue(0);

        builder.Property(s => s.LikeCount)
            .HasDefaultValue(0);

        builder.Property(s => s.ViewCount)
            .HasDefaultValue(0);

        builder.Property(s => s.FollowerCount)
            .HasDefaultValue(0);

        builder.Property(s => s.FollowingCount)
            .HasDefaultValue(0);

        builder.Property(s => s.Score)
            .HasDefaultValue(0);

        builder.Property(s => s.Level)
            .HasDefaultValue(1);

        builder.Property(s => s.Experience)
            .HasDefaultValue(0);

        builder.Property(s => s.ContinuousSignInDays)
            .HasDefaultValue(0);

        builder.Property(s => s.LastActiveAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(s => s.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // 外键关系
        builder.HasOne(s => s.User)
            .WithOne()
            .HasForeignKey<UserStats>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引
        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.HasIndex(s => s.Score);
        builder.HasIndex(s => s.Level);
        builder.HasIndex(s => s.LastActiveAt);
    }
}
