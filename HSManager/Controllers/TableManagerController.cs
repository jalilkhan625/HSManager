using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using HSManager.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

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

        // New POST endpoint for setting/updating items
        [HttpPost("set")]
        public IActionResult SetTableManagerItem([FromQuery] ItemTypeTable itemType, [FromQuery] int itemId, [FromBody] dynamic item)
        {
            try
            {
                switch (itemType)
                {
                    case ItemTypeTable.Area:
                        var area = _areas.FirstOrDefault(a => a.Id == itemId);
                        if (area == null)
                        {
                            area = JsonSerializer.Deserialize<Area>(item.ToString());
                            _areas.Add(area);
                        }
                        else
                        {
                            area.Name = item.name;
                            area.Description = item.description;
                            area.Visible = item.visible;
                            area.SortIndex = item.sortIndex;
                            area.ParentId = item.parentId;
                            area.Icon = item.icon != null ? JsonSerializer.Deserialize<TableIcon>(item.icon.ToString()) : area.Icon;
                            //area.ReadOnly = item.readOnly;
                            //area.Reserved = item.reserved;
                        }
                        return Ok(new { message = $"Area with ID {itemId} updated or added successfully" });

                    case ItemTypeTable.Table:
                        var table = _tables.FirstOrDefault(t => t.Id == itemId);
                        if (table == null)
                        {
                            table = JsonSerializer.Deserialize<Table>(item.ToString());
                            _tables.Add(table);
                        }
                        else
                        {
                            table.Name = item.name;
                            table.Description = item.description;
                            table.Visible = item.visible;
                            table.SortIndex = item.sortIndex;
                            table.ParentId = item.parentId;
                            table.Icon = item.icon != null ? JsonSerializer.Deserialize<TableIcon>(item.icon.ToString()) : table.Icon;
                            table.SystemProperties = item.systemProperties != null ? JsonSerializer.Deserialize<Table.SystemProperty>(item.systemProperties.ToString()) : table.SystemProperties;
                        }
                        return Ok(new { message = $"Table with ID {itemId} updated or added successfully" });

                    case ItemTypeTable.FieldGroup:
                        var fieldGroup = _fieldGroups.FirstOrDefault(fg => fg.Id == itemId);
                        if (fieldGroup == null)
                        {
                            fieldGroup = JsonSerializer.Deserialize<FieldGroup>(item.ToString());
                            _fieldGroups.Add(fieldGroup);
                        }
                        else
                        {
                            fieldGroup.Name = item.name;
                            fieldGroup.Description = item.description;
                            fieldGroup.Visible = item.visible;
                            fieldGroup.SortIndex = item.sortIndex;
                            fieldGroup.ParentId = item.parentId;
                            fieldGroup.Icon = item.icon != null ? JsonSerializer.Deserialize<TableIcon>(item.icon.ToString()) : fieldGroup.Icon;
                            // fieldGroup.ReadOnly = item.readOnly;
                            //fieldGroup.Reserved = item.reserved;
                        }
                        return Ok(new { message = $"FieldGroup with ID {itemId} updated or added successfully" });

                    case ItemTypeTable.Field:
                        var field = _fields.FirstOrDefault(f => f.Id == itemId);
                        if (field == null)
                        {
                            field = JsonSerializer.Deserialize<Field>(item.ToString());
                            _fields.Add(field);
                        }
                        else
                        {
                            field.Name = item.name;
                            field.Description = item.description;
                            field.Visible = item.visible;
                            field.SortIndex = item.sortIndex;
                            field.ParentId = item.parentId;
                            field.Icon = item.icon != null ? JsonSerializer.Deserialize<TableIcon>(item.icon.ToString()) : field.Icon;
                            field.DataType = item.dataType;
                            field.DataSubType = item.dataSubType;
                            field.Properties = item.properties != null ? JsonSerializer.Deserialize<Field.FieldProperty>(item.properties.ToString()) : field.Properties;
                            field.Features = item.features != null ? JsonSerializer.Deserialize<Field.FieldFeature>(item.features.ToString()) : field.Features;
                        }
                        return Ok(new { message = $"Field with ID {itemId} updated or added successfully" });

                    default:
                        return BadRequest("Invalid ItemTypeTable.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating {itemType} with ID {itemId}: {ex.Message}" });
            }
        }

        private void InjectIcons()
        {
            _areas[0].Icon.Base64 = ConvertImageToBase64("home.png");
            _areas[1].Icon.Base64 = ConvertImageToBase64("add.png");
            _areas[2].Icon.Base64 = ConvertImageToBase64("delete.png");

            _tables[0].Icon.Base64 = ConvertImageToBase64("settings.png");
            _tables[1].Icon.Base64 = ConvertImageToBase64("move-up.png");
            _tables[2].Icon.Base64 = ConvertImageToBase64("move-down.png");

            _fieldGroups[0].Icon.Base64 = ConvertImageToBase64("add.png");
            _fieldGroups[1].Icon.Base64 = ConvertImageToBase64("delete.png");

            _fields[0].Icon.Base64 = ConvertImageToBase64("settings.png");
        }
    }
}