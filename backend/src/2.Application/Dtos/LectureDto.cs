using System;
using PowerBILearning.Domain.Enums;

namespace PowerBILearning.Application.Dtos;

public class LectureDto
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public required string LectureNumber { get; set; }
    public long SizeBytes { get; set; }
    public CourseStatus Status { get; set; }
    public string? NoteContent { get; set; }
}
