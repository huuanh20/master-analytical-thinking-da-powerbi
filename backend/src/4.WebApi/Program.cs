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

// Support HEAD requests (for uptime monitoring tools like UptimeRobot)
app.Use(async (context, next) =>
{
    if (HttpMethods.IsHead(context.Request.Method))
    {
        context.Request.Method = HttpMethods.Get;
        var originalBody = context.Response.Body;
        context.Response.Body = System.IO.Stream.Null;
        try
        {
            await next();
        }
        finally
        {
            context.Response.Body = originalBody;
        }
        return;
    }
    await next();
});

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

app.MapDelete("/api/lectures/{id:guid}", async (Guid id, IMediator mediator) =>
{
    var command = new DeleteLectureCommand(id);
    var success = await mediator.Send(command);
    return success ? Results.Ok(new { Message = "Lecture deleted successfully" }) : Results.NotFound();
});

app.MapGet("/api/lectures/{id:guid}/pdf", async (Guid id, IMediator mediator) =>
{
    var query = new GetLecturePdfQuery(id);
    var pdfBytes = await mediator.Send(query);
    if (pdfBytes == null)
    {
        return Results.NotFound("PDF not found");
    }
    return Results.File(pdfBytes, "application/pdf");
});

app.MapPost("/api/lectures", async (
    Microsoft.AspNetCore.Http.HttpRequest request,
    IMediator mediator) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest("Expected form content type");
    }

    var form = await request.ReadFormAsync();
    var title = form["title"].ToString();
    var lectureNumber = form["lectureNumber"].ToString();
    var file = form.Files.GetFile("file");

    if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(lectureNumber))
    {
        return Results.BadRequest("Title and Lecture Number are required");
    }

    if (file == null || file.Length == 0)
    {
        return Results.BadRequest("No file uploaded");
    }

    using var ms = new System.IO.MemoryStream();
    await file.CopyToAsync(ms);
    var fileBytes = ms.ToArray();

    try
    {
        var command = new CreateLectureCommand(title, lectureNumber, file.FileName, fileBytes);
        var id = await mediator.Send(command);
        return Results.Created($"/api/lectures/{id}", new { Id = id });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.InnerException?.Message ?? ex.Message });
    }
})
.DisableAntiforgery();

app.Run();

// DTO Requests
public record UpdateStatusRequest(CourseStatus Status);
public record SaveNoteRequest(string Content);
