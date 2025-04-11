using HSManager.Models.MenuModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace HSManager.Controllers.MenuControllers
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

        private string ConvertSvgToBase64(string fileName)
        {
            try
            {
                string filePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "assets", "icons", fileName);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("SVG file not found: {FilePath}", filePath);
                    return string.Empty;
                }
                string svgContent = System.IO.File.ReadAllText(filePath);
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
                // New Home menu item using MenuType.Home
                new MenuItem
                {
                    Id = (int)MenuType.None,  // Matches the updated enum (0)
                    Name = "Home",
                    Description = "Home",
                    Icon = new Icon
                    {
                        Name = "home",
                        AlternativeText = "Home",
                        Base64 = ConvertSvgToBase64("home.svg")
                    }
                },
                new MenuItem
                {
                    Id = (int)MenuType.TableManager,  // 1
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
                    Id = (int)MenuType.InternalUserManager,  // 2
                    Name = "Internal Users",
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
                    Id = (int)MenuType.ExternalUserManager,  // 3
                    Name = "External Users",
                    Description = "Manage external user accounts",
                    Icon = new Icon
                    {
                        Name = "sharededit",
                        AlternativeText = "External Users",
                        Base64 = ConvertSvgToBase64("sharededit.svg")
                    }
                }
            };

            _logger.LogInformation("Menu fetched for UserID: {UserId}", userId);
            return Ok(menu);
        }
    }
}