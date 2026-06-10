using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace PowerBILearning.WebApi.Hubs;

/// <summary>
/// Real-time hub for broadcasting lecture updates (notes, status changes)
/// to all connected clients watching the same lecture.
/// </summary>
public class LectureHub : Hub
{
    /// <summary>
    /// Client calls this to join a lecture-specific group.
    /// All clients in the same group receive real-time updates for that lecture.
    /// </summary>
    public async Task JoinLectureRoom(string lectureId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"lecture-{lectureId}");
        await Clients.Caller.SendAsync("JoinedRoom", lectureId);
    }

    /// <summary>
    /// Client calls this to leave a lecture group (e.g., when switching lectures).
    /// </summary>
    public async Task LeaveLectureRoom(string lectureId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"lecture-{lectureId}");
    }

    /// <summary>
    /// Broadcast note update to all clients in the same lecture group.
    /// The sender is excluded to avoid echo.
    /// </summary>
    public async Task BroadcastNoteUpdate(string lectureId, string content)
    {
        await Clients.OthersInGroup($"lecture-{lectureId}")
            .SendAsync("NoteUpdated", new { LectureId = lectureId, Content = content });
    }

    /// <summary>
    /// Broadcast status change to all clients watching the same lecture.
    /// </summary>
    public async Task BroadcastStatusUpdate(string lectureId, int status)
    {
        await Clients.OthersInGroup($"lecture-{lectureId}")
            .SendAsync("StatusUpdated", new { LectureId = lectureId, Status = status });
    }
}
