using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PowerBILearning.Application.Common.Interfaces;
using PowerBILearning.Domain.Entities;

namespace PowerBILearning.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Lecture> Lectures => Set<Lecture>();
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Configure relations and indexes
        modelBuilder.Entity<Lecture>()
            .HasOne(l => l.Note)
            .WithOne(n => n.Lecture)
            .HasForeignKey<Note>(n => n.LectureId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Lecture>()
            .HasIndex(l => l.LectureNumber)
            .IsUnique();

        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await base.SaveChangesAsync(cancellationToken);
    }
}
