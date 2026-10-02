# DevTask AI

DevTask AI is a project and task management web application. The current V1 implementation runs locally with a React + TypeScript frontend, an ASP.NET Core Web API, Entity Framework Core, and SQL Server LocalDB.

## Current status

- Frontend: React, TypeScript, and Vite.
- Backend: ASP.NET Core Web API on .NET 10.
- Data access: Entity Framework Core 10 with SQL Server provider.
- Local database: SQL Server LocalDB, using the `DevTaskAi` instance and `DevTaskAi` database.
- Database schema: the `InitialCreate` migration creates `Projects` and `Tasks` and is applied by the local database setup below.
- Implemented: create, list, and delete projects; create and delete tasks; update task status; show project task counts and progress.
- Azure deployment is not configured yet. The target is Azure SQL, Azure Static Web Apps for the frontend, and Azure App Service F1 for the API.

The `dev` branch is the integration branch. Changes are prepared there before they are merged into `main`.

## Repository layout

```text
frontend/                 React + TypeScript application
backend/DevTask.Api/      ASP.NET Core Web API
DevTask.sln               .NET solution
dotnet-tools.json         Local .NET tool manifest (EF Core CLI)
```

## Local development on Windows

### Prerequisites

- Node.js 22.12 or newer (Node.js 24 is also supported by the current frontend toolchain) and npm.
- .NET 10 SDK.
- SQL Server Express LocalDB.

Check the installed versions from PowerShell:

```powershell
node --version
dotnet --version
```

LocalDB instances are scoped to the Windows user that creates them. Create/start the instance and run the API from that same Windows account.

### 1. Create and start the LocalDB instance

Run this from PowerShell. It locates `SqlLocalDB.exe` under Program Files and creates the project instance only if it does not already exist:

```powershell
$localDb = Get-ChildItem "$env:ProgramFiles\Microsoft SQL Server" -Filter SqlLocalDB.exe -Recurse | Select-Object -First 1 -ExpandProperty FullName; if (-not (& $localDb info | Select-String -Quiet '^DevTaskAi$')) { & $localDb create DevTaskAi }; & $localDb start DevTaskAi
```

The API connection string is in `backend/DevTask.Api/appsettings.json` and points to `(localdb)\DevTaskAi`.

### 2. Apply the EF Core migration

From the repository root, restore the local .NET tools and create/update the database schema:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef database update --project backend\DevTask.Api\DevTask.Api.csproj --startup-project backend\DevTask.Api\DevTask.Api.csproj
```

The command is safe to rerun; EF Core applies only migrations that are not already recorded in the database.

### 3. Start the API

Open a PowerShell terminal at the repository root and run:

```powershell
dotnet run --project backend\DevTask.Api\DevTask.Api.csproj --launch-profile https
```

The API listens on `https://localhost:7295` and `http://localhost:5284`. The frontend's Vite development proxy targets the HTTPS endpoint. A health endpoint is available at `https://localhost:7295/api/health`.

### 4. Start the frontend

Open a second PowerShell terminal at the repository root and run:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Keep both terminals running while using the app. Create a project from **New project**, then add tasks within it.

If PowerShell selects an older Node.js installation, make sure `node --version` reports 22.12 or newer before starting Vite. On the original development machine, Node.js 24 is installed at `C:\Program Files\nodejs`; prepend it to the current terminal's PATH if needed:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
```

### LocalDB troubleshooting

If the API reports that the LocalDB instance does not exist, check `SqlLocalDB.exe info` and create/start `DevTaskAi` from the same Windows account that runs the API. Do not create a second instance when `DevTaskAi` is already listed; start the existing one instead.

Some NVMe drives report a physical performance sector size greater than 4 KB, which SQL Server does not support. Check with `fsutil fsinfo sectorinfo C:`. If SQL Server fails to start and the drive reports a value over 4096, follow Microsoft's [SQL Server disk sector size troubleshooting guide](https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/database-file-operations/troubleshoot-os-4kb-disk-sector-size).

## Azure deployment

Azure resources and deployment pipelines have not been created yet. The planned production architecture is Azure SQL, Azure Static Web Apps for the frontend, and Azure App Service F1 for the API. Configure production connection strings in App Service settings; never commit production secrets.
