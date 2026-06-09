using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PowerBILearning.Application.Common.Interfaces;
using PowerBILearning.Domain.Enums;

namespace PowerBILearning.Application.Lectures.Commands;

public record UpdateLectureStatusCommand(Guid LectureId, CourseStatus Status) : IRequest<bool>;

public class UpdateLectureStatusCommandHandler : IRequestHandler<UpdateLectureStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateLectureStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateLectureStatusCommand request, CancellationToken cancellationToken)
    {
        var lecture = await _context.Lectures
            .FirstOrDefaultAsync(l => l.Id == request.LectureId, cancellationToken);

        if (lecture == null)
        {
            return false;
        }

        lecture.Status = request.Status;
        lecture.LastModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
