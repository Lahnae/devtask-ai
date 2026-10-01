using DevTask.Api.Contracts.Projects;
using DevTask.Api.Data;
using DevTask.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskStatus = DevTask.Api.Models.TaskStatus;

namespace DevTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProjectsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var projects = await dbContext.Projects
            .AsNoTracking()
            .OrderByDescending(project => project.UpdatedAt)
            .Select(project => new ProjectResponse(
                project.Id,
                project.Name,
                project.Description,
                project.CreatedAt,
                project.UpdatedAt,
                project.Tasks.Count,
                project.Tasks.Count(task => task.Status == TaskStatus.Done)))
            .ToListAsync(cancellationToken);

        return Ok(projects);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .Where(project => project.Id == id)
            .Select(project => new ProjectResponse(
                project.Id,
                project.Name,
                project.Description,
                project.CreatedAt,
                project.UpdatedAt,
                project.Tasks.Count,
                project.Tasks.Count(task => task.Status == TaskStatus.Done)))
            .SingleOrDefaultAsync(cancellationToken);

        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Create(
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var project = new Project
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new ProjectResponse(
            project.Id,
            project.Name,
            project.Description,
            project.CreatedAt,
            project.UpdatedAt,
            TaskCount: 0,
            CompletedTaskCount: 0);

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.FindAsync([id], cancellationToken);
        if (project is null)
        {
            return NotFound();
        }

        dbContext.Projects.Remove(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
