using HSManager.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace HSManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;

        public AuthController(ILogger<AuthController> logger)
        {
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] HSALoginRequest request)
        {
            if (request.Username != "admin" || request.Password != "password")
            {
                _logger.LogWarning("❌ Invalid login attempt for user: {Username}", request.Username);
                return Unauthorized(new { Message = "Invalid credentials" });
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, request.Username),
                new Claim(ClaimTypes.Role, "Admin"),
                new Claim("UserID", "1"),
                new Claim("Token", Guid.NewGuid().ToString())
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1)
            };

            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            var response = new HSALoginResponse
            {
                UserID = 1,
                UserToken = claims.First(c => c.Type == "Token").Value,
                UserLanguage = (int)Languages.English
            };

            _logger.LogInformation("🔽 Sending login response: {Response}", JsonSerializer.Serialize(response));
            return Ok(response);
        }
    }
}