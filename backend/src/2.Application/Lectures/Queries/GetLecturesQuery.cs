using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PowerBILearning.Application.Common.Interfaces;
using PowerBILearning.Application.Dtos;

namespace PowerBILearning.Application.Lectures.Queries;

public record GetLecturesQuery : IRequest<List<LectureDto>>;

public class GetLecturesQueryHandler : IRequestHandler<GetLecturesQuery, List<LectureDto>>
{
    private readonly IApplicationDbContext _context;

    public GetLecturesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LectureDto>> Handle(GetLecturesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Lectures
            .Include(l => l.Note)
            .OrderBy(l => l.LectureNumber)
            .Select(l => new LectureDto
            {
                Id = l.Id,
                Title = l.Title,
                FileName = l.FileName,
                FilePath = l.FilePath,
                LectureNumber = l.LectureNumber,
                SizeBytes = l.SizeBytes,
                Status = l.Status,
                NoteContent = l.Note != null ? l.Note.Content : string.Empty
            })
            .ToListAsync(cancellationToken);
    }
}
