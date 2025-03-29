using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using HSManager.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace HSManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TableManagerController : ControllerBase
    {
        private readonly IHostEnvironment _environment;

        public TableManagerController(IHostEnvironment environment)
        {
            _environment = environment;
            InjectIcons();
        }

        // Convert PNG image from main-icons folder to base64
        private string ConvertImageToBase64(string fileName)
        {
            try
            {
                string filePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "assets", "main-icons", fileName);

                if (!System.IO.File.Exists(filePath))
                    return string.Empty;

                byte[] imageBytes = System.IO.File.ReadAllBytes(filePath);
                string base64String = Convert.ToBase64String(imageBytes);

                string extension = Path.GetExtension(fileName).ToLowerInvariant();
                string mimeType = extension switch
                {
                    ".svg" => "image/svg+xml",
                    ".png" => "image/png",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    _ => "application/octet-stream"
                };

                return $"data:{mimeType};base64,{base64String}";
            }
            catch
            {
                return string.Empty;
            }
        }

        private readonly List<Area> _areas = new()
        {
            new Area
            {
                Id = 1,
                ParentId = 0,
                Name = "Company",
                Description = "Contains company-related data",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Company Icon" }
            },
            new Area
            {
                Id = 2,
                ParentId = 0,
                Name = "Organizations",
                Description = "Contains organization-related data",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Organizations Icon" }
            },
            new Area
            {
                Id = 3,
                ParentId = 0,
                Name = "Hyperspace",
                Description = "Contains Hyperspace system data",
                Visible = true,
                SortIndex = 2,
                Icon = new TableIcon { AlternativeText = "Hyperspace Icon" }
            }
        };

        private readonly List<Table> _tables = new()
        {
            new Table
            {
                Id = 101,
                ParentId = 1,
                Name = "Company",
                Description = "Company details",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Company Table Icon" },
                SystemProperties = new Table.SystemProperty { Clearance = true }
            },
            new Table
            {
                Id = 102,
                ParentId = 1,
                Name = "Company Departments",
                Description = "Company departments",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Departments Table Icon" },
                SystemProperties = new Table.SystemProperty()
            },
            new Table
            {
                Id = 103,
                ParentId = 1,
                Name = "Company Resources",
                Description = "Internal users",
                Visible = true,
                SortIndex = 2,
                Icon = new TableIcon { AlternativeText = "Resources Table Icon" },
                SystemProperties = new Table.SystemProperty()
            }
        };

        private readonly List<FieldGroup> _fieldGroups = new()
        {
            new FieldGroup
            {
                Id = 1001,
                ParentId = 101,
                Name = "Basic Info",
                Description = "Basic company info",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Basic Info Icon" }
            },
            new FieldGroup
            {
                Id = 1002,
                ParentId = 101,
                Name = "Contact Details",
                Description = "Company contact details",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Contact Details Icon" }
            }
        };

        private readonly List<Field> _fields = new()
        {
            new Field
            {
                Id = 10001,
                ParentId = 1001,
                Name = "Input",
                Description = "Text area",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Input Field Icon" },
                DataType = "SELECTED INPUT",
                DataSubType = "SELECTED INPUT",
                Properties = new Field.FieldProperty { ReadOnly = false, Reserved = false },
                Features = new Field.FieldFeature { Compulsory = false, Label = false, FullTextIndexed = false }
            }
        };

        [HttpGet("list")]
        public IActionResult GetTableManagerListItems([FromQuery] ItemTypeTable itemType, [FromQuery] int? itemId)
        {
            return itemType switch
            {
                ItemTypeTable.Area => Ok(_areas.OrderBy(a => a.SortIndex).ToList()),
                ItemTypeTable.Table when itemId.HasValue => Ok(_tables.Where(t => t.ParentId == itemId.Value).OrderBy(t => t.SortIndex).ToList()),
                ItemTypeTable.FieldGroup when itemId.HasValue => Ok(_fieldGroups.Where(fg => fg.ParentId == itemId.Value).OrderBy(fg => fg.SortIndex).ToList()),
                ItemTypeTable.Field when itemId.HasValue => Ok(_fields.Where(f => f.ParentId == itemId.Value).OrderBy(f => f.SortIndex).ToList()),
                _ => BadRequest("Invalid ItemTypeTable or missing itemId.")
            };
        }

        [HttpGet("item")]
        public IActionResult GetTableManagerItem([FromQuery] ItemTypeTable itemType, [FromQuery] int itemId)
        {
            return itemType switch
            {
                ItemTypeTable.Area => _areas.FirstOrDefault(a => a.Id == itemId) is { } area ? Ok(area) : NotFound("Area not found."),
                ItemTypeTable.Table => _tables.FirstOrDefault(t => t.Id == itemId) is { } table ? Ok(table) : NotFound("Table not found."),
                ItemTypeTable.FieldGroup => _fieldGroups.FirstOrDefault(fg => fg.Id == itemId) is { } fg ? Ok(fg) : NotFound("FieldGroup not found."),
                ItemTypeTable.Field => _fields.FirstOrDefault(f => f.Id == itemId) is { } field ? Ok(field) : NotFound("Field not found."),
                _ => BadRequest("Invalid ItemTypeTable.")
            };
        }

        private void InjectIcons()
        {
            // Assign icons from assets/main-icons to Areas
            _areas[0].Icon.Base64 = ConvertImageToBase64("home.png");
            _areas[1].Icon.Base64 = ConvertImageToBase64("add.png");
            _areas[2].Icon.Base64 = ConvertImageToBase64("delete.png");

            // Assign icons to tables
            _tables[0].Icon.Base64 = ConvertImageToBase64("settings.png");
            _tables[1].Icon.Base64 = ConvertImageToBase64("move-up.png");
            _tables[2].Icon.Base64 = ConvertImageToBase64("move-down.png");

            // Assign icons to field groups
            _fieldGroups[0].Icon.Base64 = ConvertImageToBase64("add.png");
            _fieldGroups[1].Icon.Base64 = ConvertImageToBase64("delete.png");

            // Assign icons to fields
            _fields[0].Icon.Base64 = ConvertImageToBase64("settings.png");
        }
    }
}
