using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews().AddRazorRuntimeCompilation();

// ✅ Add authentication and authorization
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Home/Index"; // Redirect to login page
        options.LogoutPath = "/api/auth/logout"; // Optional: Define logout path
        options.AccessDeniedPath = "/Home/Index"; // Redirect if access denied
        options.ExpireTimeSpan = TimeSpan.FromHours(1); // Cookie expiration
        options.SlidingExpiration = true; // Renew cookie on activity
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseStaticFiles();
app.UseRouting();

app.UseAuthentication(); // 🔥 Must be BEFORE authorization
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();