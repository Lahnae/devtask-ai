using System.ComponentModel.DataAnnotations;

namespace DevTask.Api.Contracts.Projects;

public sealed class UpdateProjectRequest
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public required string Name { get; init; }

    [StringLength(2000)]
    public string? Description { get; init; }
}
