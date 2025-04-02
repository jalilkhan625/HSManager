using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using HSManager.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using HSManager.Models.HSManager.Models;

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

        // In-memory data stores (replace with a database in production)
        private readonly List<Area> _areas = new()
        {
            new Area { Id = 1, ParentId = 0, Name = "Company", Description = "Contains company-related data", Visible = true, SortIndex = 0, Icon = new TableIcon { AlternativeText = "Company Icon" } },
            new Area { Id = 2, ParentId = 0, Name = "Organizations", Description = "Contains organization-related data", Visible = true, SortIndex = 1, Icon = new TableIcon { AlternativeText = "Organizations Icon" } },
            new Area { Id = 3, ParentId = 0, Name = "Hyperspace", Description = "Contains Hyperspace system data", Visible = true, SortIndex = 2, Icon = new TableIcon { AlternativeText = "Hyperspace Icon" } }
        };

        private readonly List<Table> _tables = new()
        {
            new Table { Id = 101, ParentId = 1, Name = "Company", Description = "Company details", Visible = true, SortIndex = 0, Icon = new TableIcon { AlternativeText = "Company Table Icon" }, SystemProperties = new Table.SystemProperty { Clearance = true } },
            new Table { Id = 102, ParentId = 1, Name = "Company Departments", Description = "Company departments", Visible = true, SortIndex = 1, Icon = new TableIcon { AlternativeText = "Departments Table Icon" }, SystemProperties = new Table.SystemProperty() },
            new Table { Id = 103, ParentId = 1, Name = "Company Resources", Description = "Internal users", Visible = true, SortIndex = 2, Icon = new TableIcon { AlternativeText = "Resources Table Icon" }, SystemProperties = new Table.SystemProperty() }
        };

        private readonly List<FieldGroup> _fieldGroups = new()
        {
            new FieldGroup { Id = 1001, ParentId = 101, Name = "Basic Info", Description = "Basic company info", Visible = true, SortIndex = 0, Icon = new TableIcon { AlternativeText = "Basic Info Icon" } },
            new FieldGroup { Id = 1002, ParentId = 101, Name = "Contact Details", Description = "Company contact details", Visible = true, SortIndex = 1, Icon = new TableIcon { AlternativeText = "Contact Details Icon" } }
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

        // GET: /api/tablemanager/list
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

        // GET: /api/tablemanager/item
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

        // POST: /api/tablemanager/set
        [HttpPost("set")]
        public IActionResult SetTableManagerItem([FromQuery] ItemTypeTable itemType, [FromQuery] int? itemId, [FromBody] dynamic item)
        {
            try
            {
                switch (itemType)
                {
                    case ItemTypeTable.Area:
                        var area = itemId.HasValue ? _areas.FirstOrDefault(a => a.Id == itemId.Value) : null;
                        if (area == null)
                        {
                            area = JsonSerializer.Deserialize<Area>(item.ToString());
                            if (area == null || area.Id == 0)
                            {
                                area.Id = _areas.Any() ? _areas.Max(a => a.Id) + 1 : 1;
                            }
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
                            area.ReadOnly = item.readOnly ?? area.ReadOnly;
                            area.Reserved = item.reserved ?? area.Reserved;
                        }
                        return Ok(new { message = $"Area with ID {area.Id} updated or added successfully", id = area.Id });

                    case ItemTypeTable.Table:
                        var table = itemId.HasValue ? _tables.FirstOrDefault(t => t.Id == itemId.Value) : null;
                        if (table == null)
                        {
                            table = JsonSerializer.Deserialize<Table>(item.ToString());
                            if (table == null || table.Id == 0)
                            {
                                table.Id = _tables.Any() ? _tables.Max(t => t.Id) + 1 : 101;
                            }
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
                        return Ok(new { message = $"Table with ID {table.Id} updated or added successfully", id = table.Id });

                    case ItemTypeTable.FieldGroup:
                        var fieldGroup = itemId.HasValue ? _fieldGroups.FirstOrDefault(fg => fg.Id == itemId.Value) : null;
                        if (fieldGroup == null)
                        {
                            fieldGroup = JsonSerializer.Deserialize<FieldGroup>(item.ToString());
                            if (fieldGroup == null || fieldGroup.Id == 0)
                            {
                                fieldGroup.Id = _fieldGroups.Any() ? _fieldGroups.Max(fg => fg.Id) + 1 : 1001;
                            }
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
                            fieldGroup.ReadOnly = item.readOnly ?? fieldGroup.ReadOnly;
                            fieldGroup.Reserved = item.reserved ?? fieldGroup.Reserved;
                        }
                        return Ok(new { message = $"FieldGroup with ID {fieldGroup.Id} updated or added successfully", id = fieldGroup.Id });

                    case ItemTypeTable.Field:
                        var field = itemId.HasValue ? _fields.FirstOrDefault(f => f.Id == itemId.Value) : null;
                        if (field == null)
                        {
                            field = JsonSerializer.Deserialize<Field>(item.ToString());
                            if (field == null || field.Id == 0)
                            {
                                field.Id = _fields.Any() ? _fields.Max(f => f.Id) + 1 : 10001;
                            }
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
                        return Ok(new { message = $"Field with ID {field.Id} updated or added successfully", id = field.Id });

                    default:
                        return BadRequest("Invalid ItemTypeTable.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating {itemType} with ID {itemId}: {ex.Message}" });
            }
        }

        // POST: /api/tablemanager/saveSessionData
        [HttpPost("saveSessionData")]
        public IActionResult SaveSessionData([FromBody] SessionData sessionData)
        {
            try
            {
                if (sessionData == null)
                {
                    return BadRequest("No session data provided.");
                }

                // Log the received data (for debugging purposes)
                Console.WriteLine("Received session data:");
                Console.WriteLine($"UserID: {sessionData.UserId}");
                Console.WriteLine($"Timestamp: {sessionData.Timestamp}");
                Console.WriteLine($"Areas: {JsonSerializer.Serialize(sessionData.Areas)}");
                Console.WriteLine($"Tables: {JsonSerializer.Serialize(sessionData.Tables)}");
                Console.WriteLine($"FieldGroups: {JsonSerializer.Serialize(sessionData.FieldGroups)}");
                Console.WriteLine($"Fields: {JsonSerializer.Serialize(sessionData.Fields)}");

                // Process Areas
                foreach (var areaEntry in sessionData.Areas)
                {
                    var area = areaEntry.Value;
                    var existingArea = _areas.FirstOrDefault(a => a.Id == area.Id);
                    if (existingArea == null)
                    {
                        _areas.Add(area);
                        Console.WriteLine($"Added new Area with ID {area.Id}");
                    }
                    else
                    {
                        existingArea.Name = area.Name;
                        existingArea.Description = area.Description;
                        existingArea.Visible = area.Visible;
                        existingArea.SortIndex = area.SortIndex;
                        existingArea.ParentId = area.ParentId;
                        existingArea.Icon = area.Icon;
                        existingArea.ReadOnly = area.ReadOnly;
                        existingArea.Reserved = area.Reserved;
                        Console.WriteLine($"Updated existing Area with ID {area.Id}");
                    }
                }

                // Process Tables
                foreach (var tableEntry in sessionData.Tables)
                {
                    var table = tableEntry.Value;
                    var existingTable = _tables.FirstOrDefault(t => t.Id == table.Id);
                    if (existingTable == null)
                    {
                        _tables.Add(table);
                        Console.WriteLine($"Added new Table with ID {table.Id}");
                    }
                    else
                    {
                        existingTable.Name = table.Name;
                        existingTable.Description = table.Description;
                        existingTable.Visible = table.Visible;
                        existingTable.SortIndex = table.SortIndex;
                        existingTable.ParentId = table.ParentId;
                        existingTable.Icon = table.Icon;
                        existingTable.SystemProperties = table.SystemProperties;
                        Console.WriteLine($"Updated existing Table with ID {table.Id}");
                    }
                }

                // Process FieldGroups
                foreach (var fgEntry in sessionData.FieldGroups)
                {
                    var fieldGroup = fgEntry.Value;
                    var existingFieldGroup = _fieldGroups.FirstOrDefault(fg => fg.Id == fieldGroup.Id);
                    if (existingFieldGroup == null)
                    {
                        _fieldGroups.Add(fieldGroup);
                        Console.WriteLine($"Added new FieldGroup with ID {fieldGroup.Id}");
                    }
                    else
                    {
                        existingFieldGroup.Name = fieldGroup.Name;
                        existingFieldGroup.Description = fieldGroup.Description;
                        existingFieldGroup.Visible = fieldGroup.Visible;
                        existingFieldGroup.SortIndex = fieldGroup.SortIndex;
                        existingFieldGroup.ParentId = fieldGroup.ParentId;
                        existingFieldGroup.Icon = fieldGroup.Icon;
                        existingFieldGroup.ReadOnly = fieldGroup.ReadOnly;
                        existingFieldGroup.Reserved = fieldGroup.Reserved;
                        Console.WriteLine($"Updated existing FieldGroup with ID {fieldGroup.Id}");
                    }
                }

                // Process Fields
                foreach (var fieldEntry in sessionData.Fields)
                {
                    var field = fieldEntry.Value;
                    var existingField = _fields.FirstOrDefault(f => f.Id == field.Id);
                    if (existingField == null)
                    {
                        _fields.Add(field);
                        Console.WriteLine($"Added new Field with ID {field.Id}");
                    }
                    else
                    {
                        existingField.Name = field.Name;
                        existingField.Description = field.Description;
                        existingField.Visible = field.Visible;
                        existingField.SortIndex = field.SortIndex;
                        existingField.ParentId = field.ParentId;
                        existingField.Icon = field.Icon;
                        existingField.DataType = field.DataType;
                        existingField.DataSubType = field.DataSubType;
                        existingField.Properties = field.Properties;
                        existingField.Features = field.Features;
                        Console.WriteLine($"Updated existing Field with ID {field.Id}");
                    }
                }

                return Ok(new { message = "Session data received and processed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error processing session data: {ex.Message}" });
            }
        }

        // Helper method to inject icons into the initial data
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