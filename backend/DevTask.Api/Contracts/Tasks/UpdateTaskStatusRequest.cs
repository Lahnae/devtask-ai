using DevTask.Api.Models;
using TaskStatus = DevTask.Api.Models.TaskStatus;

namespace DevTask.Api.Contracts.Tasks;

public sealed class UpdateTaskStatusRequest
{
    public TaskStatus Status { get; init; }
}
