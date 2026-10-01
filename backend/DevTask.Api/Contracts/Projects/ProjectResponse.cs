namespace DevTask.Api.Contracts.Projects;

public sealed record ProjectResponse(
    int Id,
    string Name,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    int TaskCount,
    int CompletedTaskCount);
