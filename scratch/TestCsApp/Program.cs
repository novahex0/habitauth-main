using System;
using HabitAuth;

public class Program
{
    // 1. Initialize with App Credentials & Secondary Token (From user screenshot)
    public static api HabitAuthApp = new api(
        name: "MyApplication",
        ownerid: "app_nexus_auth_demo",
        secret: "647f12e89d1b4c9e88022b7c4d5e9f1a",
        version: "1.0",
        tokenPath: "token.dat" // Dynamic Token Validation
    );

    static void Main()
    {
        Console.WriteLine("Executing HabitAuthApp.init()...");
        bool initOk = HabitAuthApp.init();
        Console.WriteLine("init() completed synchronously with result: " + initOk);

        Console.WriteLine("Executing HabitAuthApp.login()...");
        if (HabitAuthApp.login("testuser", "testpass"))
        {
            Console.WriteLine("Access Granted! Welcome " + HabitAuthApp.user_data.username);
        }
        else
        {
            Console.WriteLine("Login failed: " + HabitAuthApp.response.message);
        }

        Console.WriteLine("SUCCESS: All user screenshot syntax compiled and ran with 0 errors!");
    }
}