namespace HSManager.Models
{
    public enum ItemTypeTable
    {
        None = -1,
        Area = 1,
        Table = 2,
        FieldGroup = 3,
        Field = 4
    }

    public class TableIcon
    {
        public string Base64 { get; set; }
        public string AlternativeText { get; set; }
    }

    public class Area
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool Visible { get; set; }
        public int SortIndex { get; set; }
        public TableIcon Icon { get; set; }
        public bool ReadOnly { get; set; } // Added
        public bool Reserved { get; set; } // Added
    }

    public class Table
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool Visible { get; set; }
        public int SortIndex { get; set; }
        public TableIcon Icon { get; set; }
        public SystemProperty SystemProperties { get; set; }

        public class SystemProperty
        {
            public bool Clearance { get; set; }
            public bool Timeline { get; set; }
            public bool Freezing { get; set; }
            public bool Versioning { get; set; }
            public bool StaticData { get; set; }
            public bool VirtualData { get; set; }
            public bool ReadOnly { get; set; } // Added
            public bool Reserved { get; set; } // Added
        }
    }

    public class FieldGroup
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool Visible { get; set; }
        public int SortIndex { get; set; }
        public TableIcon Icon { get; set; }
        public bool ReadOnly { get; set; } // Added
        public bool Reserved { get; set; } // Added
    }

    public class Field
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool Visible { get; set; }
        public int SortIndex { get; set; }
        public TableIcon Icon { get; set; }
        public string DataType { get; set; }
        public string DataSubType { get; set; }
        public FieldProperty Properties { get; set; }
        public FieldFeature Features { get; set; }

        public class FieldProperty
        {
            public bool ReadOnly { get; set; }
            public bool Reserved { get; set; }
        }

        public class FieldFeature
        {
            public bool Compulsory { get; set; }
            public bool Label { get; set; }
            public bool FullTextIndexed { get; set; }
        }
    }
    namespace HSManager.Models
    {
        public class SessionData
        {
            public Dictionary<string, Area> Areas { get; set; }
            public Dictionary<string, Table> Tables { get; set; }
            public Dictionary<string, FieldGroup> FieldGroups { get; set; }
            public Dictionary<string, Field> Fields { get; set; }
            public string UserId { get; set; }
            public string Timestamp { get; set; }
            public string token { get; set; }
        }
    }
}