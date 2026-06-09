using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PowerBILearning.Application.Common.Interfaces;
using PowerBILearning.Domain.Entities;

namespace PowerBILearning.Application.Notes.Commands;

public record SaveNoteCommand(Guid LectureId, string Content) : IRequest<bool>;

public class SaveNoteCommandHandler : IRequestHandler<SaveNoteCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public SaveNoteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(SaveNoteCommand request, CancellationToken cancellationToken)
    {
        var lecture = await _context.Lectures
            .Include(l => l.Note)
            .FirstOrDefaultAsync(l => l.Id == request.LectureId, cancellationToken);

        if (lecture == null)
        {
            return false;
        }

        if (lecture.Note == null)
        {
            lecture.Note = new Note
            {
                LectureId = lecture.Id,
                Content = request.Content
            };
            _context.Notes.Add(lecture.Note);
        }
        else
        {
            lecture.Note.Content = request.Content;
            lecture.Note.LastModifiedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
