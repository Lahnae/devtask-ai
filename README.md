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
dotnet run --project backend/DevTask.Api
```

The frontend dashboard currently uses sample data. The API exposes a health check at `/api/health` and project endpoints at `/api/projects`; those endpoints need a configured SQL Server instance and the EF Core schema. Local development is set to SQL Server LocalDB. Production connection strings belong in Azure App Service configuration and must never be committed.
