using System;
using PowerBILearning.Domain.Common;

namespace PowerBILearning.Domain.Entities;

public class Note : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    
    // Foreign Key and Navigation Property
    public Guid LectureId { get; set; }
    public Lecture? Lecture { get; set; }
}
