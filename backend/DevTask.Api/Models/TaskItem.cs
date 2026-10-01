namespace DevTask.Api.Models;

public sealed class TaskItem
{
    public int Id { get; set; }

    public int ProjectId { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public TaskStatus Status { get; set; } = TaskStatus.Todo;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateOnly? DueDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Project Project { get; set; } = null!;
}

public enum TaskStatus
{
    Todo,
    InProgress,
    Done
}

public enum TaskPriority
{
    Low,
    Medium,
    High
}
