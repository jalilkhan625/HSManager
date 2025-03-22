using HSManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace HSManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly ILogger<MenuController> _logger;
        private readonly IHostEnvironment _environment;

        public MenuController(ILogger<MenuController> logger, IHostEnvironment environment)
        {
            _logger = logger;
            _environment = environment;
        }

        // Helper function to read SVG file and convert to base64
        private string ConvertSvgToBase64(string fileName)
        {
            try
            {
                // Construct the path to the SVG file in wwwroot/assets/icons/
                string filePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "assets", "icons", fileName);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("SVG file not found: {FilePath}", filePath);
                    return string.Empty;
                }

                // Read the SVG file content
                string svgContent = System.IO.File.ReadAllText(filePath);

                // Convert the SVG content to base64
                string base64String = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(svgContent));
                return $"data:image/svg+xml;base64,{base64String}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting SVG to base64: {FileName}", fileName);
                return string.Empty;
            }
        }

        [HttpGet]
        [Authorize]
        public IActionResult GetMenu([FromQuery] string token, [FromQuery] int userId)
        {
            var storedToken = HttpContext.User.FindFirst("Token")?.Value;
            var storedUserId = HttpContext.User.FindFirst("UserID")?.Value;
            if (storedToken != token || storedUserId != userId.ToString())
            {
                return Unauthorized(new { Message = "Invalid token or user ID" });
            }

            var menu = new List<MenuItem>
            {
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,
                    Name = "Table Manager",
                    Description = "Manage database tables",
                    Icon = new Icon
                    {
                        Name = "detailsview",
                        AlternativeText = "Table Manager",
                        Base64 = ConvertSvgToBase64("detailsview.svg")
                    }
                },
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,
                    Name = "TableManager",
                    Description = "Manage internal user accounts",
                    Icon = new Icon
                    {
                        Name = "detailsedit",
                        AlternativeText = "Internal Users",
                        Base64 = ConvertSvgToBase64("detailsedit.svg")
                    }
                },
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,
                    Name = "TableManager",
                    Description = "Manage external user accounts",
                    Icon = new Icon
                    {
                        Name = "sharededit",
                        AlternativeText = "External Users",
                        Base64 = ConvertSvgToBase64("sharededit.svg")
                    }
                },
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,
                    Name = "TableManager",
                    Description = "Manage macros",
                    Icon = new Icon
                    {
                        Name = "macro",
                        AlternativeText = "Macros",
                        Base64 = ConvertSvgToBase64("macro.svg")
                    }
                },
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,
                    Name = "TableManager",
                    Description = "Manage integrations",
                    Icon = new Icon
                    {
                        Name = "integrations",
                        AlternativeText = "Integrations",
                        Base64 = ConvertSvgToBase64("integrations.svg")
                    }
                },
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,
                    Name = "TableManager",
                    Description = "Manage groups",
                    Icon = new Icon
                    {
                        Name = "groups",
                        AlternativeText = "Groups",
                        Base64 = ConvertSvgToBase64("groups.svg")
                    }
                },
             

            };

            _logger.LogInformation("Menu fetched for UserID: {UserId}", userId);
            return Ok(menu);
        }
    }
}