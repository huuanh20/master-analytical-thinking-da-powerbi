using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PowerBILearning.Domain.Entities;

namespace PowerBILearning.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Lecture> Lectures { get; }
    DbSet<Note> Notes { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
