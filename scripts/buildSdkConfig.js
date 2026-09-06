const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'frontend', 'src', 'sdk');
const csharpCode = fs.readFileSync(path.join(baseDir, 'HabitAuth.cs'), 'utf8');
const cppCode = fs.readFileSync(path.join(baseDir, 'HabitAuth.hpp'), 'utf8');
const jsCode = fs.readFileSync(path.join(baseDir, 'HabitAuth.js'), 'utf8');
const pythonCode = fs.readFileSync(path.join(baseDir, 'habit_auth.py'), 'utf8');
const goCode = fs.readFileSync(path.join(baseDir, 'HabitAuth.go'), 'utf8');
const rustCode = fs.readFileSync(path.join(baseDir, 'HabitAuth.rs'), 'utf8');

const sdkRegistry = [
  {
    id: 'csharp',
    name: 'C# (.NET)',
    filename: 'HabitAuth.cs',
    language: 'csharp',
    version: '2.4.0',
    badge: '.NET Framework 4.5 - 4.8 / .NET Core / .NET 6 - 10',
    description: 'Zero-dependency client for Windows Forms, WPF, Console & Unity. 100% compatible with .NET Framework 4.5-4.8 and modern .NET with Ed25519 & HMAC-SHA256.',
    sourceCode: csharpCode,
    usageExample: `// Form1.cs - Windows Forms (.NET Framework 4.5 - 4.8 / .NET 6 - 10)
using System;
using System.Windows.Forms;
using HabitAuth;

namespace HabitAuthWinForms
{
    public partial class Form1 : Form
    {
        // 1. Initialize HabitAuth with credentials from your dashboard
        // Supports .NET Framework 4.5, 4.6, 4.7, 4.8 and modern .NET without external NuGet packages!
        public static api HabitAuthApp = new api(
            name: "TARGET_APP_NAME",
            ownerid: "TARGET_APP_ID",
            secret: "TARGET_APP_SECRET",
            version: "1.0.0",
            publicKey: "TARGET_PUBLIC_KEY" // Optional Ed25519 public key
        );

        public Form1()
        {
            InitializeComponent();
        }

        // 2. Cryptographic session handshake on Form Load
        private void Form1_Load(object sender, EventArgs e)
        {
            HabitAuthApp.init();

            if (!HabitAuthApp.response.success)
            {
                MessageBox.Show("Initialization Failed: " + HabitAuthApp.response.message, "HabitAuth", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.Exit(0);
            }
        }

        // 3. Login Button Click - Authenticate with Username & Password TextBoxes
        private void btnLogin_Click(object sender, EventArgs e)
        {
            if (HabitAuthApp.login(txtUsername.Text, txtPassword.Text))
            {
                MessageBox.Show("Login Successful!\\nWelcome: " + HabitAuthApp.user_data.username + "\\nExpires: " + HabitAuthApp.user_data.expires_at, "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // Start automatic background heartbeat telemetry (monitors bans & remote kills)
                HabitAuthApp.start_heartbeat(30);

                // Open your Main Dashboard Form:
                // MainDashboard main = new MainDashboard(); // (Replace MainDashboard with your Form name)
                // main.Show();
                // this.Hide();
            }
            else
            {
                MessageBox.Show("Login Failed: " + HabitAuthApp.response.message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // 4. Register Button Click - Create Account with Username, Password & License TextBoxes
        private void btnRegister_Click(object sender, EventArgs e)
        {
            if (HabitAuthApp.register(txtUsername.Text, txtPassword.Text, txtLicense.Text))
            {
                MessageBox.Show("Registration Successful! You can now log in.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show("Registration Failed: " + HabitAuthApp.response.message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // 5. License Only Button Click - 1-Key Authentication with License TextBox
        private void btnLicenseOnly_Click(object sender, EventArgs e)
        {
            if (HabitAuthApp.license(txtLicense.Text))
            {
                MessageBox.Show("License Validated!\\nExpires: " + HabitAuthApp.user_data.expires_at, "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                HabitAuthApp.start_heartbeat(30);

                // Open your Main Dashboard Form:
                // MainDashboard main = new MainDashboard(); // (Replace MainDashboard with your Form name)
                // main.Show();
                // this.Hide();
            }
            else
            {
                MessageBox.Show("License Invalid: " + HabitAuthApp.response.message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}`,
    docs: [
      {
        title: 'Zero External Dependencies & .NET Framework 4.8 Compatibility',
        content: 'HabitAuth.cs has zero external NuGet dependencies and does not require System.Text.Json. It runs out of the box on .NET Framework 4.5 through 4.8, as well as .NET Core 3.1, .NET 6, 7, 8, 9, and 10.'
      },
      {
        title: 'Dual-Layer Cryptographic Response Verification (Ed25519 + HMAC-SHA256)',
        content: 'Responses are verified using asymmetric Ed25519 digital signatures and HMAC-SHA256 message authentication codes. Proxy manipulation tools (Fiddler, Charles Proxy, HTTP Toolkit) fail validation instantly.'
      },
      {
        title: 'Anti-Replay Attack Protection',
        content: 'Server timestamps are validated with strict 30-second expiry windows. Attackers cannot capture previously valid success packets to replay them later.'
      },
      {
        title: 'Hardware Binding & Self-Service Resets',
        content: 'Machine fingerprint is computed via SHA-256 over CPU, BIOS, and OS GUIDs. If a user gets a new PC, call HabitAuthApp.reset_hwid(username) to invoke the self-service reset engine.'
      },
      {
        title: 'Continuous Heartbeat Telemetry',
        content: 'Call HabitAuthApp.start_heartbeat(30) to establish active online presence. If an administrator terminates the session or bans the user from the dashboard, the application exits remotely within seconds.'
      },
      {
        title: 'Client-Side Anti-Debugging',
        content: 'HabitAuth includes proactive debugger detection. We strongly recommend compiling your binary with VMProtect, ConfuserEx, or Themida for binary-level anti-tampering.'
      }
    ]
  },
  {
    id: 'cpp',
    name: 'C++ (Native)',
    filename: 'HabitAuth.hpp',
    language: 'cpp',
    version: '2.4.0',
    badge: 'C++17 / WinINet',
    description: 'Lightweight header-only C++ client for native Windows software, game security loaders, and anti-cheat modules with zero external dependencies.',
    sourceCode: cppCode,
    usageExample: `// main.cpp - Native C++ Loader UI & Authentication Example
#include <iostream>
#include <string>
#include "HabitAuth.hpp"

// Initialize HabitAuth C++ Client with dashboard credentials
HabitAuth::Client HabitAuthApp("TARGET_APP_NAME", "TARGET_APP_ID", "TARGET_APP_SECRET", "TARGET_PUBLIC_KEY", "1.0.0");

// Textbox Input Buffers (wire directly to ImGui::InputText or Win32 Edit Controls)
char txtUsername[64] = "";
char txtPassword[64] = "";
char txtLicense[64]  = "";

// Button Click Event Handlers:
void btnLogin_Click() {
    if (HabitAuthApp.Login(txtUsername, txtPassword)) {
        std::cout << "[+] Login Success! Welcome " << HabitAuthApp.user.username << "\\n";
        std::cout << "[+] Subscription Expires: " << HabitAuthApp.user.expires_at << "\\n";
        HabitAuthApp.StartHeartbeat(30);
    } else {
        std::cout << "[-] Login Failed: " << HabitAuthApp.last_response.message << "\\n";
    }
}

void btnRegister_Click() {
    if (HabitAuthApp.Register(txtUsername, txtPassword, txtLicense)) {
        std::cout << "[+] Registration Success! You can now log in.\\n";
    } else {
        std::cout << "[-] Registration Failed: " << HabitAuthApp.last_response.message << "\\n";
    }
}

void btnLicenseOnly_Click() {
    if (HabitAuthApp.License(txtLicense)) {
        std::cout << "[+] License Activated! Subscription: " << HabitAuthApp.user.expires_at << "\\n";
        HabitAuthApp.StartHeartbeat(30);
    } else {
        std::cout << "[-] License Invalid: " << HabitAuthApp.last_response.message << "\\n";
    }
}

int main() {
    // 1. Handshake & Anti-Tamper Check on Startup
    if (!HabitAuthApp.Init()) {
        std::cout << "[!] Init Error: " << HabitAuthApp.last_response.message << "\\n";
        return 1;
    }

    // 2. Example UI Input Prompt (or connect to ImGui / Windows dialog controls)
    std::cout << "Enter Username (txtUsername): "; std::cin.getline(txtUsername, sizeof(txtUsername));
    std::cout << "Enter Password (txtPassword): "; std::cin.getline(txtPassword, sizeof(txtPassword));
    std::cout << "Enter License  (txtLicense) : "; std::cin.getline(txtLicense, sizeof(txtLicense));

    std::cout << "\\n[1] btnLogin\\n[2] btnRegister\\n[3] btnLicenseOnly\\nSelect Button Action: ";
    int choice = 0;
    std::cin >> choice;

    if (choice == 1) btnLogin_Click();
    else if (choice == 2) btnRegister_Click();
    else if (choice == 3) btnLicenseOnly_Click();

    return 0;
}`,
    docs: [
      {
        title: 'Header-Only Integration',
        content: 'Simply include "HabitAuth.hpp" in your C++17 project. WinINet and AdvAPI32 are automatically linked via pragmas on MSVC compilers.'
      },
      {
        title: 'Proactive Debugger Checks',
        content: 'HabitAuth calls IsDebuggerPresent and CheckRemoteDebuggerPresent at startup to neutralize reverse engineering tools (x64dbg, Cheat Engine, IDA).'
      },
      {
        title: '1-Key License Authentication',
        content: 'Call HabitAuthApp.License("HABIT-XXXX-XXXX-XXXX") for software that uses direct license keys without separate user registration.'
      },
      {
        title: 'Hardware Profile Binding',
        content: 'Hardware fingerprint is generated using Windows hardware profile GUIDs and SMBIOS attributes, locked to your application salt.'
      },
      {
        title: 'Self-Service HWID Reset',
        content: 'Call HabitAuthApp.ResetHWID("username") to let users reset their bound hardware profile after upgrading hardware, adhering to cooldown policies.'
      }
    ]
  },
  {
    id: 'python',
    name: 'Python (Cross-Platform)',
    filename: 'habit_auth.py',
    language: 'python',
    version: '2.4.0',
    badge: 'Python 3.8+ / Requests',
    description: 'Hardware-locked Python client with auto-updater helper, SHA-256 integrity checks, self-service HWID reset, and background heartbeat telemetry.',
    sourceCode: pythonCode,
    usageExample: `# app_gui.py - Python Tkinter UI Form with HabitAuth
import tkinter as tk
from tkinter import messagebox
from habit_auth import HabitAuth

# 1. Initialize with dashboard credentials (with Ed25519 public key verification)
auth = HabitAuth("TARGET_APP_NAME", "TARGET_APP_ID", app_secret="TARGET_APP_SECRET", public_key="TARGET_PUBLIC_KEY", version="1.0.0")

# 2. Connect & Handshake on Startup
ok, msg = auth.init()
if not ok:
    print(f"[!] Init error: {msg}")
    exit(1)

# 3. Create GUI Window
root = tk.Tk()
root.title("HabitAuth Client")
root.geometry("360x320")

# TextBoxes for User Input
tk.Label(root, text="Username (txtUsername):").pack(pady=(10, 0))
txt_username = tk.Entry(root, width=32)
txt_username.pack()

tk.Label(root, text="Password (txtPassword):").pack(pady=(5, 0))
txt_password = tk.Entry(root, width=32, show="*")
txt_password.pack()

tk.Label(root, text="License Key (txtLicense):").pack(pady=(5, 0))
txt_license = tk.Entry(root, width=32)
txt_license.pack()

# Button Click Handlers
def btn_login_click():
    ok, msg = auth.login(txt_username.get(), txt_password.get())
    if ok:
        messagebox.showinfo("Success", f"Welcome {auth.user['username']}!\\nExpires: {auth.user.get('expires_at')}")
        auth.start_heartbeat(30)
    else:
        messagebox.showerror("Error", f"Login Failed: {msg}")

def btn_register_click():
    ok, msg = auth.register(txt_username.get(), txt_password.get(), txt_license.get())
    if ok:
        messagebox.showinfo("Success", "Registered successfully! You can now log in.")
    else:
        messagebox.showerror("Error", f"Registration Failed: {msg}")

def btn_license_only_click():
    ok, msg = auth.license(txt_license.get())
    if ok:
        messagebox.showinfo("Success", f"License Validated!\\nExpires: {auth.user.get('expires_at')}")
        auth.start_heartbeat(30)
    else:
        messagebox.showerror("Error", f"Invalid License: {msg}")

# UI Action Buttons
tk.Button(root, text="Login (btnLogin)", command=btn_login_click, width=28, bg="#9333ea", fg="white").pack(pady=8)
tk.Button(root, text="Register (btnRegister)", command=btn_register_click, width=28).pack(pady=4)
tk.Button(root, text="License Only (btnLicense)", command=btn_license_only_click, width=28).pack(pady=4)

root.mainloop()`,
    docs: [
      {
        title: 'Auto-Updater Helper',
        content: 'When an update is detected, auth.perform_auto_update() downloads the binary stream into a temporary executable, issues an asynchronous move command, and launches the updated program.'
      },
      {
        title: 'Binary Hash Check',
        content: 'auth.get_binary_hash() calculates the SHA-256 of the running script or PyInstaller frozen executable. If someone modifies the bytecode, HabitAuth blocks access and auto-bans the user.'
      },
      {
        title: 'Heartbeat & Kill Switch',
        content: 'Background daemon thread pings /api/v1/client/heartbeat every 30 seconds to appear on Live Radar and detect administrator kill switches.'
      },
      {
        title: 'Self-Service HWID Reset',
        content: 'Call auth.reset_hwid("user123") to initiate an automated machine reset adhering to configured cooldown rules.'
      }
    ]
  },
  {
    id: 'javascript',
    name: 'JavaScript / Node',
    filename: 'HabitAuth.js',
    language: 'javascript',
    version: '2.4.0',
    badge: 'Node.js / Electron / Web',
    description: 'Universal JavaScript client for Node.js backends, Electron desktop apps, React Native, and browser applications.',
    sourceCode: jsCode,
    usageExample: `// app.js - Electron / Web UI Integration Example
const HabitAuth = require('./HabitAuth.js');

const auth = new HabitAuth({
  appName: 'TARGET_APP_NAME',
  appId: 'TARGET_APP_ID',
  appSecret: 'TARGET_APP_SECRET',
  publicKey: 'TARGET_PUBLIC_KEY',
  version: '1.0.0'
});

// 1. Handshake on startup
window.addEventListener('DOMContentLoaded', async () => {
  const initialized = await auth.init();
  if (!initialized) {
    alert('Init failed: ' + auth.lastResponse.message);
    return;
  }

  // DOM Input TextBoxes
  const txtUsername = document.getElementById('txtUsername');
  const txtPassword = document.getElementById('txtPassword');
  const txtLicense  = document.getElementById('txtLicense');

  // btnLogin Click Handler
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const success = await auth.login(txtUsername.value, txtPassword.value);
    if (success) {
      alert('Login Success! Welcome ' + auth.user.username + '\\nExpires: ' + auth.user.expires_at);
      auth.startHeartbeat(30);
    } else {
      alert('Login failed: ' + auth.lastResponse.message);
    }
  });

  // btnRegister Click Handler
  document.getElementById('btnRegister').addEventListener('click', async () => {
    const success = await auth.register(txtUsername.value, txtPassword.value, txtLicense.value);
    if (success) {
      alert('Registered successfully! You can now log in.');
    } else {
      alert('Registration failed: ' + auth.lastResponse.message);
    }
  });

  // btnLicenseOnly Click Handler
  document.getElementById('btnLicenseOnly').addEventListener('click', async () => {
    const success = await auth.license(txtLicense.value);
    if (success) {
      alert('License validated! Subscription expires: ' + auth.user.expires_at);
      auth.startHeartbeat(30);
    } else {
      alert('License failed: ' + auth.lastResponse.message);
    }
  });
});`,
    docs: [
      {
        title: 'Environment Detection',
        content: 'HabitAuth.js automatically checks whether it is running inside Node.js, Electron, or a web browser, and selects the appropriate cryptography provider (Node crypto vs window.crypto.subtle).'
      },
      {
        title: 'Registration & Activation',
        content: 'Call await auth.register(username, password, licenseKey) to atomically create user accounts and bind the license in a single transaction.'
      },
      {
        title: 'Lockout Handling',
        content: 'If an account triggers 5 consecutive failed passwords, auth.login() rejects with HTTP 423 and sets auth.lastResponse.remaining_hours to 24.'
      },
      {
        title: 'Heartbeat & Remote Kill Switch',
        content: 'Call auth.startHeartbeat() to maintain online radar presence and automatically exit on remote administrator termination.'
      },
      {
        title: 'Self-Service HWID Reset',
        content: 'Call await auth.resetHWID(username) to trigger automated machine profile reset with enforced cooldown.'
      }
    ]
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    filename: 'HabitAuth.go',
    language: 'go',
    version: '2.4.0',
    badge: 'Go 1.18+ / Native',
    description: 'High-performance, idiomatic Go client for cross-platform binaries, game bots, and microservices with cryptographic signing and telemetry.',
    sourceCode: goCode,
    usageExample: `// main.go - Go Client with Interactive Inputs & Actions
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"habitauth"
)

func main() {
	reader := bufio.NewReader(os.Stdin)

	// 1. Initialize client with dashboard credentials
	client := habitauth.NewClient("TARGET_APP_NAME", "TARGET_APP_ID", "TARGET_APP_SECRET", "TARGET_PUBLIC_KEY", "1.0.0", "https://habitauth.com/api/v1")

	// 2. Handshake with server
	ok, err := client.Init("")
	if !ok || err != nil {
		fmt.Printf("[!] Init failed: %v\\n", err)
		return
	}

	// 3. User Input Prompts (txtUsername, txtPassword, txtLicense)
	fmt.Print("Enter Username (txtUsername): ")
	txtUsername, _ := reader.ReadString('\\n')
	txtUsername = strings.TrimSpace(txtUsername)

	fmt.Print("Enter Password (txtPassword): ")
	txtPassword, _ := reader.ReadString('\\n')
	txtPassword = strings.TrimSpace(txtPassword)

	fmt.Print("Enter License Key (txtLicense): ")
	txtLicense, _ := reader.ReadString('\\n')
	txtLicense = strings.TrimSpace(txtLicense)

	fmt.Println("\\n[1] btnLogin  [2] btnRegister  [3] btnLicenseOnly")
	fmt.Print("Select Action: ")
	choice, _ := reader.ReadString('\\n')
	choice = strings.TrimSpace(choice)

	if choice == "1" {
		if loggedIn, _ := client.Login(txtUsername, txtPassword); loggedIn {
			fmt.Printf("[+] Welcome %s! Expires: %s\\n", client.User.Username, client.User.ExpiresAt)
			client.StartHeartbeat(30)
		} else {
			fmt.Printf("[-] Login failed: %v\\n", client.LastResponse.Message)
		}
	} else if choice == "2" {
		if reg, _ := client.Register(txtUsername, txtPassword, txtLicense); reg {
			fmt.Println("[+] Registration successful! You can now log in.")
		} else {
			fmt.Printf("[-] Registration failed: %v\\n", client.LastResponse.Message)
		}
	} else if choice == "3" {
		if lic, _ := client.License(txtLicense); lic {
			fmt.Printf("[+] License activated! Expires: %s\\n", client.User.ExpiresAt)
			client.StartHeartbeat(30)
		} else {
			fmt.Printf("[-] License failed: %v\\n", client.LastResponse.Message)
		}
	}
}`,
    docs: [
      {
        title: 'Zero External Dependencies',
        content: 'Uses standard library net/http, crypto/hmac, and crypto/sha256 for maximum speed and tiny binary sizes.'
      },
      {
        title: 'Goroutine Heartbeat',
        content: 'Telemetry runs on an isolated background goroutine with low CPU footprint, automatically terminating the process if killed in the dashboard.'
      },
      {
        title: 'Cryptographic Response Verification',
        content: 'Responses are verified using HMAC-SHA256 with constant-time equality checks and 30-second anti-replay windows.'
      },
      {
        title: 'Cross-Platform HWID',
        content: 'Hardware fingerprinting is generated using runtime and OS characteristics, supporting Windows, Linux, and macOS.'
      }
    ]
  },
  {
    id: 'rust',
    name: 'Rust',
    filename: 'HabitAuth.rs',
    language: 'rust',
    version: '2.4.0',
    badge: 'Rust 2021 / Memory-Safe',
    description: 'Blazing fast, memory-safe Rust client for game security loaders, native tools, and enterprise microservices.',
    sourceCode: rustCode,
    usageExample: `// main.rs - Rust Client with Interactive Inputs & Actions
use std::error::Error;
use std::io::{self, Write};

mod habit_auth;
use habit_auth::HabitAuth;

fn prompt(label: &str) -> String {
    print!("{}", label);
    io::stdout().flush().unwrap();
    let mut buffer = String::new();
    io::stdin().read_line(&mut buffer).unwrap();
    buffer.trim().to_string()
}

fn main() -> Result<(), Box<dyn Error>> {
    // 1. Initialize client with Ed25519 public key
    let mut auth = HabitAuth::new(
        "TARGET_APP_NAME",
        "TARGET_APP_ID",
        "TARGET_APP_SECRET",
        "TARGET_PUBLIC_KEY",
        "1.0.0",
        "https://habitauth.com/api/v1",
    );

    // 2. Handshake with HabitAuth server
    if !auth.init(None)? {
        eprintln!("[!] Initialization failed: {:?}", auth.last_response.message);
        return Ok(());
    }

    // 3. User Inputs (txtUsername, txtPassword, txtLicense)
    let txt_username = prompt("Enter Username (txtUsername): ");
    let txt_password = prompt("Enter Password (txtPassword): ");
    let txt_license  = prompt("Enter License (txtLicense): ");

    println!("\\n[1] btnLogin  [2] btnRegister  [3] btnLicenseOnly");
    let choice = prompt("Select Action: ");

    match choice.as_str() {
        "1" => {
            if auth.login(&txt_username, &txt_password)? {
                println!("[+] Authenticated! Welcome {:?}", auth.user.as_ref().map(|u| &u.username));
            } else {
                eprintln!("[-] Login failed: {:?}", auth.last_response.message);
            }
        }
        "2" => {
            if auth.register(&txt_username, &txt_password, &txt_license)? {
                println!("[+] Registered successfully! You can now log in.");
            } else {
                eprintln!("[-] Registration failed: {:?}", auth.last_response.message);
            }
        }
        "3" => {
            if auth.license(&txt_license)? {
                println!("[+] License valid! Access granted.");
            } else {
                eprintln!("[-] License invalid: {:?}", auth.last_response.message);
            }
        }
        _ => println!("Invalid selection."),
    }

    Ok(())
}`,
    docs: [
      {
        title: 'Memory Safety',
        content: 'Guaranteed memory safety with Rust type system, eliminating buffer overflow risks in authentication logic.'
      },
      {
        title: 'Serde Serialization',
        content: 'Clean JSON handling with serde and serde_json for strongly typed client data models.'
      },
      {
        title: 'Hardware Profile Binding',
        content: 'Fingerprint is generated from host, username, and OS architecture, bound to the registered user license.'
      },
      {
        title: 'Self-Service HWID Reset',
        content: 'Invoke auth.reset_hwid("username") for seamless hardware migration under cooldown policies.'
      }
    ]
  }
];

const fileContent = `/**
 * Central SDK Configuration & Source Registry for HabitAuth
 * Single source of truth for versioning, file names, documentation, and raw code.
 */

export const SDK_VERSION = '2.4.0';

export const SDK_REGISTRY = ${JSON.stringify(sdkRegistry, null, 2)};

/**
 * Trigger file download in browser
 */
export function downloadSdkFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
`;

fs.writeFileSync(path.join(baseDir, 'sdkConfig.js'), fileContent, 'utf8');
console.log('Successfully generated sdkConfig.js with all 6 SDK languages!');
