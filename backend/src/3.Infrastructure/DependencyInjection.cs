using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PowerBILearning.Application.Common.Interfaces;
using PowerBILearning.Infrastructure.Persistence;

namespace PowerBILearning.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=PowerBILearning.db";

        // Configure SQLite with WAL mode for durability and concurrent reads
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlite(connectionString,
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));

            // Enable detailed errors in development
            options.EnableDetailedErrors();
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<ApplicationDbContextInitialiser>();

        return services;
    }
}
