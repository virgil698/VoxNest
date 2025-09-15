using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VoxNest.Server.Domain.Entities.System;
using VoxNest.Server.Infrastructure.Persistence.Constants;

namespace VoxNest.Server.Infrastructure.Persistence.Configurations;

/// <summary>
/// 安装锁实体配置
/// </summary>
public class InstallLockConfiguration : IEntityTypeConfiguration<InstallLock>
{
    public void Configure(EntityTypeBuilder<InstallLock> builder)
    {
        builder.ToTable(TableNames.InstallLocks);

        // 主键
        builder.HasKey(x => x.LockKey);

        // 属性配置
        builder.Property(x => x.LockKey)
            .IsRequired()
            .HasMaxLength(100)
            .HasComment("锁键值");

        builder.Property(x => x.AcquiredAt)
            .IsRequired()
            .HasComment("获取锁的时间");

        builder.Property(x => x.ExpiresAt)
            .IsRequired()
            .HasComment("锁过期时间");

        builder.Property(x => x.ProcessId)
            .IsRequired()
            .HasComment("进程ID");

        builder.Property(x => x.HostName)
            .HasMaxLength(255)
            .HasComment("获取锁的主机名");

        builder.Property(x => x.Description)
            .HasMaxLength(500)
            .HasComment("锁的描述信息");

        // 索引
        builder.HasIndex(x => x.ExpiresAt)
            .HasDatabaseName("IX_InstallLocks_ExpiresAt");

        builder.HasIndex(x => x.ProcessId)
            .HasDatabaseName("IX_InstallLocks_ProcessId");
    }
}
