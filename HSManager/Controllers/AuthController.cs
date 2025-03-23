using HSManager.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace HSManager.Controllers
{
    // This controller handles authentication-related API endpoints, like logging in.
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // We'll use this logger to keep track of what's happening during login attempts.
        private readonly ILogger<AuthController> _logger;

        // Constructor: We're injecting the logger so we can log important events.
        public AuthController(ILogger<AuthController> logger)
        {
            _logger = logger;
        }

        // This endpoint handles user login requests. It expects a POST request with a username and password.
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] HSALoginRequest request)
        {
            // Let's check if the provided credentials are correct. For now, we're hardcoding "admin" and "password"
            // as the valid credentials. In a real app, you'd want to check against a database or an identity provider.
            if (request.Username != "admin" || request.Password != "password")
            {
                // Uh-oh, the credentials don't match. Let's log this as a warning so we can keep an eye on failed attempts.
                _logger.LogWarning("Invalid login attempt for user: {Username}", request.Username);
                // Send back a 401 Unauthorized response with a friendly message.
                return Unauthorized(new { Message = "Invalid credentials" });
            }

            // If we get here, the credentials are valid! Let's set up the user's claims.
            // Claims are like little pieces of info about the user that we can use later, like their name, role, etc.
            var claims = new List<Claim>
            {
                // We're adding the username as a claim so we know who this user is.
                new Claim(ClaimTypes.Name, request.Username),
                // This user is an admin, so let's give them the "Admin" role.
                new Claim(ClaimTypes.Role, "Admin"),
                // We're assigning a user ID of "1" for now. In a real app, this would come from the database.
                new Claim("UserID", "1"),
                // Let's generate a unique token for this session using a GUID. This will be used to authenticate API requests.
                new Claim("Token", Guid.NewGuid().ToString())
            };

            // Now we need to create an identity for the user based on these claims.
            // We're using cookie authentication, so this identity will be stored in a cookie.
            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            // Let's set some properties for the authentication cookie.
            var authProperties = new AuthenticationProperties
            {
                // We want the cookie to persist even after the browser is closed (until it expires).
                IsPersistent = true,
                // The cookie will expire after 1 hour. After that, the user will need to log in again.
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1)
            };

            // Time to sign the user in! This will create the authentication cookie and send it to the browser.
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            // Let's prepare the response to send back to the client.
            var response = new HSALoginResponse
            {
                // The user ID we're sending back. Matches the claim we set earlier.
                UserID = 1,
                // The token we generated earlier. The client can use this for authenticated API calls.
                UserToken = claims.First(c => c.Type == "Token").Value,
                // We're setting the language to English for now. This could be based on user preferences in a real app.
                UserLanguage = (int)Languages.English
            };

            // Let's log the response we're sending back, just so we have a record of it.
            _logger.LogInformation("Sending login response: {Response}", JsonSerializer.Serialize(response));

            // Everything went well, so let's send a 200 OK response with the login details.
            return Ok(response);
        }
    }
}