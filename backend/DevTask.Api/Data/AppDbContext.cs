using DevTask.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DevTask.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();

    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(project => project.Name).HasMaxLength(120).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(2000);
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(task => task.Title).HasMaxLength(160).IsRequired();
            entity.Property(task => task.Description).HasMaxLength(2000);
            entity.Property(task => task.Status).HasConversion<string>().HasMaxLength(24);
            entity.Property(task => task.Priority).HasConversion<string>().HasMaxLength(24);
            entity.HasOne(task => task.Project)
                .WithMany(project => project.Tasks)
                .HasForeignKey(task => task.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
