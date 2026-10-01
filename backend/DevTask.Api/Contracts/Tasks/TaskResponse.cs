using DevTask.Api.Models;
using TaskStatus = DevTask.Api.Models.TaskStatus;

namespace DevTask.Api.Contracts.Tasks;

public sealed record TaskResponse(
    int Id,
    int ProjectId,
    string Title,
    string? Description,
    TaskStatus Status,
    TaskPriority Priority,
    DateOnly? DueDate,
    DateTimeOffset CreatedAt);
