using System.ComponentModel.DataAnnotations;
using DevTask.Api.Models;

namespace DevTask.Api.Contracts.Tasks;

public sealed class CreateTaskRequest
{
    [Required]
    [StringLength(160, MinimumLength = 2)]
    public required string Title { get; init; }

    [StringLength(2000)]
    public string? Description { get; init; }

    public TaskPriority Priority { get; init; } = TaskPriority.Medium;

    public DateOnly? DueDate { get; init; }
}
