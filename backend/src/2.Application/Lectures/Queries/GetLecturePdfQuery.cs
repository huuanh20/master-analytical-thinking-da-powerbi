using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using PowerBILearning.Application.Common.Interfaces;

namespace PowerBILearning.Application.Lectures.Queries;

public record GetLecturePdfQuery(Guid Id) : IRequest<byte[]?>;

public class GetLecturePdfQueryHandler : IRequestHandler<GetLecturePdfQuery, byte[]?>
{
    private readonly IApplicationDbContext _context;

    public GetLecturePdfQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]?> Handle(GetLecturePdfQuery request, CancellationToken cancellationToken)
    {
        var lecture = await _context.Lectures.FindAsync(new object[] { request.Id }, cancellationToken);
        return lecture?.PdfData;
    }
}
