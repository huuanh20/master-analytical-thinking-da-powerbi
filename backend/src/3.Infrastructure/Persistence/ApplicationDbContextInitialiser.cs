using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PowerBILearning.Domain.Entities;
using PowerBILearning.Domain.Enums;

namespace PowerBILearning.Infrastructure.Persistence;

public class ApplicationDbContextInitialiser
{
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;
    private readonly ApplicationDbContext _context;

    public ApplicationDbContextInitialiser(ILogger<ApplicationDbContextInitialiser> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            await _context.Database.EnsureCreatedAsync();
            
            // Enable WAL mode for SQLite — critical for data durability
            // WAL = Write-Ahead Logging: reads don't block writes, data survives crashes
            await _context.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;");
            await _context.Database.ExecuteSqlRawAsync("PRAGMA synchronous=NORMAL;");
            await _context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys=ON;");
            await _context.Database.ExecuteSqlRawAsync("PRAGMA cache_size=-32000;"); // 32MB cache
            await _context.Database.ExecuteSqlRawAsync("PRAGMA temp_store=MEMORY;");
            
            _logger.LogInformation("Database initialised with WAL mode enabled for maximum durability.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    public async Task TrySeedAsync()
    {
        var defaultLectures = new[]
        {
            new { Number = "L3", Title = "Lecture 3: Power BI Data Modeling & Analytical Thinking", FileName = "Master Analytical Thinking & DA With Power BI - L3.pdf" },
            new { Number = "L4", Title = "Lecture 4: DAX Calculations & Expressions", FileName = "Master Analytical Thinking & DA With Power BI - L4.pdf" },
            new { Number = "L5", Title = "Lecture 5: Time Intelligence & Advanced Calculations", FileName = "Master Analytical Thinking & DA With Power BI - L5.pdf" },
            new { Number = "L6", Title = "Lecture 6: Data Visualization & Dashboard Design", FileName = "Master Analytical Thinking & DA With Power BI - L6.pdf" },
            new { Number = "L7", Title = "Lecture 7: Row-Level Security & Sharing Reports", FileName = "Master Analytical Thinking & DA With Power BI - L7.pdf" },
            new { Number = "L9+10", Title = "Lecture 9 & 10: Advanced Data Ingestion & Power Query", FileName = "Master Analytical Thinking & DA With Power BI - L9+10.pdf" },
            new { Number = "L10", Title = "Lecture 10: Data Refresh & Gateway Configuration", FileName = "Master Analytical Thinking & DA With Power BI - L10.pdf" },
            new { Number = "L11", Title = "Lecture 11: Real-world Case Study & Practice Exercises", FileName = "Master Analytical Thinking & DA With Power BI - L11.pdf" }
        };

        foreach (var def in defaultLectures)
        {
            if (!await _context.Lectures.AnyAsync(l => l.LectureNumber == def.Number))
            {
                _context.Lectures.Add(new Lecture
                {
                    LectureNumber = def.Number,
                    Title = def.Title,
                    FileName = def.FileName,
                    FilePath = $"/pdfs/{def.FileName}",
                    SizeBytes = 0,
                    Status = CourseStatus.Unread
                });
            }
        }

        await _context.SaveChangesAsync();
    }
}
