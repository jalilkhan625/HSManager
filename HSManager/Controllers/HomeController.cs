using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HSManager.Models;
using System.Diagnostics;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;

namespace HSManager.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

       
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Index()
        {
            return View(); // Shows login page
        }
        [HttpGet]
        [Authorize] // 🔒 Only authenticated users can access
        public IActionResult Dashboard()
        {
            _logger.LogInformation("User {User} accessed Dashboard", User.Identity.Name);
            return View();
        }
        [HttpGet]
        [Authorize]
        [Route("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            _logger.LogInformation("User {User} logged out.", User.Identity.Name);
            return RedirectToAction("Index", "Home");
        }


        [HttpGet]
        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}