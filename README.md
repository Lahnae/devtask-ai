# DevTask AI

DevTask AI on projektien ja tehtävien hallintaan tarkoitettu verkkosovellus. V1 sisältää React- ja TypeScript-käyttöliittymän, ASP.NET Core Web API -palvelun, Entity Framework Core -tiedonhallinnan ja SQL Server -tietokannan. Sovelluksessa ei vielä ole AI-toimintoja.

## Nykyinen tila

- Käyttöliittymä: React, TypeScript ja Vite.
- API: ASP.NET Core Web API ja .NET 10.
- Tietokanta: Entity Framework Core 10 ja SQL Server -provider. Paikallisesti käytetään SQL Server LocalDB:tä; Azure-ympäristössä Azure SQL:ää.
- Kirjautuminen: yksi konfiguroitu käyttäjä kirjautuu API:n kautta. Projektien ja tehtävien reitit vaativat lyhytikäisen bearer-tunnisteen. Health-reitti `/api/health` on julkinen.
- Toiminnot: projektien luonti, listaus ja poisto; tehtävien luonti ja poisto sekä tilan päivitys; tehtävien määrät ja edistyminen projekteissa.
- Tietokantamigraatio `InitialCreate` luo `Projects`- ja `Tasks`-taulut.
- Azure V1 -ympäristöön on määritetty Azure SQL, Azure App Service ja Azure Static Web Apps. GitHub Actions -julkaisu käynnistetään käsin `main`-haarasta.

`dev` on integraatiohaara. Muutokset valmistellaan siinä ennen niiden yhdistämistä `main`-haaraan.

## Hakemistorakenne

```text
frontend/                 React + TypeScript -käyttöliittymä
backend/DevTask.Api/      ASP.NET Core Web API
DevTask.sln               .NET-ratkaisu
dotnet-tools.json         Paikallisten .NET-työkalujen määritys (EF Core CLI)
```

## Paikallinen kehitys Windowsissa

### Vaatimukset

- Node.js 22.12 tai uudempi ja npm (frontendin työkalut tukevat myös Node.js 24:ää).
- .NET 10 SDK.
- SQL Server Express LocalDB.

Tarkista versiot PowerShellissä:

```powershell
node --version
dotnet --version
```

LocalDB-instanssi kuuluu sen luoneelle Windows-käyttäjälle. Luo ja käynnistä instanssi samalla Windows-tilillä, jolla ajat API:a.

### 1. Luo ja käynnistä LocalDB-instanssi

Suorita PowerShellissä. Komento etsii `SqlLocalDB.exe`-tiedoston Program Files -kansiosta, luo projektin instanssin vain jos sitä ei vielä ole ja käynnistää sen:

```powershell
$localDb = Get-ChildItem "$env:ProgramFiles\Microsoft SQL Server" -Filter SqlLocalDB.exe -Recurse | Select-Object -First 1 -ExpandProperty FullName; if (-not (& $localDb info | Select-String -Quiet '^DevTaskAi$')) { & $localDb create DevTaskAi }; & $localDb start DevTaskAi
```

API:n yhteysmerkkijono on tiedostossa `backend/DevTask.Api/appsettings.json` ja osoittaa instanssiin `(localdb)\DevTaskAi`.

### 2. Aja EF Core -migraatio

Aja projektin juuresta paikallisten työkalujen palautus ja tietokannan skeeman luonti tai päivitys:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef database update --project backend\DevTask.Api\DevTask.Api.csproj --startup-project backend\DevTask.Api\DevTask.Api.csproj
```

Komennon voi ajaa uudelleen: EF Core lisää vain migraatiot, joita ei ole vielä kirjattu tietokantaan.

### 3. Käynnistä API

Luo paikalliset kirjautumistiedot kerran ennen ensimmäistä käynnistystä. Skripti kysyy uuden salasanan näyttämättä sitä, tallentaa tarvittavat arvot .NET User Secrets -säilöön Git-repositorion ulkopuolelle ja luo Azuren portaalia varten Gitin ulkopuolelle jätettävän asetustiedoston:

```powershell
.\backend\DevTask.Api\Initialize-LocalAuth.ps1
```

Käynnistä API projektin juuresta:

```powershell
dotnet run --project backend\DevTask.Api\DevTask.Api.csproj --launch-profile https
```

API kuuntelee osoitteissa `https://localhost:7295` ja `http://localhost:5284`. Paikallinen health-reitti on `https://localhost:7295/api/health`, eikä se vaadi kirjautumista.

### 4. Käynnistä käyttöliittymä

Avaa toinen PowerShell-ikkuna projektin juuressa ja suorita:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Avaa [http://localhost:5173](http://localhost:5173) ja kirjaudu käyttäjätunnuksella `TestiSeppo` sekä asennusskriptissä määritetyllä salasanalla. Pidä molemmat terminaalit käynnissä sovelluksen käytön ajan. Luo projekti **New project** -toiminnolla ja lisää siihen tehtäviä.

Jos PowerShell käyttää vanhaa Node.js-versiota, varmista että `node --version` näyttää vähintään version 22.12 ennen Viten käynnistämistä. Alkuperäisellä kehityskoneella Node.js 24 sijaitsee hakemistossa `C:\Program Files\nodejs`; voit lisätä sen nykyisen terminaalin PATH-muuttujan alkuun:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
```

### LocalDB-vianmääritys

Jos API ilmoittaa, ettei LocalDB-instanssia ole, tarkista `SqlLocalDB.exe info` ja luo tai käynnistä `DevTaskAi` samalla Windows-tilillä, jolla API ajetaan. Älä luo toista instanssia, jos `DevTaskAi` on jo listassa; käynnistä olemassa oleva instanssi.

Joidenkin NVMe-levyjen fyysinen suoritussektorin koko ylittää 4 kt, jota SQL Server ei tue. Tarkista arvo komennolla `fsutil fsinfo sectorinfo C:`. Jos SQL Server ei käynnisty ja arvo ylittää 4096, katso Microsoftin [SQL Serverin levysektorikoon vianmääritysohje](https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/database-file-operations/troubleshoot-os-4kb-disk-sector-size).

## GitHub Actions

CI-työnkulku rakentaa frontendin ja API:n, kun `dev`- tai `main`-haaraan pushataan tai niihin kohdistuva pull request avataan tai sitä päivitetään. Työnkulku käyttää Node.js 24:ää ja .NET 10 SDK:ta. Se ei aja automaattisia testejä.

## Azure-julkaisu

V1:n Azure-resurssit on luotu **West Europe** -alueelle resurssiryhmään `DevTaskAi`:

- Azure SQL -palvelin: `devtask-ai.database.windows.net`.
- Azure SQL -tietokanta: `devtask-ai-free-sql-db`. Käytössä on vain Microsoft Entra -tunnistautuminen, ja `InitialCreate`-migraatio on ajettu.
- App Service -suunnitelma: `devtask-ai-api`.
- API:n App Service: `devtask`, osoite [https://devtask-hubmbka5d8fybnh9.westeurope-01.azurewebsites.net](https://devtask-hubmbka5d8fybnh9.westeurope-01.azurewebsites.net). Palvelun järjestelmäkohtainen hallittu identiteetti on käytössä ja sillä on luku- ja kirjoitusoikeus tietokantaan.
- Azure Static Web App: `devtask-ai`, osoite [https://yellow-coast-0f0d5bd03.1.azurestaticapps.net](https://yellow-coast-0f0d5bd03.1.azurestaticapps.net).

API:n App Service -asetuksiin kuuluvat `ConnectionStrings__DefaultConnection` (hallittu identiteetti), `Cors__AllowedOrigins__0` (Static Web Appin origin) sekä alla mainitut kirjautumisasetukset. Älä tallenna tietokannan salasanaa yhteysmerkkijonoon.

`.github/workflows/deploy-azure.yml` on manuaalinen työnkulku, joka julkaisee molemmat sovellukset `main`-haarasta. API-julkaisussa GitHub Actions kirjautuu Azureen OIDC:llä; frontendin julkaisu käyttää Static Web Apps -julkaisutunnistetta. Entraan on lisätty GitHub Actionsin federointi `main`-haaraa varten. Varmista ennen julkaisua myös, että käytetyt tunnisteet, oikeudet, muuttujat ja salaisuudet vastaavat alla olevia vaatimuksia.

GitHub-repositorion **Settings → Secrets and variables → Actions** -asetuksiin tarvitaan:

- Muuttujat: `AZURE_WEBAPP_NAME` = `devtask` ja `VITE_API_BASE_URL` = `https://devtask-hubmbka5d8fybnh9.westeurope-01.azurewebsites.net`.
- Salaisuudet: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` ja `AZURE_STATIC_WEB_APPS_API_TOKEN`. Hae jälkimmäinen Static Web Appin julkaisutunnisteiden sivulta. Älä commitoi tai jaa salaisuuksia.
- Entra-sovellusrekisteröinti luottaa GitHub-repositorion `Lahnae/devtask-ai` `main`-haaraan (`repo:Lahnae/devtask-ai:ref:refs/heads/main`). Sen palveluperiaatteella tulee olla **Website Contributor** -rooli `devtask` App Servicessä.

Kirjautumisasetusten pitää olla App Servicessä ennen kirjautumista vaativan API-version julkaisua. Aja `backend\DevTask.Api\Initialize-LocalAuth.ps1` paikallisesti ja kopioi sen Gitin ulkopuolelle jätetyn tiedoston `backend\DevTask.Api\auth-settings.local.json` kolme arvoa `devtask` App Servicen **Configuration → Environment variables** -asetuksiin nimillä `Auth__Username`, `Auth__PasswordHash` ja `Auth__JwtSigningKey`. Tallenna asetukset ja käynnistä App Service uudelleen. Älä koskaan commitoi tai liitä luotua tiedostoa GitHubiin.

Kun `main` sisältää julkaistavan version, valitse GitHubissa **Actions → Deploy to Azure → Run workflow** ja käynnistä työnkulku `main`-haaralle. Julkaisutyönkulku ei aja EF Core -migraatioita automaattisesti. Tarkista migraatiot ja aja ne Azure SQL:ään ennen sellaisen koodin julkaisua, joka edellyttää uusia skeemamuutoksia.

Kirjautumisreitillä on viiden yrityksen minuuttikohtainen rajoitus asiakas-IP:tä kohti. Tunniste vanhenee kahdeksan tunnin kuluttua ja säilytetään vain selaimen istunnossa. Salasanat tallennetaan suolattuina PBKDF2-tiivisteinä. Paikalliset tiivisteet ja JWT-allekirjoitusavain tallennetaan .NET User Secrets -säilöön; tuotannossa ne ovat Azure App Servicen asetuksissa.

---

# DevTask AI

DevTask AI is a project and task management web application. V1 includes a React and TypeScript frontend, an ASP.NET Core Web API, Entity Framework Core, and SQL Server. The application does not yet include AI features.

## Current status

- Frontend: React, TypeScript, and Vite.
- API: ASP.NET Core Web API on .NET 10.
- Database: Entity Framework Core 10 with the SQL Server provider. Local development uses SQL Server LocalDB; Azure uses Azure SQL.
- Sign-in: one configured user signs in through the API. Project and task routes require a short-lived bearer token. The `/api/health` endpoint is public.
- Features: create, list, and delete projects; create and delete tasks and update their status; show task counts and progress for projects.
- The `InitialCreate` database migration creates the `Projects` and `Tasks` tables.
- Azure V1 resources are provisioned for Azure SQL, Azure App Service, and Azure Static Web Apps. The GitHub Actions deployment is manually triggered from the `main` branch.

`dev` is the integration branch. Changes are prepared there before they are merged into `main`.

## Repository layout

```text
frontend/                 React + TypeScript application
backend/DevTask.Api/      ASP.NET Core Web API
DevTask.sln               .NET solution
dotnet-tools.json         Local .NET tool manifest (EF Core CLI)
```

## Local development on Windows

### Prerequisites

- Node.js 22.12 or newer and npm (the frontend toolchain also supports Node.js 24).
- .NET 10 SDK.
- SQL Server Express LocalDB.

Check the installed versions in PowerShell:

```powershell
node --version
dotnet --version
```

LocalDB instances belong to the Windows user that created them. Create and start the instance using the same Windows account that runs the API.

### 1. Create and start the LocalDB instance

Run this in PowerShell. It locates `SqlLocalDB.exe` under Program Files, creates the project instance only if it does not already exist, and starts it:

```powershell
$localDb = Get-ChildItem "$env:ProgramFiles\Microsoft SQL Server" -Filter SqlLocalDB.exe -Recurse | Select-Object -First 1 -ExpandProperty FullName; if (-not (& $localDb info | Select-String -Quiet '^DevTaskAi$')) { & $localDb create DevTaskAi }; & $localDb start DevTaskAi
```

The API connection string is in `backend/DevTask.Api/appsettings.json` and points to `(localdb)\DevTaskAi`.

### 2. Apply the EF Core migration

From the repository root, restore the local tools and create or update the database schema:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef database update --project backend\DevTask.Api\DevTask.Api.csproj --startup-project backend\DevTask.Api\DevTask.Api.csproj
```

You can rerun this command; EF Core applies only migrations that have not already been recorded in the database.

### 3. Start the API

Set up local authentication secrets once before the first run. The script prompts for a new password without displaying it, stores the values in .NET User Secrets outside the Git repository, and creates a Git-ignored settings file for the Azure portal:

```powershell
.\backend\DevTask.Api\Initialize-LocalAuth.ps1
```

Start the API from the repository root:

```powershell
dotnet run --project backend\DevTask.Api\DevTask.Api.csproj --launch-profile https
```

The API listens at `https://localhost:7295` and `http://localhost:5284`. The local health endpoint is `https://localhost:7295/api/health` and does not require sign-in.

### 4. Start the frontend

Open a second PowerShell window at the repository root and run:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with username `TestiSeppo` and the password entered in the setup script. Keep both terminals running while using the app. Create a project from **New project**, then add tasks to it.

If PowerShell selects an older Node.js installation, make sure `node --version` reports 22.12 or newer before starting Vite. On the original development machine, Node.js 24 is installed at `C:\Program Files\nodejs`; prepend it to the current terminal's PATH if needed:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
```

### LocalDB troubleshooting

If the API reports that the LocalDB instance does not exist, check `SqlLocalDB.exe info` and create or start `DevTaskAi` under the same Windows account that runs the API. Do not create a second instance when `DevTaskAi` is already listed; start the existing instance instead.

Some NVMe drives report a physical performance sector size greater than 4 KB, which SQL Server does not support. Check with `fsutil fsinfo sectorinfo C:`. If SQL Server fails to start and the value is greater than 4096, see Microsoft's [SQL Server disk sector size troubleshooting guide](https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/database-file-operations/troubleshoot-os-4kb-disk-sector-size).

## GitHub Actions

The CI workflow builds the frontend and API on pushes to `dev` or `main` and on pull requests targeting either branch. It uses Node.js 24 and the .NET 10 SDK. It does not run automated tests.

## Azure deployment

V1 Azure resources are provisioned in **West Europe** under resource group `DevTaskAi`:

- Azure SQL server: `devtask-ai.database.windows.net`.
- Azure SQL database: `devtask-ai-free-sql-db`. It uses Microsoft Entra-only authentication, and the `InitialCreate` migration has been applied.
- App Service plan: `devtask-ai-api`.
- API App Service: `devtask`, at [https://devtask-hubmbka5d8fybnh9.westeurope-01.azurewebsites.net](https://devtask-hubmbka5d8fybnh9.westeurope-01.azurewebsites.net). Its system-assigned managed identity is enabled and has database read/write access.
- Azure Static Web App: `devtask-ai`, at [https://yellow-coast-0f0d5bd03.1.azurestaticapps.net](https://yellow-coast-0f0d5bd03.1.azurestaticapps.net).

The API App Service settings include `ConnectionStrings__DefaultConnection` (managed identity), `Cors__AllowedOrigins__0` (the Static Web App origin), and the authentication settings below. Do not store a database password in the connection string.

`.github/workflows/deploy-azure.yml` is a manual workflow that deploys both applications from `main`. For the API deployment, GitHub Actions signs in to Azure with OIDC; the frontend deployment uses the Static Web Apps deployment token. Entra federation for GitHub Actions has been added for the `main` branch. Before deployment, also verify that the credentials, permissions, variables, and secrets meet the requirements below.

The GitHub repository's **Settings → Secrets and variables → Actions** needs:

- Variables: `AZURE_WEBAPP_NAME` = `devtask` and `VITE_API_BASE_URL` = `https://devtask-hubmbka5d8fybnh9.westeurope-01.azurewebsites.net`.
- Secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and `AZURE_STATIC_WEB_APPS_API_TOKEN`. Get the latter from the Static Web App deployment token page. Do not commit or share secrets.
- The Entra app registration must trust the `main` branch of GitHub repository `Lahnae/devtask-ai` (`repo:Lahnae/devtask-ai:ref:refs/heads/main`). Its service principal needs the **Website Contributor** role on the `devtask` App Service.

Authentication settings must be present in App Service before deploying a login-enabled API version. Run `backend\DevTask.Api\Initialize-LocalAuth.ps1` locally and copy the three values from its Git-ignored `backend\DevTask.Api\auth-settings.local.json` into `devtask` App Service **Configuration → Environment variables** as `Auth__Username`, `Auth__PasswordHash`, and `Auth__JwtSigningKey`. Save the settings and restart the App Service. Never commit or paste the generated file into GitHub.

Once `main` contains the version to deploy, select **Actions → Deploy to Azure → Run workflow** in GitHub and run the workflow on the `main` branch. The deployment workflow does not run EF Core migrations automatically. Review and apply migrations to Azure SQL before deploying code that depends on schema changes.

The login endpoint is limited to five attempts per minute per client IP. Tokens expire after eight hours and are kept only in the browser session. Passwords are stored as salted PBKDF2 hashes. Local hashes and the JWT signing key are stored in .NET User Secrets; in production they are App Service settings.
