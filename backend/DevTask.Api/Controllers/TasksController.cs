using DevTask.Api.Contracts.Tasks;
using DevTask.Api.Data;
using DevTask.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevTask.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:int}/tasks")]
public sealed class TasksController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskResponse>>> GetForProject(
        int projectId,
        CancellationToken cancellationToken)
    {
        if (!await dbContext.Projects.AnyAsync(project => project.Id == projectId, cancellationToken))
        {
            return NotFound();
        }

        var tasks = await dbContext.Tasks
            .AsNoTracking()
            .Where(task => task.ProjectId == projectId)
            .OrderBy(task => task.Status)
            .ThenBy(task => task.DueDate)
            .ThenBy(task => task.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(tasks.Select(ToResponse).ToList());
    }

    [HttpGet("{taskId:int}")]
    public async Task<ActionResult<TaskResponse>> GetById(
        int projectId,
        int taskId,
        CancellationToken cancellationToken)
    {
        var task = await dbContext.Tasks
            .AsNoTracking()
            .SingleOrDefaultAsync(
                task => task.Id == taskId && task.ProjectId == projectId,
                cancellationToken);

        return task is null ? NotFound() : Ok(ToResponse(task));
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(
        int projectId,
        CreateTaskRequest request,
        CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.FindAsync([projectId], cancellationToken);
        if (project is null)
        {
            return NotFound();
        }

        if (!Enum.IsDefined(request.Priority))
        {
            return BadRequest(new { message = "The requested task priority is not valid." });
        }

        var now = DateTimeOffset.UtcNow;
        var task = new TaskItem
        {
            ProjectId = projectId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = request.Priority,
            DueDate = request.DueDate,
            CreatedAt = now
        };

        project.UpdatedAt = now;
        dbContext.Tasks.Add(task);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, taskId = task.Id }, ToResponse(task));
    }

    [HttpPatch("{taskId:int}/status")]
    public async Task<ActionResult<TaskResponse>> UpdateStatus(
        int projectId,
        int taskId,
        UpdateTaskStatusRequest request,
        CancellationToken cancellationToken)
    {
        var task = await dbContext.Tasks
            .Include(task => task.Project)
            .SingleOrDefaultAsync(
                task => task.Id == taskId && task.ProjectId == projectId,
                cancellationToken);

        if (task is null)
        {
            return NotFound();
        }

        if (!Enum.IsDefined(request.Status))
        {
            return BadRequest(new { message = "The requested task status is not valid." });
        }

        task.Status = request.Status;
        task.Project.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(task));
    }

    [HttpDelete("{taskId:int}")]
    public async Task<IActionResult> Delete(
        int projectId,
        int taskId,
        CancellationToken cancellationToken)
    {
        var task = await dbContext.Tasks
            .Include(task => task.Project)
            .SingleOrDefaultAsync(
                task => task.Id == taskId && task.ProjectId == projectId,
                cancellationToken);

        if (task is null)
        {
            return NotFound();
        }

        task.Project.UpdatedAt = DateTimeOffset.UtcNow;
        dbContext.Tasks.Remove(task);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static TaskResponse ToResponse(TaskItem task) => new(
        task.Id,
        task.ProjectId,
        task.Title,
        task.Description,
        task.Status,
        task.Priority,
        task.DueDate,
        task.CreatedAt);
}
