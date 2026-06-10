using System;
using System.IO;
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
        // Resolve the PDF folder — try multiple candidate paths:
        // 1. Sibling "frontend/public/pdfs" relative to the WebApi project dir
        // 2. Same folder but one level up (solution root)
        var baseDirs = new[]
        {
            Path.Combine(AppContext.BaseDirectory),                          // bin/Debug/net10.0
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."),  // up to src/
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".."), // up to solution root
        };

        string? pdfFolder = null;
        foreach (var dir in baseDirs)
        {
            var candidate = Path.GetFullPath(Path.Combine(dir, "frontend", "public", "pdfs"));
            if (Directory.Exists(candidate))
            {
                pdfFolder = candidate;
                _logger.LogInformation("PDF seed folder found: {Folder}", pdfFolder);
                break;
            }
        }

        if (pdfFolder == null)
        {
            _logger.LogWarning("PDF seed folder not found. Lectures will be seeded without PDF data.");
        }

        var defaultLectures = new[]
        {
            new { Number = "L3",    Title = "Lecture 3: Power BI Data Modeling & Analytical Thinking",    FileName = "Master Analytical Thinking & DA With Power BI - L3.pdf" },
            new { Number = "L4",    Title = "Lecture 4: DAX Calculations & Expressions",                   FileName = "Master Analytical Thinking & DA With Power BI - L4.pdf" },
            new { Number = "L5",    Title = "Lecture 5: Time Intelligence & Advanced Calculations",         FileName = "Master Analytical Thinking & DA With Power BI - L5.pdf" },
            new { Number = "L6",    Title = "Lecture 6: Data Visualization & Dashboard Design",            FileName = "Master Analytical Thinking & DA With Power BI - L6.pdf" },
            new { Number = "L7",    Title = "Lecture 7: Row-Level Security & Sharing Reports",             FileName = "Master Analytical Thinking & DA With Power BI - L7.pdf" },
            new { Number = "L9+10", Title = "Lecture 9 & 10: Advanced Data Ingestion & Power Query",       FileName = "Master Analytical Thinking & DA With Power BI - L9+10.pdf" },
            new { Number = "L10",   Title = "Lecture 10: Data Refresh & Gateway Configuration",            FileName = "Master Analytical Thinking & DA With Power BI - L10.pdf" },
            new { Number = "L11",   Title = "Lecture 11: Real-world Case Study & Practice Exercises",      FileName = "Master Analytical Thinking & DA With Power BI - L11.pdf" },
        };

        foreach (var def in defaultLectures)
        {
            if (!await _context.Lectures.AnyAsync(l => l.LectureNumber == def.Number))
            {
                byte[]? pdfBytes = null;
                long sizeBytes = 0;

                if (pdfFolder != null)
                {
                    var filePath = Path.Combine(pdfFolder, def.FileName);
                    if (File.Exists(filePath))
                    {
                        pdfBytes = await File.ReadAllBytesAsync(filePath);
                        sizeBytes = pdfBytes.Length;
                        _logger.LogInformation("Seeding PDF: {File} ({Size:F1} MB)", def.FileName, sizeBytes / 1024.0 / 1024.0);
                    }
                    else
                    {
                        _logger.LogWarning("PDF not found at seed path: {Path}", filePath);
                    }
                }

                var lecture = new Lecture
                {
                    Id = Guid.NewGuid(),
                    LectureNumber = def.Number,
                    Title = def.Title,
                    FileName = def.FileName,
                    FilePath = "/placeholder", // will be updated below
                    SizeBytes = sizeBytes,
                    Status = CourseStatus.Unread,
                    PdfData = pdfBytes
                };
                lecture.FilePath = $"/api/lectures/{lecture.Id}/pdf";

                _context.Lectures.Add(lecture);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Database seeding complete.");
    }
}
