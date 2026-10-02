using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DevTask.Api.Contracts.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

namespace DevTask.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IConfiguration configuration) : ControllerBase
{
    private const int Pbkdf2Iterations = 600_000;
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(8);

    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login(LoginRequest request)
    {
        var configuredUsername = configuration["Auth:Username"]!;
        var storedHash = configuration["Auth:PasswordHash"]!;

        if (!string.Equals(request.Username, configuredUsername, StringComparison.Ordinal) ||
            !VerifyPassword(request.Password, storedHash))
        {
            return Unauthorized(new { message = "Username or password is incorrect." });
        }

        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.Add(TokenLifetime);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Convert.FromBase64String(configuration["Auth:JwtSigningKey"]!)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: "DevTask.Api",
            audience: "DevTask.Web",
            claims: [new Claim(ClaimTypes.Name, configuredUsername)],
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return Ok(new LoginResponse(new JwtSecurityTokenHandler().WriteToken(token), expiresAt));
    }

    private static bool VerifyPassword(string password, string encodedHash)
    {
        var parts = encodedHash.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2-sha256" ||
            !int.TryParse(parts[1], out var iterations) || iterations < Pbkdf2Iterations)
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expected = Convert.FromBase64String(parts[3]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
