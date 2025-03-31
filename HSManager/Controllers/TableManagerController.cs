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
                Icon = new TableIcon { AlternativeText = "Company Icon" },
                ReadOnly = false,
                Reserved = false
            },
            new Area
            {
                Id = 2,
                ParentId = 0,
                Name = "Organizations",
                Description = "Contains organization-related data",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Organizations Icon" },
                ReadOnly = false,
                Reserved = false
            },
            new Area
            {
                Id = 3,
                ParentId = 0,
                Name = "Hyperspace",
                Description = "Contains Hyperspace system data",
                Visible = true,
                SortIndex = 2,
                Icon = new TableIcon { AlternativeText = "Hyperspace Icon" },
                ReadOnly = true,
                Reserved = true
            }
        };

        private readonly List<Table> _tables = new()
        {
            // Tables for Area: Company (Id: 1)
            new Table
            {
                Id = 101,
                ParentId = 1,
                Name = "Company",
                Description = "Company details",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Company Table Icon" },
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = true,
                    Timeline = false,
                    Freezing = false,
                    Versioning = false,
                    StaticData = false,
                    VirtualData = false,
                    ReadOnly = false,
                    Reserved = false
                }
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
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = false,
                    Timeline = true,
                    Freezing = false,
                    Versioning = false,
                    StaticData = false,
                    VirtualData = false,
                    ReadOnly = false,
                    Reserved = false
                }
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
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = false,
                    Timeline = false,
                    Freezing = true,
                    Versioning = true,
                    StaticData = false,
                    VirtualData = false,
                    ReadOnly = false,
                    Reserved = false
                }
            },
            // Tables for Area: Organizations (Id: 2)
            new Table
            {
                Id = 201,
                ParentId = 2,
                Name = "Organization",
                Description = "Organization details",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Organization Table Icon" },
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = false,
                    Timeline = true,
                    Freezing = false,
                    Versioning = false,
                    StaticData = false,
                    VirtualData = false,
                    ReadOnly = false,
                    Reserved = false
                }
            },
            new Table
            {
                Id = 202,
                ParentId = 2,
                Name = "Org Members",
                Description = "Organization members",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Members Table Icon" },
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = false,
                    Timeline = false,
                    Freezing = true,
                    Versioning = false,
                    StaticData = false,
                    VirtualData = false,
                    ReadOnly = false,
                    Reserved = false
                }
            },
            // Tables for Area: Hyperspace (Id: 3)
            new Table
            {
                Id = 301,
                ParentId = 3,
                Name = "System Config",
                Description = "Hyperspace system configuration",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Config Table Icon" },
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = true,
                    Timeline = false,
                    Freezing = false,
                    Versioning = true,
                    StaticData = true,
                    VirtualData = false,
                    ReadOnly = true,
                    Reserved = true
                }
            },
            new Table
            {
                Id = 302,
                ParentId = 3,
                Name = "System Logs",
                Description = "Hyperspace system logs",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Logs Table Icon" },
                SystemProperties = new Table.SystemProperty
                {
                    Clearance = true,
                    Timeline = true,
                    Freezing = false,
                    Versioning = false,
                    StaticData = false,
                    VirtualData = true,
                    ReadOnly = true,
                    Reserved = true
                }
            }
        };

        private readonly List<FieldGroup> _fieldGroups = new()
        {
            // FieldGroups for Table: Company (Id: 101)
            new FieldGroup
            {
                Id = 1001,
                ParentId = 101,
                Name = "Basic Info",
                Description = "Basic company info",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Basic Info Icon" },
                ReadOnly = false,
                Reserved = false
            },
            new FieldGroup
            {
                Id = 1002,
                ParentId = 101,
                Name = "Contact Details",
                Description = "Company contact details",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Contact Details Icon" },
                ReadOnly = false,
                Reserved = false
            },
            // FieldGroups for Table: Organization (Id: 201)
            new FieldGroup
            {
                Id = 2001,
                ParentId = 201,
                Name = "Org Info",
                Description = "Basic organization info",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Org Info Icon" },
                ReadOnly = false,
                Reserved = false
            },
            new FieldGroup
            {
                Id = 2002,
                ParentId = 201,
                Name = "Org Contacts",
                Description = "Organization contact details",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Org Contacts Icon" },
                ReadOnly = false,
                Reserved = false
            },
            // FieldGroups for Table: System Config (Id: 301)
            new FieldGroup
            {
                Id = 3001,
                ParentId = 301,
                Name = "Config Settings",
                Description = "System configuration settings",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Config Settings Icon" },
                ReadOnly = true,
                Reserved = true
            }
        };

        private readonly List<Field> _fields = new()
        {
            // Fields for FieldGroup: Basic Info (Id: 1001)
            new Field
            {
                Id = 10001,
                ParentId = 1001,
                Name = "CompanyName",
                Description = "Company name",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Input Field Icon" },
                DataType = "string",
                DataSubType = "text",
                Properties = new Field.FieldProperty { ReadOnly = false, Reserved = false },
                Features = new Field.FieldFeature { Compulsory = true, Label = true, FullTextIndexed = true }
            },
            new Field
            {
                Id = 10002,
                ParentId = 1001,
                Name = "EmployeeCount",
                Description = "Number of employees",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Number Field Icon" },
                DataType = "int",
                DataSubType = "integer",
                Properties = new Field.FieldProperty { ReadOnly = false, Reserved = false },
                Features = new Field.FieldFeature { Compulsory = false, Label = true, FullTextIndexed = false }
            },
            // Fields for FieldGroup: Org Info (Id: 2001)
            new Field
            {
                Id = 20001,
                ParentId = 2001,
                Name = "OrgName",
                Description = "Organization name",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Input Field Icon" },
                DataType = "string",
                DataSubType = "text",
                Properties = new Field.FieldProperty { ReadOnly = false, Reserved = false },
                Features = new Field.FieldFeature { Compulsory = true, Label = true, FullTextIndexed = true }
            },
            new Field
            {
                Id = 20002,
                ParentId = 2001,
                Name = "MemberCount",
                Description = "Number of members",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Number Field Icon" },
                DataType = "int",
                DataSubType = "integer",
                Properties = new Field.FieldProperty { ReadOnly = false, Reserved = false },
                Features = new Field.FieldFeature { Compulsory = false, Label = true, FullTextIndexed = false }
            },
            // Fields for FieldGroup: Config Settings (Id: 3001)
            new Field
            {
                Id = 30001,
                ParentId = 3001,
                Name = "ApiKey",
                Description = "API key for system access",
                Visible = true,
                SortIndex = 0,
                Icon = new TableIcon { AlternativeText = "Input Field Icon" },
                DataType = "string",
                DataSubType = "text",
                Properties = new Field.FieldProperty { ReadOnly = true, Reserved = true },
                Features = new Field.FieldFeature { Compulsory = true, Label = true, FullTextIndexed = false }
            },
            new Field
            {
                Id = 30002,
                ParentId = 3001,
                Name = "MaxUsers",
                Description = "Maximum allowed users",
                Visible = true,
                SortIndex = 1,
                Icon = new TableIcon { AlternativeText = "Number Field Icon" },
                DataType = "int",
                DataSubType = "integer",
                Properties = new Field.FieldProperty { ReadOnly = true, Reserved = true },
                Features = new Field.FieldFeature { Compulsory = true, Label = true, FullTextIndexed = false }
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

        [HttpPost("set")]
        public IActionResult SetTableManagerItem([FromQuery] ItemTypeTable itemType, [FromQuery] int itemId, [FromBody] JsonElement item)
        {
            try
            {
                switch (itemType)
                {
                    case ItemTypeTable.Area:
                        var area = _areas.FirstOrDefault(a => a.Id == itemId);
                        if (area == null)
                        {
                            area = new Area { Id = itemId };
                            _areas.Add(area);
                        }
                        UpdateArea(area, item);
                        return Ok(new { message = $"Area with ID {itemId} updated or added successfully" });

                    case ItemTypeTable.Table:
                        var table = _tables.FirstOrDefault(t => t.Id == itemId);
                        if (table == null)
                        {
                            table = new Table { Id = itemId };
                            _tables.Add(table);
                        }
                        UpdateTable(table, item);
                        return Ok(new { message = $"Table with ID {itemId} updated or added successfully" });

                    case ItemTypeTable.FieldGroup:
                        var fieldGroup = _fieldGroups.FirstOrDefault(fg => fg.Id == itemId);
                        if (fieldGroup == null)
                        {
                            fieldGroup = new FieldGroup { Id = itemId };
                            _fieldGroups.Add(fieldGroup);
                        }
                        UpdateFieldGroup(fieldGroup, item);
                        return Ok(new { message = $"FieldGroup with ID {itemId} updated or added successfully" });

                    case ItemTypeTable.Field:
                        var field = _fields.FirstOrDefault(f => f.Id == itemId);
                        if (field == null)
                        {
                            field = new Field { Id = itemId };
                            _fields.Add(field);
                        }
                        UpdateField(field, item);
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

        private void UpdateArea(Area area, JsonElement item)
        {
            if (item.TryGetProperty("name", out var name)) area.Name = name.GetString();
            if (item.TryGetProperty("description", out var desc)) area.Description = desc.GetString();
            if (item.TryGetProperty("visible", out var visible)) area.Visible = visible.GetBoolean();
            if (item.TryGetProperty("sortIndex", out var sort)) area.SortIndex = sort.GetInt32();
            if (item.TryGetProperty("parentId", out var parentId)) area.ParentId = parentId.GetInt32();
            if (item.TryGetProperty("icon", out var icon) && icon.ValueKind != JsonValueKind.Null)
                area.Icon = JsonSerializer.Deserialize<TableIcon>(icon.GetRawText());
            if (item.TryGetProperty("readOnly", out var readOnly)) area.ReadOnly = readOnly.GetBoolean();
            if (item.TryGetProperty("reserved", out var reserved)) area.Reserved = reserved.GetBoolean();
        }

        private void UpdateTable(Table table, JsonElement item)
        {
            if (item.TryGetProperty("name", out var name)) table.Name = name.GetString();
            if (item.TryGetProperty("description", out var desc)) table.Description = desc.GetString();
            if (item.TryGetProperty("visible", out var visible)) table.Visible = visible.GetBoolean();
            if (item.TryGetProperty("sortIndex", out var sort)) table.SortIndex = sort.GetInt32();
            if (item.TryGetProperty("parentId", out var parentId)) table.ParentId = parentId.GetInt32();
            if (item.TryGetProperty("icon", out var icon) && icon.ValueKind != JsonValueKind.Null)
                table.Icon = JsonSerializer.Deserialize<TableIcon>(icon.GetRawText());
            if (item.TryGetProperty("systemProperties", out var sysProps) && sysProps.ValueKind != JsonValueKind.Null)
                table.SystemProperties = JsonSerializer.Deserialize<Table.SystemProperty>(sysProps.GetRawText());
        }

        private void UpdateFieldGroup(FieldGroup fieldGroup, JsonElement item)
        {
            if (item.TryGetProperty("name", out var name)) fieldGroup.Name = name.GetString();
            if (item.TryGetProperty("description", out var desc)) fieldGroup.Description = desc.GetString();
            if (item.TryGetProperty("visible", out var visible)) fieldGroup.Visible = visible.GetBoolean();
            if (item.TryGetProperty("sortIndex", out var sort)) fieldGroup.SortIndex = sort.GetInt32();
            if (item.TryGetProperty("parentId", out var parentId)) fieldGroup.ParentId = parentId.GetInt32();
            if (item.TryGetProperty("icon", out var icon) && icon.ValueKind != JsonValueKind.Null)
                fieldGroup.Icon = JsonSerializer.Deserialize<TableIcon>(icon.GetRawText());
            if (item.TryGetProperty("readOnly", out var readOnly)) fieldGroup.ReadOnly = readOnly.GetBoolean();
            if (item.TryGetProperty("reserved", out var reserved)) fieldGroup.Reserved = reserved.GetBoolean();
        }

        private void UpdateField(Field field, JsonElement item)
        {
            if (item.TryGetProperty("name", out var name)) field.Name = name.GetString();
            if (item.TryGetProperty("description", out var desc)) field.Description = desc.GetString();
            if (item.TryGetProperty("visible", out var visible)) field.Visible = visible.GetBoolean();
            if (item.TryGetProperty("sortIndex", out var sort)) field.SortIndex = sort.GetInt32();
            if (item.TryGetProperty("parentId", out var parentId)) field.ParentId = parentId.GetInt32();
            if (item.TryGetProperty("icon", out var icon) && icon.ValueKind != JsonValueKind.Null)
                field.Icon = JsonSerializer.Deserialize<TableIcon>(icon.GetRawText());
            if (item.TryGetProperty("dataType", out var dataType)) field.DataType = dataType.GetString();
            if (item.TryGetProperty("dataSubType", out var dataSubType)) field.DataSubType = dataSubType.GetString();
            if (item.TryGetProperty("properties", out var props) && props.ValueKind != JsonValueKind.Null)
                field.Properties = JsonSerializer.Deserialize<Field.FieldProperty>(props.GetRawText());
            if (item.TryGetProperty("features", out var features) && features.ValueKind != JsonValueKind.Null)
                field.Features = JsonSerializer.Deserialize<Field.FieldFeature>(features.GetRawText());
        }

        private void InjectIcons()
        {
            // Areas
            _areas[0].Icon.Base64 = ConvertImageToBase64("home.png");
            _areas[1].Icon.Base64 = ConvertImageToBase64("add.png");
            _areas[2].Icon.Base64 = ConvertImageToBase64("delete.png");

            // Tables
            _tables[0].Icon.Base64 = ConvertImageToBase64("settings.png"); // Company
            _tables[1].Icon.Base64 = ConvertImageToBase64("move-up.png");  // Company Departments
            _tables[2].Icon.Base64 = ConvertImageToBase64("move-down.png"); // Company Resources
            _tables[3].Icon.Base64 = ConvertImageToBase64("home.png");     // Organization
            _tables[4].Icon.Base64 = ConvertImageToBase64("add.png");      // Org Members
            _tables[5].Icon.Base64 = ConvertImageToBase64("settings.png"); // System Config
            _tables[6].Icon.Base64 = ConvertImageToBase64("delete.png");   // System Logs

            // FieldGroups
            _fieldGroups[0].Icon.Base64 = ConvertImageToBase64("add.png");      // Basic Info
            _fieldGroups[1].Icon.Base64 = ConvertImageToBase64("delete.png");   // Contact Details
            _fieldGroups[2].Icon.Base64 = ConvertImageToBase64("home.png");     // Org Info
            _fieldGroups[3].Icon.Base64 = ConvertImageToBase64("settings.png"); // Org Contacts
            _fieldGroups[4].Icon.Base64 = ConvertImageToBase64("move-up.png");  // Config Settings

            // Fields
            _fields[0].Icon.Base64 = ConvertImageToBase64("settings.png"); // CompanyName
            _fields[1].Icon.Base64 = ConvertImageToBase64("home.png");     // EmployeeCount
            _fields[2].Icon.Base64 = ConvertImageToBase64("add.png");      // OrgName
            _fields[3].Icon.Base64 = ConvertImageToBase64("move-down.png"); // MemberCount
            _fields[4].Icon.Base64 = ConvertImageToBase64("delete.png");   // ApiKey
            _fields[5].Icon.Base64 = ConvertImageToBase64("move-up.png");  // MaxUsers
        }
    }
}