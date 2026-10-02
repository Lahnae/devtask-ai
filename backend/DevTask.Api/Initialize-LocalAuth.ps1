$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot 'DevTask.Api.csproj'

$securePassword = Read-Host 'Enter a new, unique DevTask AI password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$passwordBytes = $null
$salt = [Security.Cryptography.RandomNumberGenerator]::GetBytes(16)
$jwtKey = [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)

try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $passwordBytes = [Text.Encoding]::UTF8.GetBytes($password)
    $derivedBytes = [Security.Cryptography.Rfc2898DeriveBytes]::Pbkdf2($passwordBytes, $salt, 600000, [Security.Cryptography.HashAlgorithmName]::SHA256, 32)
    $passwordHash = 'pbkdf2-sha256$600000${0}${1}' -f [Convert]::ToBase64String($salt), [Convert]::ToBase64String($derivedBytes)
    $settings = [ordered]@{
        'Auth:Username' = 'TestiSeppo'
        'Auth:PasswordHash' = $passwordHash
        'Auth:JwtSigningKey' = [Convert]::ToBase64String($jwtKey)
    }

    foreach ($entry in $settings.GetEnumerator()) {
        dotnet user-secrets set $entry.Key $entry.Value --project $project | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Could not save local secret $($entry.Key). Run 'dotnet tool restore' and try again." }
    }

    $settings | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'auth-settings.local.json') -Encoding utf8
    Write-Host 'Local authentication secrets saved with dotnet user-secrets.'
    Write-Host 'Azure settings were written to auth-settings.local.json (ignored by Git). Copy them to the API App Service Configuration > Environment variables.'
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    if ($passwordBytes) { [Security.Cryptography.CryptographicOperations]::ZeroMemory($passwordBytes) }
    if ($salt) { [Security.Cryptography.CryptographicOperations]::ZeroMemory($salt) }
    if ($jwtKey) { [Security.Cryptography.CryptographicOperations]::ZeroMemory($jwtKey) }
    if ($derivedBytes) { [Security.Cryptography.CryptographicOperations]::ZeroMemory($derivedBytes) }
    $password = $null
}
