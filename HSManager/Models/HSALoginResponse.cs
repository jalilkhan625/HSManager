namespace HSManager.Models
{
    public enum Languages
    {
        English = 0,
        Italian = 1
    }

    public class HSALoginResponse
    {
        public int UserID { get; set; }
        public string UserToken { get; set; }
        public int UserLanguage { get; set; }
    }
}
