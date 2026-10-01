namespace DevTask.Api.Models;

public sealed class Project
{
    public int Id { get; set; }

    public required string Name { get; set; }

    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
