# DevTask AI frontend

The React + TypeScript client for DevTask AI. In local development, Vite proxies `/api` requests to the ASP.NET API at `https://localhost:7295`.

From the repository root, start the API with:

```powershell
dotnet run --launch-profile https --project backend/DevTask.Api
```

Then start the frontend in another terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

For Azure Static Web Apps, set `VITE_API_BASE_URL` to the deployed API base URL.
