using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using MediatR;
using PowerBILearning.Application;
using PowerBILearning.Infrastructure;
using PowerBILearning.Infrastructure.Persistence;
using PowerBILearning.Application.Lectures.Queries;
using PowerBILearning.Application.Lectures.Commands;
using PowerBILearning.Application.Notes.Commands;
using PowerBILearning.Domain.Enums;

var builder = WebApplication.CreateBuilder(args);

// Add application and infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Add Controllers/Endpoints support
builder.Services.AddEndpointsApiExplorer();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Run database migrations and seeding at startup
using (var scope = app.Services.CreateScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();
    await initialiser.InitialiseAsync();
    await initialiser.SeedAsync();
}

app.UseCors("AllowAll");

// Minimal APIs configuration
app.MapGet("/api/lectures", async (IMediator mediator) =>
{
    var query = new GetLecturesQuery();
    var result = await mediator.Send(query);
    return Results.Ok(result);
});

app.MapPut("/api/lectures/{id:guid}/status", async (Guid id, UpdateStatusRequest request, IMediator mediator) =>
{
    var command = new UpdateLectureStatusCommand(id, request.Status);
    var success = await mediator.Send(command);
    return success ? Results.Ok(new { Message = "Status updated successfully" }) : Results.NotFound();
});

app.MapPost("/api/lectures/{id:guid}/notes", async (Guid id, SaveNoteRequest request, IMediator mediator) =>
{
    var command = new SaveNoteCommand(id, request.Content);
    var success = await mediator.Send(command);
    return success ? Results.Ok(new { Message = "Note saved successfully" }) : Results.NotFound();
});

app.Run();

// DTO Requests
public record UpdateStatusRequest(CourseStatus Status);
public record SaveNoteRequest(string Content);
