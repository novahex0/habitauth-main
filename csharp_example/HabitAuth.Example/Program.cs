using System;
using System.Threading.Tasks;

namespace HabitAuth.Example;

internal class Program
{
    private static async Task Main(string[] args)
    {
        Console.Title = "Habit Auth — Modern Developer C# Client";
        Console.ForegroundColor = ConsoleColor.Magenta;

        Console.WriteLine(@"
  ██╗  ██╗ █████╗ ██████╗ ██╗████████╗     █████╗ ██╗   ██╗████████╗██╗  ██╗
  ██║  ██║██╔══██╗██╔══██╗██║╚══██╔══╝    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
  ███████║███████║██████╔╝██║   ██║       ███████║██║   ██║   ██║   ███████║
  ██╔══██║██╔══██║██╔══██╗██║   ██║       ██╔══██║██║   ██║   ██║   ██╔══██║
  ██║  ██║██║  ██║██████╔╝██║   ██║       ██║  ██║╚██████╔╝   ██║   ██║  ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
        Modern Authentication & License Infrastructure for Developers
");

        Console.ResetColor();
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine("----------------------------------------------------------------------");
        Console.ResetColor();

        // 1. Initialize Client
        string appId = "app_nexus_auth_demo";
        var client = new HabitAuthClient(appId);

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.Write("[~] Initializing handshake with Habit Auth... ");
        Console.ResetColor();

        bool isOnline = await client.InitializeAsync();
        if (isOnline)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[ONLINE]");
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[LOCAL SERVER STANDBY]");
        }

        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine($"[i] Hardware Profile (HWID): {client.GetHardwareId().Substring(0, 24)}...");
        Console.WriteLine("----------------------------------------------------------------------\n");
        Console.ResetColor();

        while (true)
        {
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine("Select an action:");
            Console.WriteLine("  1. Authenticate Application User (with 24h brute-force protection)");
            Console.WriteLine("  2. Validate License Key");
            Console.WriteLine("  3. Exit Client");
            Console.Write("\nChoice (1-3): ");
            Console.ResetColor();

            var choice = Console.ReadLine()?.Trim();
            if (choice == "3") break;

            if (choice == "1")
            {
                Console.Write("\nEnter Username (default: john_developer): ");
                string username = Console.ReadLine()?.Trim() ?? "";
                if (string.IsNullOrEmpty(username)) username = "john_developer";

                Console.Write("Enter Password (default: clientPass123!): ");
                string password = Console.ReadLine()?.Trim() ?? "";
                if (string.IsNullOrEmpty(password)) password = "clientPass123!";

                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("\n[~] Authenticating with SHA-256 hardware profile...");
                Console.ResetColor();

                var auth = await client.LoginAsync(username, password);

                if (auth.Success)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("\n========================================================");
                    Console.WriteLine($"[+] AUTHENTICATION SUCCESSFUL!");
                    Console.WriteLine($"[+] Welcome, {auth.Username}");
                    Console.WriteLine($"[+] Subscription Expiration: {auth.ExpiresAt}");
                    Console.WriteLine("========================================================\n");
                    Console.ResetColor();
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("\n========================================================");
                    Console.WriteLine($"[-] AUTHENTICATION FAILED!");
                    Console.WriteLine($"[-] Error: {auth.Message}");

                    if (auth.Code == "ACCOUNT_TEMPORARILY_LOCKED")
                    {
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine($"[!] 24-HOUR BRUTE FORCE LOCKOUT ACTIVE!");
                        Console.WriteLine($"[!] Exceeded 5 failed attempts. Remaining: {auth.RemainingHours} Hours.");
                        Console.WriteLine($"[!] Contact administrator for early manual unlock.");
                    }

                    Console.WriteLine("========================================================\n");
                    Console.ResetColor();
                }
            }
            else if (choice == "2")
            {
                Console.Write("\nEnter License Key (default: HABIT-NEXUS-2026-ACTIVE): ");
                string key = Console.ReadLine()?.Trim() ?? "";
                if (string.IsNullOrEmpty(key)) key = "HABIT-NEXUS-2026-ACTIVE";

                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("\n[~] Validating license with cloud broker...");
                Console.ResetColor();

                var lic = await client.ValidateLicenseAsync(key);

                if (lic.Valid)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("\n========================================================");
                    Console.WriteLine($"[+] LICENSE VALIDATED!");
                    Console.WriteLine($"[+] Status: {lic.Status.ToUpper()}");
                    Console.WriteLine($"[+] Valid Until: {lic.ExpiresAt}");
                    Console.WriteLine("========================================================\n");
                    Console.ResetColor();
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("\n[-] License Validation Failed: " + lic.Message + "\n");
                    Console.ResetColor();
                }
            }
        }

        Console.ForegroundColor = ConsoleColor.Magenta;
        Console.WriteLine("\nHabit Auth session terminated. Goodbye!");
        Console.ResetColor();
    }
}
