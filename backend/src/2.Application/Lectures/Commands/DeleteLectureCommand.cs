using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using PowerBILearning.Application.Common.Interfaces;

namespace PowerBILearning.Application.Lectures.Commands;

public record DeleteLectureCommand(Guid Id) : IRequest<bool>;

public class DeleteLectureCommandHandler : IRequestHandler<DeleteLectureCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteLectureCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteLectureCommand request, CancellationToken cancellationToken)
    {
        var lecture = await _context.Lectures.FindAsync(new object[] { request.Id }, cancellationToken);
        if (lecture == null)
        {
            return false;
        }

        _context.Lectures.Remove(lecture);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
