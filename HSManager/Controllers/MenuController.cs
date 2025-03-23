using HSManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace HSManager.Controllers
{
    // This controller handles API requests related to the menu, like fetching the menu items for the sidebar.
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        // We'll use this logger to keep track of what's happening when fetching the menu.
        private readonly ILogger<MenuController> _logger;
        // We need the environment to figure out the file paths for our SVG icons.
        private readonly IHostEnvironment _environment;

        // Constructor: We're injecting the logger and environment so we can use them in our methods.
        public MenuController(ILogger<MenuController> logger, IHostEnvironment environment)
        {
            _logger = logger;
            _environment = environment;
        }

        // This helper method converts an SVG file into a base64 string so we can embed it directly in the HTML.
        private string ConvertSvgToBase64(string fileName)
        {
            try
            {
                // Let's build the full path to the SVG file. We expect it to be in wwwroot/assets/icons/.
                string filePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "assets", "icons", fileName);

                // First, let's make sure the file actually exists.
                if (!System.IO.File.Exists(filePath))
                {
                    // Oops, the file isn't there. Let's log a warning so we can investigate later.
                    _logger.LogWarning("SVG file not found: {FilePath}", filePath);
                    // Return an empty string since we can't proceed without the file.
                    return string.Empty;
                }

                // The file exists, so let's read its contents as a string.
                string svgContent = System.IO.File.ReadAllText(filePath);
                // Now, convert the SVG content to a base64 string so we can use it in an <img> tag.
                string base64String = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(svgContent));
                // Add the data URI prefix so the browser knows this is an SVG image in base64 format.
                return $"data:image/svg+xml;base64,{base64String}";
            }
            catch (Exception ex)
            {
                // Something went wrong while converting the SVG to base64. Let's log the error with details.
                _logger.LogError(ex, "Error converting SVG to base64: {FileName}", fileName);
                // Return an empty string as a fallback since we can't provide the icon.
                return string.Empty;
            }
        }

        // This endpoint fetches the menu items for the authenticated user. It's a GET request.
        [HttpGet]
        [Authorize] // This ensures only authenticated users can access this endpoint.
        public IActionResult GetMenu([FromQuery] string token, [FromQuery] int userId)
        {
            // Let's grab the token and user ID from the user's claims (stored in the authentication cookie).
            var storedToken = HttpContext.User.FindFirst("Token")?.Value;
            var storedUserId = HttpContext.User.FindFirst("UserID")?.Value;

            // We need to verify that the token and user ID provided in the query match the ones in the claims.
            // This is a security check to make sure the request is legit.
            if (storedToken != token || storedUserId != userId.ToString())
            {
                // The token or user ID doesn't match. Let's reject the request with a 401 Unauthorized response.
                return Unauthorized(new { Message = "Invalid token or user ID" });
            }

            // If we get here, the user is authenticated and the token/user ID match. Let's build the menu!
            var menu = new List<MenuItem>
            {
                // First menu item: Table Manager
                new MenuItem
                {
                    Id = (int)MenuType.TableManager, // This ID corresponds to the TableManager menu type.
                    Name = "Table Manager", // The name of the menu item.
                    Description = "Manage database tables", // A description for the tooltip or UI.
                    Icon = new Icon
                    {
                        Name = "detailsview", // The name of the SVG file (without the .svg extension).
                        AlternativeText = "Table Manager", // Alt text for accessibility.
                        Base64 = ConvertSvgToBase64("detailsview.svg") // Convert the SVG to base64 for embedding.
                    }
                },
                // Second menu item: Internal Users
                new MenuItem
                {
                    Id = (int)MenuType.InternalUserManager, // ID for InternalUserManager.
                    Name = "Internal Users", // Name of the menu item.
                    Description = "Manage internal user accounts", // Description for the UI.
                    Icon = new Icon
                    {
                        Name = "detailsedit", // SVG file name.
                        AlternativeText = "Internal Users", // Alt text.
                        Base64 = ConvertSvgToBase64("detailsedit.svg") // Convert to base64.
                    }
                },
                // Third menu item: External Users
                new MenuItem
                {
                    Id = (int)MenuType.ExternalUserManager, // ID for ExternalUserManager.
                    Name = "External Users", // Name of the menu item.
                    Description = "Manage external user accounts", // Description for the UI.
                    Icon = new Icon
                    {
                        Name = "sharededit", // SVG file name.
                        AlternativeText = "External Users", // Alt text.
                        Base64 = ConvertSvgToBase64("sharededit.svg") // Convert to base64.
                    }
                }
            };

            // Let's log that we successfully fetched the menu for this user. Good to keep a record!
            _logger.LogInformation("Menu fetched for UserID: {UserId}", userId);

            // Everything looks good, so let's send the menu back to the client with a 200 OK response.
            return Ok(menu);
        }
    }
}