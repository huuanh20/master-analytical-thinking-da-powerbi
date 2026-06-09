using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using PowerBILearning.Application.Common.Interfaces;
using PowerBILearning.Domain.Entities;
using PowerBILearning.Domain.Enums;

namespace PowerBILearning.Application.Lectures.Commands;

public record CreateLectureCommand(
    string Title,
    string LectureNumber,
    string FileName,
    byte[] Content
) : IRequest<Guid>;

public class CreateLectureCommandHandler : IRequestHandler<CreateLectureCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateLectureCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateLectureCommand request, CancellationToken cancellationToken)
    {
        var lecture = new Lecture
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            LectureNumber = request.LectureNumber,
            FileName = request.FileName,
            FilePath = $"/api/lectures/placeholder/pdf",
            SizeBytes = request.Content.Length,
            Status = CourseStatus.Unread,
            PdfData = request.Content
        };
        
        lecture.FilePath = $"/api/lectures/{lecture.Id}/pdf";

        _context.Lectures.Add(lecture);
        await _context.SaveChangesAsync(cancellationToken);

        return lecture.Id;
    }
}
