using System;
using PowerBILearning.Domain.Common;
using PowerBILearning.Domain.Enums;

namespace PowerBILearning.Domain.Entities;

public class Lecture : BaseEntity
{
    public required string Title { get; set; }
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public required string LectureNumber { get; set; }
    public long SizeBytes { get; set; }
    public CourseStatus Status { get; set; } = CourseStatus.Unread;
    
    // Navigation Property
    public Note? Note { get; set; }
}
