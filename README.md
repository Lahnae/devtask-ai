# DevTask AI

DevTask AI is a project and task management web application.

## V1 architecture

- Frontend: React and TypeScript (Vite)
- Backend: ASP.NET Core Web API
- Data access: Entity Framework Core
- Database: Azure SQL
- Hosting: Azure Static Web Apps (frontend) and Azure App Service F1 (backend)

## Repository layout

```text
frontend/                 React + TypeScript application
backend/DevTask.Api/      ASP.NET Core Web API
```

The `dev` branch is the integration branch. Changes are prepared there before they are merged into `main`.

## Local development

Prerequisites: Node.js 22.12 or newer, .NET 10 SDK, and SQL Server LocalDB.

Run the frontend from the repository root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Run the API in a second terminal from the repository root:

```powershell
dotnet run --launch-profile https --project backend/DevTask.Api
```

The frontend loads workspace data from the API. The API exposes `/api/health`, project CRUD at `/api/projects`, and task operations under `/api/projects/{projectId}/tasks`. Data operations need SQL Server LocalDB and the EF Core schema initialized. Production connection strings belong in Azure App Service configuration and must never be committed.

V1 supports creating, listing, and deleting projects; adding and deleting tasks; changing task status; and showing project progress. The dashboard reads and writes through the API rather than local sample data.
