import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Book, Code, Key, Shield, ArrowLeft, Terminal, Cpu, Lock, 
  ExternalLink, Check, Copy, Search, Smartphone, Laptop, 
  Zap, Bell, CheckCircle2, AlertTriangle, LifeBuoy, FileCode, 
  Crown, Download, Info, Layers, Activity, ChevronRight, ChevronDown, 
  Sparkles, KeyRound, Globe, Menu, X, MessageSquare, Code2, Sun, Moon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SDK_REGISTRY, downloadSdkFile } from '../sdk/sdkConfig';

const DOCS_I18N = {
  en: {
    brandBadge: "Docs v1.4",
    visitSite: "Visit Our Website",
    searchPlaceholder: "Search documentation... (Ctrl+K)",
    onThisPage: "On this page",
    overview: "Overview",
    core: "Core",
    defense: "Defense",
    sevenLangs: "7 Langs",
    v1: "v1",
    gettingStarted: "Getting Started",
    intro: "Introduction",
    quickstart: "Quickstart & Setup",
    coreSecurity: "Core Security",
    securityAntiCrack: "Security & Anti-Crack",
    userAuth: "User Auth & 24h Lockout",
    licensesHwid: "Licenses & Machine HWID",
    binaryIntegrity: "Binary Integrity & Auto-Ban",
    tokenValidation: "Token Validation Gate",
    sdksLibraries: "SDKs & Libraries",
    multiLangSdks: "Multi-Language SDKs",
    autoUpdater: "Auto-Updater Engine",
    supportTickets: "Support Tickets API",
    apiReference: "API Reference",
    completeRestApi: "Complete REST API",
    copyCode: "Copy",
    copied: "Copied!",
    quickActions: "Quick Actions",
    backToTop: "↑ Back to top",

    needHelpTitle: "Need Help Integrating?",
    needHelpDesc: "Join our developer Discord community for live assistance and SDK support.",
    joinDiscord: "Join Discord Server",

    introBadge: "Getting Started",
    introTitle: "Authentication made for developers!",
    introSubtitle: "Secure, scalable, and modern authentication & licensing infrastructure for your applications. Get started in minutes with our high-performance APIs and multi-language SDKs.",
    whatIsTitle: "What is Habit Auth?",
    whatIsP1: "Habit Auth is an enterprise authentication, hardware licensing, and anti-tamper platform designed for software applications that require user sign-in, subscription enforcement, or cryptographically bound software licenses.",
    whatIsP2: "Applications are the backbone of the service. In Habit Auth, applications securely manage registered users, issued license keys, machine hardware IDs (HWID), audit trails, and automatic binary hash validation.",
    coreArchTitle: "Core Architectural Principle: Authentication vs. Obfuscation",
    coreArchP: "It is important to note that Habit Auth is an authentication and license management service, not an obfuscation service. While Habit Auth provides Ed25519 response signing, replay nonces, and hardware blacklist defenses, developers remain responsible for obfuscating client binaries against local memory patching and decompilers.",
    whatCanBeUsedTitle: "What can Habit Auth be used for?",
    whatCanBeUsedP: "Regardless of your application's architecture or platform, Habit Auth can be used for just about anything, including but not limited to:",
    whichFocusTitle: "Which would you like to focus on?",

    useCase1Title: "Game Development & Modding",
    useCase1Desc: "Protect in-game toolsets, game launchers, and client anti-tamper.",
    useCase2Title: "Desktop Software (C#, C++, WPF)",
    useCase2Desc: "Enterprise SaaS utilities, automated trading bots, and engineering tools.",
    useCase3Title: "Commercial Distribution & Licensing",
    useCase3Desc: "Distribute license keys through automated Discord bots, web shops, or payment gateways.",
    useCase4Title: "Microservices & Private APIs",
    useCase4Desc: "Secure backend microservices with token validation and rate limiting.",
    useCase5Title: "Mobile & Cloud Applications",
    useCase5Desc: "Cross-platform licensing that synchronizes across devices with HWID controls.",
    useCase6Title: "Enterprise Tooling",
    useCase6Desc: "Restrict sensitive internal company software to whitelisted developer machines.",

    focus1Title: "Quickstart & Setup",
    focus1Desc: "Learn how to create an application, obtain credentials, and integrate authentication in 5 minutes.",
    focus2Title: "Security & Anti-Crack",
    focus2Desc: "Discover reverse-engineering defenses, Ed25519 token signatures, and anti-memory tampering practices.",
    focus3Title: "Premade SDKs & Code",
    focus3Desc: "Download ready-to-use C#, C++, Python, Node.js, and Rust libraries with copy-paste code snippets.",
    focus4Title: "REST API Reference",
    focus4Desc: "Explore direct HTTP API endpoints, JSON request/response formats, and status codes.",

    gsTitle: "Quickstart & Core Architecture",
    gsSubtitle: "Habit Auth provides zero-trust authentication, license lifecycle binding, binary integrity verification, and instant hardware blacklist defense for software applications.",
    step1Title: "1. Create Your Application",
    step1Desc: "In the Dashboard, click New Application. You will receive an App ID and App Secret.",
    step2Title: "2. Drop in the SDK File",
    step2Desc: "Add HabitAuth.cs (or C++, Python, JS client) directly into your codebase. No external dependencies required.",
    step3Title: "3. Protect With 1 Line",
    step3Desc: "Call auth.LoginAsync() or auth.ValidateLicenseAsync() on application startup.",
    credsTitle: "Understanding Application Credentials",
    appIdTitle: "App ID (Public Client Identifier)",
    appIdDesc: "Example: app_8a920dfa12b4 — Hardcoded safely inside desktop software executables to identify which application is authenticating.",
    appSecretTitle: "App Secret (Private Administrative Key)",
    appSecretDesc: "Example: sec_9941a8b23c94... — 64-character master cryptographic secret. Used exclusively on your backend web server to generate licenses or query statistics. Never bundle this inside client binaries!",
    cryptoTitle: "Ed25519 Cryptographic Signatures",
    cryptoDesc: "Every authentication response payload is digitally signed by Habit Auth using high-speed asymmetric Ed25519 cryptography with a dynamic monotonic nonce. This completely defeats local host-file redirection, proxy tampering (Fiddler/Charles), and replay attacks.",

    secTitle: "Security Best Practices & Anti-Crack Hardening",
    secSubtitle: "Habit Auth protects your licensing and authentication. But protecting your compiled program from reverse engineers, memory patchers, and local proxy spoofing requires developer-side hardening.",
    secPhilTitle: "Core Security Philosophy: Authentication vs. Obfuscation",
    secPhilDesc: "We are an authentication service, not an obfuscation service. When you use Habit Auth official API libraries, cryptographic response signing, replay protection, and hardware locks are built in. However, if an attacker can simply modify your compiled binary in dnSpy or x64dbg and delete your if (auth.Login()) check, your software will be cracked regardless of server security. Follow this guide to build an impenetrable defense!",
    builtinProtTitle: "Built-in Habit Auth Cryptographic Protections",
    nonceTitle: "Zero-Replay Nonce Engine",
    nonceDesc: "Each API request issues a cryptographic timestamped nonce. Replayed network payloads are instantly discarded.",
    hwidTitle: "SHA-256 Multi-Sensor HWID",
    hwidDesc: "Motherboard UUID, CPU serial, and primary disk drive serial are hashed together to form a unique hardware fingerprint.",
    lockoutTitle: "24-Hour Brute-Force Lockout",
    lockoutDesc: "5 consecutive failed password attempts trigger an automatic 24-hour hardware lock on the client IP and machine.",
    integrityTitle: "Binary Integrity Auto-Ban",
    integrityDesc: "The server compares the executable SHA-256 hash against published releases, auto-banning cracked binaries.",

    authTitle: "User Authentication & 24h Lockout Engine",
    authSubtitle: "Habit Auth protects client accounts with automated brute-force defense, PBKDF2 password hashing, dynamic monotonic nonces, and asymmetric Ed25519 session tokens.",
    lockoutHeader: "24-Hour Brute-Force Lockout Defense",
    lockoutSub: "Automated attack suppression for client software",
    lockoutP: "Credential stuffing and automated dictionary bots are the #1 attack vector against desktop software licenses. Habit Auth deploys an intelligent rate-limiter keyed on a triple composite identifier: (Username + Client IP + Machine HWID).",
    threshTitle: "Threshold",
    threshVal: "5 Failed Attempts",
    penTitle: "Lockout Penalty",
    penVal: "Strict 24 Hours",

    licTitle: "Licenses & Machine HWID Binding",
    licSubtitle: "Permanently lock license keys to the user's physical machine hardware to prevent key sharing, multi-machine leakage, and illicit resale.",
    algoTitle: "Multi-Sensor HWID Fingerprinting Algorithm",
    algoSub: "Triple-layer physical hardware hashing",

    tamperTitle: "Binary Integrity Verification & Auto-Ban",
    tamperSubtitle: "Detect bytecode modifications, memory patching, and DLL injectors in real time. Automatically blacklist offending hardware IDs before cracks can be released.",
    autobanTitle: "Runtime SHA-256 Hash Matching & Auto-Ban",

    gateTitle: "Token Validation Gate (Startup Enforcer)",
    gateSubtitle: "Execute instant cryptographic token handshakes at program startup to guarantee that only valid, paid, and un-revoked users can run your application.",

    updaterTitle: "Auto-Updater Helper Engine",
    updaterSubtitle: "Ensure 100% of your user base runs your latest patched binaries. Deploy urgent security hotfixes, deliver new features, and force cracked older versions to shut down.",

    supportTitle: "In-App Support Tickets API",
    supportSubtitle: "Allow users to submit bug reports and support tickets directly from inside your software interface, synced in real-time with your Habit Auth developer dashboard.",

    sdkShowcaseTitle: "Multi-Language SDK Showcase",
    sdkShowcaseSubtitle: "Zero-dependency client libraries for C#, C++, Python, Node.js, and raw REST HTTP.",

    restApiTitle: "Complete REST API Specification",
    restApiSubtitle: "Direct HTTP API endpoints for integrating custom game engines, microservices, and web applications."
  },

  bn: {
    brandBadge: "ডকুমেন্টেশন v1.4",
    visitSite: "ওয়েবসাইটে ফিরে যান",
    searchPlaceholder: "ডকুমেন্টেশন খুঁজুন... (Ctrl+K)",
    onThisPage: "এই পাতায় রয়েছে",
    overview: "ওভারভিউ",
    core: "মূল সিকিউরিটি",
    defense: "ডিফেন্স",
    sevenLangs: "৭টি ভাষা",
    v1: "ভার্সন ১",
    gettingStarted: "শুরু করুন (Getting Started)",
    intro: "সূচনা ও পরিচিতি",
    quickstart: "কুইকস্টার্ট ও সেটআপ",
    coreSecurity: "মূল নিরাপত্তা (Core Security)",
    securityAntiCrack: "সিকিউরিটি ও অ্যান্টি-ক্র্যাক",
    userAuth: "ইউজার অথ ও ২৪ ঘণ্টা লকআউট",
    licensesHwid: "লাইসেন্স ও মেশিন HWID লক",
    binaryIntegrity: "বাইনারি সততা ও অটো-ব্যান",
    tokenValidation: "টোকেন ভ্যালিডেশন গেট",
    sdksLibraries: "SDK এবং লাইব্রেরি",
    multiLangSdks: "মাল্টি-ল্যাঙ্গুয়েজ SDKসমূহ",
    autoUpdater: "অটো-আপডেটার ইঞ্জিন",
    supportTickets: "সাপোর্ট টিকিট API",
    apiReference: "API রেফারেন্স",
    completeRestApi: "সম্পূর্ণ REST API",
    copyCode: "কপি করুন",
    copied: "কপি হয়েছে!",
    quickActions: "কুইক অ্যাকশনস",
    backToTop: "↑ উপরে যান",

    needHelpTitle: "ইন্টিগ্রেশনে সাহায্য প্রয়োজন?",
    needHelpDesc: "লাইভ সহায়তা এবং SDK গাইডলাইনের জন্য আমাদের ডিসকর্ড ডেভেলপার সার্ভারে যুক্ত হন।",
    joinDiscord: "ডিসকর্ড সার্ভারে যুক্ত হন",

    introBadge: "শুরু করুন",
    introTitle: "ডেভেলপারদের জন্য নির্মিত অথেন্টিকেশন!",
    introSubtitle: "আপনার প্রজেক্ট বা অ্যাপ্লিকেশনের জন্য নিরাপদ, স্কেলযোগ্য এবং আধুনিক লাইসেন্সিং ও অথেন্টিকেশন পরিকাঠামো। আমাদের উচ্চ-ক্ষমতাসম্পন্ন এপিআই ও মাল্টি-ল্যাঙ্গুয়েজ এসডিকে দিয়ে মিনিটে কাজ শুরু করুন।",
    whatIsTitle: "কী এই হ্যাবিট অথ (Habit Auth)?",
    whatIsP1: "হ্যাবিট অথ হলো আধুনিক ডেস্কটপ ও ক্লাউড অ্যাপ্লিকেশনের জন্য একটি মিলিটারি-গ্রেড অথেন্টিকেশন, হার্ডওয়্যার আইডি লকিং এবং অ্যান্টি-ট্যাম্পার নিরাপত্তা প্ল্যাটফর্ম।",
    whatIsP2: "ড্যাশবোর্ডের সাহায্যে রেজিস্টার্ড ইউজার, লাইসেন্স কি, মেশিন HWID এবং অডিট লগ নিরাপদ ও স্বয়ংক্রিয়ভাবে পরিচালনা করা যায়।",
    coreArchTitle: "মূল আর্কিটেকচার নীতি: অথেন্টিকেশন বনাম অবফাসকেশন",
    coreArchP: "মনে রাখা প্রয়োজন যে হ্যাবিট অথ একটি অথেন্টিকেশন ও লাইসেন্সিং সার্ভিস। এটি Ed25519 সাইনড রেসপন্স ও HWID ব্ল্যাকলিস্ট ডিফেন্স প্রদান করে, তবে রিভার্স ইঞ্জিনিয়ারিং ও মেমরি ক্র্যাকিং প্রতিরোধের দায়িত্ব ডেভেলপারদের অবফাসকেশনের উপর নির্ভর করে।",
    whatCanBeUsedTitle: "হ্যাবিট অথ কী কী কাজে ব্যবহার করা যায়?",
    whatCanBeUsedP: "আপনার সফটওয়্যারের ভাষা বা আর্কিটেকচার যা-ই হোক না কেন, হ্যাবিট অথ নিচের সকল ক্ষেত্রে সহজেই ব্যবহারযোগ্য:",
    whichFocusTitle: "আপনি কোন বিষয়ে নজর দিতে চান?",

    useCase1Title: "গেম ডেভেলপমেন্ট ও মোডিং",
    useCase1Desc: "ইন-গেম টুলসেট, গেম লঞ্চার এবং ক্লায়েন্ট সাইড অ্যান্টি-ট্যাম্পার সুরক্ষা।",
    useCase2Title: "ডেস্কটপ সফটওয়্যার (C#, C++, WPF)",
    useCase2Desc: "এন্টারপ্রাইজ টুলস, স্বয়ংক্রিয় ট্রেডিং বট এবং ইঞ্জিনিয়ারিং অ্যাপ্লিকেশন।",
    useCase3Title: "রিসেলার সিস্টেম ও অটোমেশন",
    useCase3Desc: "ডিসকর্ড বট, ওয়েব শপ বা অটোমেটেড ই-কমার্স পেমেন্টের মাধ্যমে লাইসেন্স বিক্রি।",
    useCase4Title: "মাইক্রোসার্ভিস ও প্রাইভেট API",
    useCase4Desc: "টোকেন ভ্যালিডেশন এবং রেট লিমিটিং দ্বারা ব্যাকএন্ড সার্ভিস সুরক্ষিত করা।",
    useCase5Title: "মোবাইল ও ক্লাউড অ্যাপ্লিকেশন",
    useCase5Desc: "মাল্টি-ডিভাইস সিঙ্ক্রোনাইজেশন এবং ক্রিপ্টোগ্রাফিক HWID কন্ট্রোল।",
    useCase6Title: "এন্টারপ্রাইজ টুলিং",
    useCase6Desc: "কোম্পানির সংবেদনশীল অভ্যন্তরীণ সফটওয়্যার নির্দিষ্ট মেশিনে সীমাবদ্ধ রাখা।",

    focus1Title: "কুইকস্টার্ট ও সেটআপ",
    focus1Desc: "৫ মিনিটে অ্যাপ্লিকেশন তৈরি, ক্রেডেনশিয়াল সংগ্রহ এবং কোড ইন্টিগ্রেশন শিখুন।",
    focus2Title: "সিকিউরিটি ও অ্যান্টি-ক্র্যাক",
    focus2Desc: "রিভার্স-ইঞ্জিনিয়ারিং ডিফেন্স, Ed25519 সিগনেচার এবং মেমরি অ্যান্টি-ট্যাম্পার গাইড।",
    focus3Title: "তৈরি করা SDK ও কোড",
    focus3Desc: "C#, C++, Python, Node.js এবং Rust লাইব্রেরি ডাউনলোড করুন রেডি কোড সহ।",
    focus4Title: "REST API রেফারেন্স",
    focus4Desc: "এইচটিটিপি এন্ডপয়েন্ট, JSON রিকোয়েস্ট/রেসপন্স ফরম্যাট এবং স্ট্যাটাস কোড দেখুন।",

    gsTitle: "কুইকস্টার্ট ও মূল আর্কিটেকচার",
    gsSubtitle: "হ্যাবিট অথ আপনার সফটওয়্যারের জন্য জিরো-ট্রাস্ট অথেন্টিকেশন, হার্ডওয়্যার আইডি বাইন্ডিং এবং অটো-ব্যান ডিফেন্স প্রদান করে।",
    step1Title: "১. আপনার অ্যাপ্লিকেশন তৈরি করুন",
    step1Desc: "ড্যাশবোর্ডে New Application ক্লিকে একটি অ্যাপ তৈরি করে App ID এবং App Secret সংগ্রহ করুন।",
    step2Title: "২. SDK ফাইল কোডে যুক্ত করুন",
    step2Desc: "HabitAuth.cs (বা C++, Python, JS ক্লায়েন্ট) সরাসরি আপনার প্রজেক্টে যুক্ত করুন।",
    step3Title: "৩. ১ লাইনেই সিকিউরিটি যুক্ত করুন",
    step3Desc: "অ্যাপ স্টার্টআপে auth.LoginAsync() বা auth.ValidateLicenseAsync() কল করুন।",
    credsTitle: "অ্যাপ্লিকেশন ক্রেডেনশিয়াল পরিচিতি",
    appIdTitle: "App ID (পাবলিক ক্লায়েন্ট আইডি)",
    appIdDesc: "উদাহরণ: app_8a920dfa12b4 — অ্যাপ্লিকেশনের ভেতরে নিরাপদে হার্ডকোড করা থাকে যা অ্যাপটি সনাক্ত করে।",
    appSecretTitle: "App Secret (প্রাইভেট অ্যাডমিন কি)",
    appSecretDesc: "উদাহরণ: sec_9941a8b23c94... — ৬৪-অক্ষরের সিক্রেট কি। এটি শুধুমাত্র আপনার সার্ভারে থাকবে, ক্লায়েন্ট অ্যাপে দিবেন না!",
    cryptoTitle: "Ed25519 ক্রিপ্টোগ্রাফিক ডিজিটাল সিগনেচার",
    cryptoDesc: "প্রতিটি এপিআই রেসপন্স Ed25519 প্রাইভেট কি দিয়ে ডিজিটালি সাইন করা হয়। এতে প্রক্সি স্পুফিং (Fiddler/Charles) এবং রিপ্লে অ্যাটাক সম্পূর্ণ প্রতিহত হয়।",

    secTitle: "সিকিউরিটি সেরা উপায় ও অ্যান্টি-ক্র্যাক হার্ডেনিং",
    secSubtitle: "হ্যাবিট অথ আপনার লাইসেন্স ও অথেন্টিকেশন সুরক্ষিত রাখে। রিভার্স ইঞ্জিনিয়ারিং ও মেমরি প্যাচিং প্রতিরোধের জন্য এটি অনুসরণ করুন।",
    secPhilTitle: "মূল সিকিউরিটি দর্শন: অথেন্টিকেশন বনাম অবফাসকেশন",
    secPhilDesc: "আমরা একটি অথেন্টিকেশন সার্ভিস, অবফাসকেশন সার্ভিস নই। আমাদের SDK-তে Ed25519 সিগনেচার ও HWID লক বিল্ট-ইন থাকে, তবে ক্লায়েন্ট বাইনারি সুরক্ষিত রাখতে অবফাসকেশন প্রয়োগ করা জরুরি।",
    builtinProtTitle: "বিল্ট-ইন হ্যাবিট অথ ক্রিপ্টোগ্রাফিক সুরক্ষা",
    nonceTitle: "জিরো-রিপ্লে ননস ইঞ্জিন",
    nonceDesc: "প্রতিটি রিকোয়েস্টে টাইমস্ট্যাম্পযুক্ত ননস থাকে। পুরনো প্যাকেট রিপ্লে করলে তাৎক্ষণিক বাতিল হয়।",
    hwidTitle: "SHA-256 মাল্টি-সেন্সর HWID",
    hwidDesc: "মাদারবোর্ড, প্রসেসর ও ড্রাইভ সিরিয়াল দিয়ে অনন্য হার্ডওয়্যার ফিঙ্গারপ্রিন্ট তৈরি হয়।",
    lockoutTitle: "২৪ ঘণ্টা ব্রুট-ফোর্স লকআউট",
    lockoutDesc: "পর পর ৫ বার ভুল পাসওয়ার্ড দিলে স্বয়ংক্রিয়ভাবে ২৪ ঘণ্টার জন্য মেশিন ব্লক হয়।",
    integrityTitle: "বাইনারি সততা ও অটো-ব্যান",
    integrityDesc: "সার্ভার মেলাবে আপনার বাইনারি হ্যাশ। মডিফাইড বা ক্র্যাকড বাইনারি পেলে সরাসরি ব্যান করে।",

    authTitle: "ইউজার অথেন্টিকেশন ও ২৪ ঘণ্টা লকআউট ইঞ্জিন",
    authSubtitle: "হ্যাবিট অথ অটোমেটেড ব্রুট-ফোর্স ডিফেন্স ও Ed25519 সেশন টোকেন দিয়ে অ্যাকাউন্ট সুরক্ষিত রাখে।",
    lockoutHeader: "২৪-ঘণ্টা ব্রুট-ফোর্স লকআউট সুরক্ষা",
    lockoutSub: "অটোমেটেড আক্রমণ প্রতিহত করার স্বয়ংক্রিয় ব্যবস্থা",
    lockoutP: "ক্র্যাঙ্কার ও বট অ্যাটাক রোখার জন্য হ্যাবিট অথ (ইউজারনেম + আইপি + HWID) ট্রিপল সমন্বয়ে রেট-লিমিট প্রয়োগ করে।",
    threshTitle: "লকআউট লিমিট",
    threshVal: "৫ বার ভুল চেষ্টা",
    penTitle: "লকআউট মেয়াদ",
    penVal: "কঠোর ২৪ ঘণ্টা",

    licTitle: "লাইসেন্স কি এবং HWID বাইন্ডিং ইঞ্জিন",
    licSubtitle: "লাইসেন্স কি স্থায়ীভাবে ব্যবহারকারীর মেশিনের হার্ডওয়্যারে লক করে কি-শেয়ারিং ও অবৈধ বিক্রি বন্ধ করুন।",
    algoTitle: "মাল্টি-সেন্সর HWID অ্যালগরিদম",
    algoSub: "ত্রি-স্তরযুক্ত ফিজিক্যাল হার্ডওয়্যার হ্যাশিং",

    tamperTitle: "বাইনারি সততা যাচাই ও অ্যান্টি-ট্যাম্পার",
    tamperSubtitle: "বাইনারি কোড পরিবর্তন, মেমরি প্যাচিং বা ডিএলএল ইনজেকশন রিয়েল-টাইমে সনাক্ত ও ব্যান করুন।",
    autobanTitle: "রানটাইম SHA-256 হ্যাশ ম্যাচিং ও অটো-ব্যান",

    gateTitle: "টোকেন ভ্যালিডেশন (স্টার্টআপ গেট)",
    gateSubtitle: "অ্যাপ্লিকেশন চালুর শুরুতেই এনক্রিপ্টেড টোকেন ফাইল যাচাই করে অননুমোদিত অ্যাক্সেস রোধ করুন।",

    updaterTitle: "অটো-আপডেটার ইঞ্জিন",
    updaterSubtitle: "অ্যাপ্লিকেশনের নতুন ভার্সন চেক ও অটোমেটিক ফোর্সেড আপডেট ডেলিভারি সুবিধা।",

    supportTitle: "সাপোর্ট টিকিট API",
    supportSubtitle: "অ্যাপ্লিকেশনের ভেতরেই ব্যবহারকারীদের জন্য এমবেডেড হেল্পডেস্ক ও ডিসকর্ড সিঙ্ক।",

    sdkShowcaseTitle: "মাল্টি-ল্যাঙ্গুয়েজ SDK শোকেস",
    sdkShowcaseSubtitle: "C#, C++, Python, Node.js, Go এবং Rust-এর জন্য রেডি-টু-ইউজ সাইনড কোড এক্সাম্পল।",

    restApiTitle: "সম্পূর্ণ REST API রেফারেন্স",
    restApiSubtitle: "ডাইরেক্ট এইচটিটিপি এপিআই এন্ডপয়েন্ট, রিকোয়েস্ট/রেসপন্স JSON স্ট্রাকচার ও স্ট্যাটাস কোড।"
  },

  es: {
    brandBadge: "Documentación v1.4",
    visitSite: "Visitar Sitio Web",
    searchPlaceholder: "Buscar documentación... (Ctrl+K)",
    onThisPage: "En esta página",
    overview: "Visión General",
    core: "Núcleo",
    defense: "Defensa",
    sevenLangs: "7 Idiomas",
    v1: "v1",
    gettingStarted: "Primeros Pasos",
    intro: "Introducción",
    quickstart: "Inicio Rápido",
    coreSecurity: "Seguridad Principal",
    securityAntiCrack: "Seguridad y Anti-Crack",
    userAuth: "Autenticación de Usuario",
    licensesHwid: "Licencias y HWID",
    binaryIntegrity: "Integridad Binaria y Auto-Baneo",
    tokenValidation: "Validación de Token",
    sdksLibraries: "SDKs y Librerías",
    multiLangSdks: "SDKs Multilenguaje",
    autoUpdater: "Motor de Actualización",
    supportTickets: "API de Soporte",
    apiReference: "Referencia API",
    completeRestApi: "API REST Completa",
    copyCode: "Copiar",
    copied: "¡Copiado!",

    needHelpTitle: "¿Necesitas ayuda con la integración?",
    needHelpDesc: "Únete a nuestra comunidad de Discord para recibir ayuda en vivo y soporte de SDK.",
    joinDiscord: "Unirse al Servidor de Discord",
    introBadge: "Primeros Pasos",
    introTitle: "¡Autenticación creada para desarrolladores!",
    introSubtitle: "Infraestructura de licencias y autenticación segura y moderna para sus aplicaciones.",
    whatIsTitle: "¿Qué es Habit Auth?",
    whatIsP1: "Habit Auth es una plataforma empresarial de autenticación y licencias con bloqueo por HWID.",
    whatIsP2: "Las aplicaciones administran de forma segura los usuarios, licencias y HWID.",
    coreArchTitle: "Principio Arquitectónico Principal: Autenticación vs Obfuscación",
    coreArchP: "Es importante destacar que Habit Auth es un servicio de autenticación y licencias...",
    whatCanBeUsedTitle: "¿Para qué se puede utilizar Habit Auth?",
    whatCanBeUsedP: "Independientemente de la arquitectura de su aplicación, Habit Auth se puede utilizar para:",
    whichFocusTitle: "¿En qué te gustaría enfocarte?",

    gsTitle: "Inicio Rápido y Arquitectura Principal",
    gsSubtitle: "Habit Auth proporciona autenticación de confianza cero y protección HWID.",
    step1Title: "1. Crea tu Aplicación",
    step1Desc: "En el panel, haz clic en Nueva Aplicación. Obtendrás un App ID y App Secret.",
    step2Title: "2. Agrega el SDK",
    step2Desc: "Agrega HabitAuth.cs directamente a tu código. Sin dependencias externas.",
    step3Title: "3. Protege con 1 Línea",
    step3Desc: "Llama a auth.LoginAsync() al iniciar la aplicación.",
    credsTitle: "Comprendiendo las Credenciales de la Aplicación",
    appIdTitle: "App ID (Identificador Público)",
    appIdDesc: "Ejemplo: app_8a920dfa12b4 — Código incrustado de forma segura en ejecutable.",
    appSecretTitle: "App Secret (Clave Privada)",
    appSecretDesc: "Ejemplo: sec_9941a8b23c94... — Clave maestra de 64 caracteres. ¡Nunca en cliente!",
    cryptoTitle: "Firma Criptográfica Ed25519",
    cryptoDesc: "Cada respuesta está firmada digitalmente con criptografía asimétrica Ed25519."
  },

  de: {
    brandBadge: "Dokumentation v1.4",
    visitSite: "Website Besuchen",
    searchPlaceholder: "Dokumentation suchen... (Strg+K)",
    onThisPage: "Auf dieser Seite",
    overview: "Übersicht",
    core: "Kern",
    defense: "Abwehr",
    sevenLangs: "7 Sprachen",
    v1: "v1",
    gettingStarted: "Erste Schritte",
    intro: "Einführung",
    quickstart: "Schnellstart & Einrichtung",
    coreSecurity: "Kernsicherheit",
    securityAntiCrack: "Sicherheit & Anti-Crack",
    userAuth: "Benutzer-Auth & 24h Sperre",
    licensesHwid: "Lizenzen & Maschinen-HWID",
    binaryIntegrity: "Binäre Integrität & Auto-Bann",
    tokenValidation: "Token-Validierungsgate",
    sdksLibraries: "SDKs & Bibliotheken",
    multiLangSdks: "Mehrsprachige SDKs",
    autoUpdater: "Auto-Updater Engine",
    supportTickets: "Support-Tickets API",
    apiReference: "API-Referenz",
    completeRestApi: "Vollständige REST-API",
    copyCode: "Kopieren",
    copied: "Kopiert!",

    needHelpTitle: "Brauchen Sie Hilfe bei der Integration?",
    needHelpDesc: "Treten Sie unserer Entwickler-Discord-Community bei, um Live-Unterstützung zu erhalten.",
    joinDiscord: "Discord-Server beitreten",
    introBadge: "Erste Schritte",
    introTitle: "Authentifizierung für Entwickler gemacht!",
    introSubtitle: "Sichere und moderne Lizenzierungsinfrastruktur für Ihre Anwendungen.",
    whatIsTitle: "Was ist Habit Auth?",
    whatIsP1: "Habit Auth ist eine Enterprise-Authentifizierungs- und Lizenzierungsplattform.",
    whatIsP2: "Anwendungen verwalten Benutzer, Lizenzen und HWIDs sicher.",
    coreArchTitle: "Kernarchitekturprinzip: Authentifizierung vs. Obfuszierung",
    coreArchP: "Wichtig: Habit Auth ist ein Authentifizierungsdienst, kein Obfuszierungsdienst...",
    whatCanBeUsedTitle: "Wofür kann Habit Auth verwendet werden?",
    whatCanBeUsedP: "Unabhängig von der Architektur Ihrer Anwendung kann Habit Auth verwendet werden für:",
    whichFocusTitle: "Worauf möchten Sie sich konzentrieren?",

    gsTitle: "Schnellstart & Kernarchitektur",
    gsSubtitle: "Habit Auth bietet Zero-Trust-Authentifizierung und HWID-Schutz.",
    step1Title: "1. Anwendung erstellen",
    step1Desc: "Klicken Sie im Dashboard auf Neue Anwendung.",
    step2Title: "2. SDK einbinden",
    step2Desc: "Fügen Sie HabitAuth.cs direkt in Ihren Code ein.",
    step3Title: "3. Mit 1 Zeile schützen",
    step3Desc: "Rufen Sie auth.LoginAsync() beim Anwendungsstart auf.",
    credsTitle: "Anwendungsanmeldedaten verstehen",
    appIdTitle: "App ID (Öffentlicher Client-Bezeichner)",
    appIdDesc: "Beispiel: app_8a920dfa12b4 — Sicher im Code eingebettet.",
    appSecretTitle: "App Secret (Privater Schlüssel)",
    appSecretDesc: "Beispiel: sec_9941a8b23c94... — 64-Zeichen Geheimschlüssel. Niemals im Client!",
    cryptoTitle: "Kryptographische Ed25519-Signaturen",
    cryptoDesc: "Jede Antwort wird mit Ed25519 digital signiert."
  },

  fr: {
    brandBadge: "Docs v1.4",
    visitSite: "Visiter le Site Web",
    searchPlaceholder: "Rechercher de la doc... (Ctrl+K)",
    onThisPage: "Sur cette page",
    overview: "Aperçu",
    core: "Cœur",
    defense: "Défense",
    sevenLangs: "7 Langues",
    v1: "v1",
    gettingStarted: "Prise en Main",
    intro: "Introduction",
    quickstart: "Démarrage Rapide",
    coreSecurity: "Sécurité Principale",
    securityAntiCrack: "Sécurité & Anti-Crack",
    userAuth: "Authentification & Verrou 24h",
    licensesHwid: "Licences & HWID Machine",
    binaryIntegrity: "Intégrité Binaire & Auto-Ban",
    tokenValidation: "Porte de Validation de Jeton",
    sdksLibraries: "SDKs & Bibliothèques",
    multiLangSdks: "SDKs Multilingues",
    autoUpdater: "Moteur d'Auto-Mise à Jour",
    supportTickets: "API Support Tickets",
    apiReference: "Référence API",
    completeRestApi: "API REST Complète",
    copyCode: "Copier",
    copied: "Copié !",

    needHelpTitle: "Besoin d'aide pour l'intégration ?",
    needHelpDesc: "Rejoignez notre communauté Discord pour obtenir de l'aide en direct.",
    joinDiscord: "Rejoindre le Serveur Discord",
    introBadge: "Prise en Main",
    introTitle: "L'authentification conçue pour les développeurs !",
    introSubtitle: "Infrastructure de licence et d'authentification sécurisée pour vos applications.",
    whatIsTitle: "Qu'est-ce que Habit Auth ?",
    whatIsP1: "Habit Auth est une plateforme d'authentification d'entreprise et de licences matérielles.",
    whatIsP2: "Les applications gèrent en toute sécurité les utilisateurs, licences et HWID.",
    coreArchTitle: "Principe Architectural Clé : Authentification vs Obfuscation",
    coreArchP: "Il est important de noter que Habit Auth est un service d'authentification...",
    whatCanBeUsedTitle: "À quoi peut servir Habit Auth ?",
    whatCanBeUsedP: "Quelle que soit l'architecture de votre application, Habit Auth s'adapte à :",
    whichFocusTitle: "Sur quoi souhaitez-vous vous concentrer ?",

    gsTitle: "Démarrage Rapide et Architecture",
    gsSubtitle: "Habit Auth fournit une authentification zéro-confiance et protection HWID.",
    step1Title: "1. Créez Votre Application",
    step1Desc: "Dans le tableau de bord, cliquez sur Nouvelle Application.",
    step2Title: "2. Ajoutez le SDK",
    step2Desc: "Ajoutez HabitAuth.cs directement dans votre projet.",
    step3Title: "3. Protégez en 1 Ligne",
    step3Desc: "Appelez auth.LoginAsync() au démarrage.",
    credsTitle: "Comprendre les Identifiants d'Application",
    appIdTitle: "App ID (Identifiant Public)",
    appIdDesc: "Exemple: app_8a920dfa12b4 — Intégré en toute sécurité.",
    appSecretTitle: "App Secret (Clé Privée Admin)",
    appSecretDesc: "Exemple: sec_9941a8b23c94... — Clé maître de 64 caractères. Jamais dans le client !",
    cryptoTitle: "Signatures Cryptographiques Ed25519",
    cryptoDesc: "Chaque réponse est signée numériquement avec Ed25519."
  },

  ru: {
    brandBadge: "Документация v1.4",
    visitSite: "Перейти на Сайт",
    searchPlaceholder: "Поиск по документации... (Ctrl+K)",
    onThisPage: "На этой странице",
    overview: "Обзор",
    core: "Ядро",
    defense: "Защита",
    sevenLangs: "7 Языков",
    v1: "v1",
    gettingStarted: "Начало работы",
    intro: "Введение",
    quickstart: "Быстрый старт и настройка",
    coreSecurity: "Безопасность ядра",
    securityAntiCrack: "Безопасность и анти-взлом",
    userAuth: "Авторизация и блокировка 24ч",
    licensesHwid: "Лицензии и привязка HWID",
    binaryIntegrity: "Целостность и авто-бан",
    tokenValidation: "Шлюз валидации токенов",
    sdksLibraries: "SDK и библиотеки",
    multiLangSdks: "Многоязычные SDK",
    autoUpdater: "Модуль авто-обновлений",
    supportTickets: "API тикетов поддержки",
    apiReference: "Справочник API",
    completeRestApi: "Полный REST API",
    copyCode: "Копировать",
    copied: "Скопировано!",

    needHelpTitle: "Нужна помощь с интеграцией?",
    needHelpDesc: "Присоединяйтесь к нашему Discord-сообществу для помощи в реальном времени.",
    joinDiscord: "Вступить в Discord Сервер",
    introBadge: "Начало работы",
    introTitle: "Аутентификация, созданная для разработчиков!",
    introSubtitle: "Надежная инфраструктура аутентификации и лицензирования для ваших приложений.",
    whatIsTitle: "Что такое Habit Auth?",
    whatIsP1: "Habit Auth — это платформа аутентификации корпоративного уровня с привязкой к HWID.",
    whatIsP2: "Приложения безопасно управляют пользователями, лицензиями и привязкой HWID.",
    coreArchTitle: "Основной Архитектурный Принцип: Аутентификация против Обфускации",
    coreArchP: "Важно отметить, что Habit Auth — это сервис аутентификации...",
    whatCanBeUsedTitle: "Для чего можно использовать Habit Auth?",
    whatCanBeUsedP: "Независимо от архитектуры вашего приложения, Habit Auth подходит для:",
    whichFocusTitle: "На чем вы хотите сосредоточиться?",

    gsTitle: "Быстрый Старт и Архитектура",
    gsSubtitle: "Habit Auth обеспечивает аутентификацию нулевого доверия и защиту HWID.",
    step1Title: "1. Создайте Ваше Приложение",
    step1Desc: "В панели управления нажмите Создать приложение.",
    step2Title: "2. Добавьте файл SDK",
    step2Desc: "Добавьте HabitAuth.cs прямо в ваш код.",
    step3Title: "3. Защитите 1 строкой",
    step3Desc: "Вызовите auth.LoginAsync() при запуске приложения.",
    credsTitle: "Понимание учетных данных приложения",
    appIdTitle: "App ID (Публичный Идентификатор)",
    appIdDesc: "Пример: app_8a920dfa12b4 — Безопасно встроено в клиентский код.",
    appSecretTitle: "App Secret (Приватный Ключ)",
    appSecretDesc: "Пример: sec_9941a8b23c94... — 64-значный секретный ключ. Никогда в клиенте!",
    cryptoTitle: "Криптографические Подписи Ed25519",
    cryptoDesc: "Каждый ответ подписывается асимметричным ключом Ed25519."
  },

  zh: {
    brandBadge: "文档 v1.4",
    visitSite: "访问官方网站",
    searchPlaceholder: "搜索文档内容... (Ctrl+K)",
    onThisPage: "本页目录",
    overview: "概览",
    core: "核心",
    defense: "防护",
    sevenLangs: "7 种语言",
    v1: "v1",
    gettingStarted: "快速入门",
    intro: "产品简介",
    quickstart: "快速上手与配置",
    coreSecurity: "核心安全保护",
    securityAntiCrack: "安全防护与防破解",
    userAuth: "用户认证与24小时封禁",
    licensesHwid: "授权码与硬件HWID绑定",
    binaryIntegrity: "二进制完整性与自动封锁",
    tokenValidation: "令牌验证关卡",
    sdksLibraries: "SDK 与开发库",
    multiLangSdks: "多语言 SDK 展示",
    autoUpdater: "自动更新引擎",
    supportTickets: "工单支持 API",
    apiReference: "API 接口文档",
    completeRestApi: "完整 REST API",
    copyCode: "复制",
    copied: "已复制！",

    needHelpTitle: "需要集成帮助？",
    needHelpDesc: "加入我们的 Discord 开发者社区，获取实时协助与 SDK 支持。",
    joinDiscord: "加入 Discord 服务器",
    introBadge: "快速入门",
    introTitle: "为开发者打造的安全认证！",
    introSubtitle: "为您的应用程序提供安全、可扩展的现代授权与认证基础设施。",
    whatIsTitle: "什么是 Habit Auth？",
    whatIsP1: "Habit Auth 是一个企业级身份验证、硬件 ID 绑定与防篡改授权平台。",
    whatIsP2: "应用可以在系统中轻松安全地管理注册用户、发放的授权码、硬件 HWID 及审计日志。",
    coreArchTitle: "核心架构理念：安全验证与代码混淆的区别",
    coreArchP: "需要特别指出的是，Habit Auth 是一套身份验证与授权管理服务，而非代码混淆工具...",
    whatCanBeUsedTitle: "Habit Auth 可以用于哪些场景？",
    whatCanBeUsedP: "无论您的应用采用何种架构或平台，Habit Auth 均可无缝应用于以下场景：",
    whichFocusTitle: "您希望先了解哪一项内容？",

    gsTitle: "快速上手与核心架构",
    gsSubtitle: "Habit Auth 为软件应用提供零信任认证、授权生命周期绑定、二进制完整性校验及实时 HWID 封禁防护。",
    step1Title: "1. 创建您的应用",
    step1Desc: "在控制台点击创建新应用，您将获得 App ID 与 App Secret。",
    step2Title: "2. 引入 SDK 文件",
    step2Desc: "将 HabitAuth.cs（或 C++, Python, JS 客户端）直接引入您的代码库，无需外部依赖。",
    step3Title: "3. 一行代码完成保护",
    step3Desc: "在应用启动时调用 auth.LoginAsync() 或 auth.ValidateLicenseAsync()。",
    credsTitle: "理解应用程序密钥",
    appIdTitle: "App ID (公钥客户端标识符)",
    appIdDesc: "示例：app_8a920dfa12b4 — 安全放置于客户端程序中用于识别应用。",
    appSecretTitle: "App Secret (私钥管理密钥)",
    appSecretDesc: "示例：sec_9941a8b23c94... — 64位主加密密钥。仅在后端服务器使用，切勿打包进客户端！",
    cryptoTitle: "Ed25519 非对称数字签名",
    cryptoDesc: "每一个 API 响应报文均使用高速 Ed25519 私钥加密签名，彻底封堵代理篡改与重放攻击。"
  }
};

const DOCS_TRANSLATIONS = {
  bn: {
  "Fundamentals": "মূল ভিত্তি",
  "Client Security": "ক্লায়েন্ট সিকিউরিটি",
  "Hardware Binding": "হার্ডওয়্যার বাইন্ডিং",
  "Anti-Tamper": "অ্যান্টি-ট্যাম্পার",
  "Startup Gate": "স্টার্টআপ গেট",
  "Distribution & Delivery": "ডিস্ট্রিবিউশন ও ডেলিভারি",
  "Customer Care": "কাস্টমার কেয়ার",
  "SDK Integration": "SDK ইন্টিগ্রেশন",
  "REST v1": "REST v১",
  "Enterprise Defense Standard": "এন্টারপ্রাইজ ডিফেন্স স্ট্যান্ডার্ড",
  "Copied!": "কপি হয়েছে!",
  "Copy Snippet": "কোড কপি করুন",
  "On this page": "এই পাতায় রয়েছে",
  "Quickstart & Core Architecture": "কুইকস্টার্ট ও মূল আর্কিটেকচার",
  "3-Step Setup Process": "৩-ধাপের সেটআপ প্রক্রিয়া",
  "1. Create Your Application": "১. অ্যাপ্লিকেশন তৈরি করুন",
  "Create Your Application": "অ্যাপ্লিকেশন তৈরি করুন",
  "In the Dashboard, click New Application. You will receive an App ID and App Secret.": "ড্যাশবোর্ডে New Application ক্লিকে একটি অ্যাপ তৈরি করে App ID এবং App Secret সংগ্রহ করুন।",
  "2. Drop in the SDK File": "২. SDK ফাইল প্রজেক্টে যুক্ত করুন",
  "Drop in the SDK File": "SDK ফাইল যুক্ত করুন",
  "Add HabitAuth.cs (or C++, Python, JS client) directly into your codebase. No external dependencies required.": "HabitAuth.cs (বা C++, Python, JS ক্লায়েন্ট) সরাসরি আপনার প্রজেক্টে যুক্ত করুন। কোনো অতিরিক্ত ডিপেন্ডেন্সি প্রয়োজন নেই।",
  "3. Protect With 1 Line": "৩. ১ লাইনেই সিকিউরিটি যুক্ত করুন",
  "Protect With 1 Line": "১ লাইনে প্রটেক্ট করুন",
  "Call auth.LoginAsync() or auth.ValidateLicenseAsync() on application startup.": "অ্যাপ স্টার্টআপে auth.LoginAsync() বা auth.ValidateLicenseAsync() কল করুন।",
  "Understanding Application Credentials": "অ্যাপ্লিকেশন ক্রেডেনশিয়াল পরিচিতি",
  "App ID (Public Client Identifier)": "App ID (পাবলিক ক্লায়েন্ট আইডি)",
  "App Secret (Private Administrative Key)": "App Secret (প্রাইভেট অ্যাডমিন কি)",
  "Ed25519 Cryptographic Signatures": "Ed25519 ক্রিপ্টোগ্রাফিক ডিজিটাল সিগনেচার",
  "Every authentication response payload is digitally signed by Habit Auth using high-speed asymmetric Ed25519 cryptography with a dynamic monotonic nonce. This completely defeats local host-file redirection, proxy tampering (Fiddler/Charles), and replay attacks.": "প্রতিটি এপিআই রেসপন্স Ed25519 প্রাইভেট কি দিয়ে ডিজিটালি সাইন করা হয়। এতে প্রক্সি স্পুফিং (Fiddler/Charles) এবং রিপ্লে অ্যাটাক সম্পূর্ণ প্রতিহত হয়।",
  "Security Best Practices & Anti-Crack Hardening": "সিকিউরিটি সেরা উপায় ও অ্যান্টি-ক্র্যাক হার্ডেনিং",
  "⛨ Security Best Practices & Anti-Crack Hardening": "⛨ সিকিউরিটি সেরা উপায় ও অ্যান্টি-ক্র্যাক হার্ডেনিং",
  "Core Security Philosophy: Authentication vs. Obfuscation": "মূল সিকিউরিটি দর্শন: অথেন্টিকেশন বনাম অবফাসকেশন",
  "We are an authentication service, not an obfuscation service.": "আমরা একটি অথেন্টিকেশন সার্ভিস, অবফাসকেশন সার্ভিস নই।",
  "When you use Habit Auth official API libraries, cryptographic response signing, replay protection, and hardware locks are built in. However, if an attacker can simply modify your compiled binary in dnSpy or x64dbg and delete your": "হ্যাবিট অথের অফিসিয়াল এপিআই ব্যবহার করলে ডিজিটাল সাইনিং ও HWID লক বিল্ট-ইন থাকে। কিন্তু আক্রমণকারী dnSpy দিয়ে কোড পরিবর্তন করলে ক্লায়েন্ট বাইনারি ঝুঁকিতে পড়বে। তাই সার্ভার সিকিউরিটির পাশাপাশি অবফাসকেশন জরুরি!",
  "Built-in Habit Auth Cryptographic Protections": "বিল্ট-ইন হ্যাবিট অথ ক্রিপ্টোগ্রাফিক সুরক্ষা",
  "Zero-Replay Nonce Engine": "জিরো-রিপ্লে ননস ইঞ্জিন",
  "Each API request issues a cryptographic timestamped nonce. Replayed network payloads are instantly discarded.": "প্রতিটি রিকোয়েস্টে টাইমস্ট্যাম্পযুক্ত ননস থাকে। ক্যাপচার করা নেটওয়ার্ক প্যাকেট রিপ্লে করলে সাথে সাথে বাতিল হয়।",
  "SHA-256 Multi-Sensor HWID": "SHA-256 মাল্টি-সেন্সর HWID",
  "Motherboard UUID, CPU serial, and primary disk drive serial are hashed together to form a unique hardware fingerprint.": "মাদারবোর্ড, প্রসেসর ও ডিস্ক ড্রাইভ সিরিয়াল একত্রিত করে একক অনন্য হার্ডওয়্যার ফিঙ্গারপ্রিন্ট তৈরি হয়।",
  "24-Hour Brute-Force Lockout": "২৪ ঘণ্টা ব্রুট-ফোর্স লকআউট",
  "5 consecutive failed password attempts trigger an automatic 24-hour hardware lock on the client IP and machine.": "টানা ৫ বার ভুল পাসওয়ার্ড দিলে উক্ত ক্লায়েন্ট আইপি ও মেশিনের জন্য ২৪ ঘণ্টার স্বয়ংক্রিয় লকআউট কার্যকর হয়।",
  "Binary Integrity Auto-Ban": "বাইনারি সততা ও অটো-ব্যান",
  "The server compares the executable SHA-256 hash against published releases, auto-banning cracked binaries.": "সার্ভার বাইনারির SHA-256 হ্যাশ যাচাই করে ক্র্যাকড বা পরিবর্তিত ফাইল শনাক্ত হলে সরাসরি অ্যাকাউন্ট ব্যান করে দেয়।",
  "Developer-Side Hardening Steps": "ডেভেলপারদের জন্য সিকিউরিটি হার্ডেনিং গাইডলাইন",
  "User Authentication & 24h Lockout Engine": "ইউজার অথেন্টিকেশন ও ২৪ ঘণ্টা লকআউট ইঞ্জিন",
  "Habit Auth protects client accounts with automated brute-force defense, PBKDF2 password hashing, dynamic monotonic nonces, and asymmetric Ed25519 session tokens.": "হ্যাবিট অথ পিবিকেডিএফ২ পাসওয়ার্ড হ্যাশিং ও Ed25519 সেশন টোকেনের মাধ্যমে সর্বোচ্চ ক্লায়েন্ট সুরক্ষা নিশ্চিত করে।",
  "24-Hour Brute-Force Lockout Defense": "২৪-ঘণ্টা ব্রুট-ফোর্স লকআউট প্রতিরক্ষা",
  "Automated attack suppression for client software": "ক্লায়েন্ট সফটওয়্যারের জন্য স্বয়ংক্রিয় আক্রমণ দমন ব্যবস্থা",
  "Credential stuffing and automated dictionary bots are the #1 attack vector against desktop software licenses. Habit Auth deploys an intelligent rate-limiter keyed on a triple composite identifier: (Username + Client IP + Machine HWID).": "ক্রিডেনশিয়াল স্টাফিং ও বট অ্যাটাক প্রতিহত করতে হ্যাবিট অথ (ইউজারনেম + ক্লায়েন্ট আইপি + মেশিন HWID) সমন্বয়ে স্মার্ট রেট-লিমিটিং প্রয়োগ করে।",
  "Threshold": "লকআউট সীমা",
  "5 Failed Attempts": "৫ বার ভুল পাসওয়ার্ড চেষ্টা",
  "Within any rolling 15-minute window": "যেকোনো ১৫ মিনিটের মধ্যে",
  "Lockout Penalty": "লকআউটের মেয়াদ",
  "Strict 24 Hours": "কঠোর ২৪ ঘণ্টা",
  "All login attempts rejected instantly": "সকল লগইন চেষ্টা তাৎক্ষণিক প্রত্যাখ্যাত হবে",
  "Override Authority": "ম্যানুয়াল আনলক ক্ষমতা",
  "Admin Dashboard": "অ্যাডমিন ড্যাশবোর্ড",
  "Developers can unlock users manually": "ডেভেলপাররা চাইলে ড্যাশবোর্ড থেকে ইউজার আনলক করতে পারেন",
  "429 / 403 LOCKOUT RESPONSE PAYLOAD": "৪২৯ / ৪০৩ লকআউট রেসপন্স পে-লোড",
  "Signed Session Tokens & Cryptographic Structure": "সাইনড সেশন টোকেন ও ক্রিপ্টোগ্রাফিক স্ট্রাকচার",
  "Tamper-proof asymmetric Ed25519 authorization": "ট্যাম্পার-প্রুফ অ্যাসিমেট্রিক Ed25519 অথোরাইজেশন",
  "Upon successful authentication, Habit Auth returns a high-entropy signed session token. The token contains the subscriber's permissions, duration expiration, and machine fingerprint, signed with your server's private Ed25519 key.": "সফল লগইনে হ্যাবিট অথ একটি উচ্চ-এনট্রপি ডিজিটাল সাইনড টোকেন প্রদান করে, যা সাবস্ক্রিপশন মেয়াদ ও HWID বহন করে।",
  "Zero-Replay Nonce": "জিরো-রিপ্লে ননস",
  "Tokens include a monotonic cryptographic nonce. Packet sniffers cannot replay cached tokens to fake a successful session.": "টোকেনে একটি মনোটোনিক ননস থাকে। প্যাকেট স্নিফার দিয়ে কেউ পুরনো টোকেন ব্যবহার করে ভুয়া লগইন করতে পারে না।",
  "Hardware Lock Hash": "হার্ডওয়্যার লক হ্যাশ",
  "The token embeds the SHA-256 HWID hash. If copied to another computer, validation fails instantly.": "টোকেনে SHA-256 HWID এমবেড থাকে। অন্য কম্পিউটারে কপি করলে ভ্যালিডেশন তাৎক্ষণিক ফেইল করে।",
  "Dynamic Expiration": "ডাইনামিক মেয়াদ",
  "Standard sessions expire after 12 hours unless extended by recurring background heartbeat ping.": "সাধারণ সেশন ১২ ঘণ্টা পর মেয়াদোত্তীর্ণ হয়, যদি না ব্যাকগ্রাউন্ড হার্টবিট দিয়ে বর্ধিত করা হয়।",
  "Session Lifecycle & Heartbeat Validation": "সেশন লাইফসাইকেল ও হার্টবিট ভ্যালিডেশন",
  "To maintain protection against mid-game cracks, memory injection, and concurrent unauthorized logins, your application should maintain a periodic heartbeat check:": "মেমরি ইনজেকশন ও অবৈধ একাউন্ট শেয়ারিং ঠেকাতে অ্যাপ্লিকেশন থেকে নিয়মিত হার্টবিট পিং করা উচিত:",
  "Login Init:": "লগইন সূচনা:",
  "Client sends credentials + local HWID to": "ক্লায়েন্ট ক্রেডেনশিয়াল ও লোকাল HWID পাঠায়:",
  "Secure Memory Cache:": "নিরাপদ মেমরি ক্যাশ:",
  "SDK stores the token in an encrypted memory structure (e.g. SecureString).": "এসডিকে টোকেনটি এনক্রিপ্টেড মেমরিতে সংরক্ষণ করে।",
  "Background Heartbeat:": "ব্যাকগ্রাউন্ড হার্টবিট:",
  "Every 20 minutes, SDK calls": "প্রতি ২০ মিনিট পর পর এসডিকে কল করে:",
  "with current session token.": "বর্তমান সেশন টোকেন সহকারে।",
  "Killswitch Trip:": "কিলসুইচ ট্রিগার:",
  "If developer revokes user in dashboard or HWID changes, client process terminates immediately.": "ড্যাশবোর্ড থেকে ইউজার বাতিল করলে বা HWID পরিবর্তিত হলে অ্যাপ তৎক্ষণাৎ বন্ধ হয়ে যাবে।",
  "Licenses & Machine HWID Binding": "লাইসেন্স কি এবং HWID বাইন্ডিং ইঞ্জিন",
  "Permanently lock license keys to the user's physical machine hardware to prevent key sharing, multi-machine leakage, and illicit resale.": "লাইসেন্স কি ব্যবহারকারীর শারীরিক হার্ডওয়্যারে স্থায়ীভাবে লক করে কি-শেয়ারিং ও অবৈধ বিক্রি বন্ধ করুন।",
  "Multi-Sensor HWID Fingerprinting Algorithm": "মাল্টি-সেন্সর HWID ফিঙ্গারপ্রিন্টিং অ্যালগরিদম",
  "Triple-layer physical hardware hashing": "ত্রি-স্তরযুক্ত ফিজিক্যাল হার্ডওয়্যার হ্যাশিং",
  "Simple auth systems rely on MAC address or IP address, which are trivially bypassed by VPNs or MAC spoofers. Habit Auth probes deep kernel WMI and IOCTL interfaces to query 3 independent physical hardware sensors:": "সাধারণ ম্যাক বা আইপি বাইন্ডিং ভিপিএন দিয়ে বাইপাস করা যায়। হ্যাবিট অথ কার্নেল লেভেল থেকে ৩টি স্বাধীন হার্ডওয়্যার সেন্সর রিড করে:",
  "Sensor 1": "সেন্সর ১",
  "Motherboard BIOS UUID": "মাদারবোর্ড BIOS UUID",
  "Queries the system manufacturer UUID from SMBIOS table (Win32_ComputerSystemProduct.UUID).": "এসএমবায়োস টেবিল থেকে সিস্টেম প্রস্তুতকারক ইউইউআইডি রিড করে।",
  "Sensor 2": "সেন্সর ২",
  "Processor Silicon ID": "প্রসেসর সিলিকন আইডি",
  "Queries CPU features and hardware stepping via CPUID assembler register (Win32_Processor.ProcessorId).": "সিপিইউ ফিচার ও প্রসেসর রেজিস্টার থেকে অনন্য প্রসেসর আইডি সংগ্রহ করে।",
  "Sensor 3": "সেন্সর ৩",
  "Primary Disk Serial": "প্রাইমারি ডিস্ক সিরিয়াল",
  "Reads physical storage drive serial from SMART IOCTL controller (Win32_DiskDrive.SerialNumber).": "স্মার্ট IOCTL কন্ট্রোলার থেকে ফিজিক্যাল স্টোরেজ ড্রাইভের আসল সিরিয়াল রিড করে।",
  "FINAL COMBINED COMPOSITE HASH": "চূড়ান্ত সমন্বিত কম্পোজিট হ্যাশ",
  "Resulting client fingerprint:": "তৈরিকৃত ক্লায়েন্ট ফিঙ্গারপ্রিন্ট:",
  "Hardware ID Reset Policy & Cooldown Engine": "হার্ডওয়্যার আইডি রিসেট পলিসি ও কুলডাউন ইঞ্জিন",
  "Balance user convenience with fraud prevention": "ইউজারের সুবিধা ও নিরাপত্তা সুরক্ষার সঠিক সমন্বয়",
  "When legitimate users upgrade their motherboard, replace an SSD, or reinstall Windows, their HWID fingerprint will change. Habit Auth offers two reset pathways:": "ইউজার পিসি আপগ্রেড বা উইন্ডোজ রি-ইন্সটল করলে HWID বদলে যেতে পারে। হ্যাবিট অথে রয়েছে ২টি রিসেট সুবিধা:",
  "Automatic Cooldown Resets": "স্বয়ংক্রিয় কুলডাউন রিসেট",
  "Configure a rolling cooldown in the Dashboard (e.g. 1 reset every 7 days). Users can self-reset their HWID through the client login screen without contacting support.": "ড্যাশবোর্ড থেকে কুলডাউন সেট করুন (যেমন ৭ দিনে ১ বার)। ইউজার নিজেই সাপোর্ট ছাড়া লগইন স্ক্রিন থেকে HWID রিসেট করতে পারবে।",
  "Admin Dashboard 1-Click Reset": "অ্যাডমিন ড্যাশবোর্ড ১-ক্লিক রিসেট",
  "Admins can view any user or license key in the dashboard and click Reset HWID. The previous binding is instantly unlinked and rebinds to the next machine that signs in.": "অ্যাডমিন যেকোনো কি সিলেক্ট করে 'Reset HWID' ক্লিকে পুরনো বাইন্ডিং মুছে পরবর্তী মেশিনের জন্য উন্মুক্ত করতে পারেন।",
  "Reset HWID": "HWID রিসেট",
  "License Duration Tiers & Key Formatting": "লাইসেন্স মেয়াদের স্তর ও কি ফরম্যাট",
  "Habit Auth license keys follow the standard 20-character format: HABIT-XXXX-XXXX-XXXX-XXXX. Keys are generated with an embedded Luhn checksum to catch typing errors instantly before sending an API request.": "হ্যাবিট অথের কি ২০ অক্ষরের স্ট্যান্ডার্ড ফরম্যাট (HABIT-XXXX-XXXX-XXXX-XXXX) মেনে চলে। টাইপিং ভুল রোধে এতে লুহন চেকসাম অন্তর্ভুক্ত রয়েছে।",
  "1 Day / 3 Days": "১ দিন / ৩ দিন",
  "Trial & Day Pass": "ট্রায়াল ও ডে পাস",
  "Auto-expires 24/72 hours from first activation.": "প্রথম অ্যাক্টিভেশন থেকে ২৪ বা ৭২ ঘণ্টা পর স্বয়ংক্রিয়ভাবে মেয়াদ শেষ হয়।",
  "7 Days / 30 Days": "৭ দিন / ৩০ দিন",
  "Subscription": "সাবস্ক্রিপশন",
  "Standard recurring monthly tier with renewal grace period.": "মাসিক সাবস্ক্রিপশন প্ল্যান যাতে রিনিউ করার গ্রেস পিরিয়ড থাকে।",
  "Lifetime": "লাইফটাইম (আজীবন)",
  "Permanent Pass": "স্থায়ী পারমিট",
  "Never expires. Bound permanently to registered machine HWID.": "কখনই মেয়াদ শেষ হবে না। নির্দিষ্ট ডিভাইসের সাথে স্থায়ীভাবে আবদ্ধ।",
  "Paused / Frozen": "পজ / ফ্রিজড অবস্থা",
  "Maintenance Mode": "মেইনটেন্যান্স মোড",
  "Can be frozen during developer updates without user time loss.": "সফটওয়্যার আপডেটের সময় ব্যবহারকারীর সাবস্ক্রিপশন সময় না কেটে সাময়িক ফ্রিজ রাখা যায়।",
  "Binary Integrity Verification & Auto-Ban": "বাইনারি সততা যাচাই ও অটো-ব্যান",
  "Detect bytecode modifications, memory patching, and DLL injectors in real time. Automatically blacklist offending hardware IDs before cracks can be released.": "বাইনারি কোড পরিবর্তন, মেমরি প্যাচিং বা ডিএলএল ইনজেকশন রিয়েল-টাইমে শনাক্ত করে আক্রমণকারী হার্ডওয়্যার ব্ল্যাকলিস্ট করুন।",
  "Runtime SHA-256 Hash Matching & Auto-Ban": "রানটাইম SHA-256 হ্যাশ ম্যাচিং ও অটো-ব্যান",
  "Zero tolerance for modified client executables": "পরিবর্তিত বা ক্র্যাকড এক্সিকিউটেবলের জন্য জিরো টলারেন্স নীতি",
  "When you publish a new version of your software, you register its SHA-256 checksum in the Habit Auth dashboard. Every SDK authentication call reads its own executable file on disk, generates a SHA-256 digest, and sends it encrypted inside the login request.": "নতুন সফটওয়্যার প্রকাশের সময় ড্যাশবোর্ডে এর SHA-256 হ্যাশ রেজিস্টার করুন। প্রতিবার লগইনে এসডিকে ফাইলটি অডিট করে হ্যাশ যাচাই করে।",
  "Step 1: Checksum Probe": "ধাপ ১: চেকসাম যাচাই",
  "Client Reads PE Image": "ক্লায়েন্ট PE ফাইল রিড করে",
  "Calculates SHA-256 over entire binary": "সম্পূর্ণ বাইনারির SHA-256 নির্ণয় করে",
  "Step 2: Server Audit": "ধাপ ২: সার্ভার অডিট",
  "Database Hash Compare": "ডাটাবেজের সাথে হ্যাশ তুলনা",
  "Matches registered build in dashboard": "ড্যাশবোর্ডের অফিশিয়াল বিল্ডের সাথে মেলায়",
  "Step 3: Mismatch Response": "ধাপ ৩: অমিল পেলে রেসপন্স",
  "Permanent Auto-Ban": "স্থায়ী অটো-ব্যান",
  "HWID blacklisted + user suspended": "ডিভাইস HWID ব্ল্যাকলিস্ট ও ইউজার ব্যান",
  "Real-Time Security Incident Webhook Alerts": "রিয়েল-টাইম সিকিউরিটি ওয়েবহুক অ্যালার্ট",
  "Immediate push notifications to Discord or Slack": "ডিসকর্ড বা স্ল্যাকে তাৎক্ষণিক পুশ নোটিফিকেশন",
  "Whenever an anti-tamper violation occurs, Habit Auth immediately delivers an automated rich notification payload to your private webhook channel:": "যখনই কোনো সিকিউরিটি ভায়োলেশন ঘটে, হ্যাবিট অথ তাৎক্ষণিকভাবে আপনার ডিসকর্ড চ্যানেলে এলার্ট পাঠায়:",
  "Memory & Anti-Debugging Developer Best Practices": "মেমরি ও অ্যান্টি-ডিবাগিং ডেভেলপার গাইড",
  "Complement Habit Auth's server protection with these essential client-side defensive techniques:": "হ্যাবিট অথের সার্ভার সুরক্ষার পাশাপাশি আপনার অ্যাপে নিচের ডিফেন্সগুলো যুক্ত করুন:",
  "PEB Debugger Flag:": "PEB ডিবাগার ফ্ল্যাগ:",
  "Continuously check IsDebuggerPresent() and CheckRemoteDebuggerPresent() on worker threads.": "ওয়ার্কার থ্রেডে IsDebuggerPresent() চেক করে ডিবাগার শনাক্ত করুন।",
  "Hide Threads:": "থ্রেড হাইড করা:",
  "Call NtSetInformationThread(ThreadHideFromDebugger) to crash debuggers attaching via x64dbg.": "x64dbg বা রিভার্সিং টুলস রুখতে NtSetInformationThread কল করুন।",
  "VirtualProtect Integrity:": "ভার্চুয়াল প্রটেক্ট সততা:",
  "Verify that code sections (.text) remain marked PAGE_EXECUTE_READ and haven't been patched with PAGE_EXECUTE_READWRITE.": "কোড সেকশন (.text) মেমরিতে প্যাচ বা মডিফাই হয়েছে কিনা যাচাই করুন।",
  "Obfuscate Strings:": "স্ট্রিং অবফাসকেট করুন:",
  "Use compile-time XOR string encryption so that your App ID and endpoint URLs cannot be scraped with basic strings commands.": "কম্পাইল-টাইম XOR এনক্রিপশন ব্যবহার করুন যেন App ID সহজেই রিড করা না যায়।",
  "Token Validation Gate (Startup Enforcer)": "টোকেন ভ্যালিডেশন গেট (স্টার্টআপ এনফোর্সার)",
  "Execute instant cryptographic token handshakes at program startup to guarantee that only valid, paid, and un-revoked users can run your application.": "অ্যাপ চালুর শুরুতেই ক্রিপ্টোগ্রাফিক টোকেন হ্যান্ডশেক সম্পন্ন করে অননুমোদিত ইউজারদের অ্যাক্সেস ব্লক করুন।",
  "Startup Validation Handshake Flow": "স্টার্টআপ ভ্যালিডেশন হ্যান্ডশেক প্রবাহ",
  "Sub-35ms cryptographic verification sequence": "৩৫ মিলিসেকেন্ডের দ্রুততম ডিজিটাল ভেরিফিকেশন",
  "Rather than forcing the user to type their username and password every time your software boots, the SDK stores a secure token locally and runs a fast handshake before showing your main application window:": "প্রতিবার পাসওয়ার্ড টাইপ করানোর বদলে এসডিকে স্থানীয় এনক্রিপ্টেড টোকেন দিয়ে ব্যাকগ্রাউন্ডে যাচাই সম্পন্ন করে:",
  "Local Token Probe": "১. লোকাল টোকেন যাচাই",
  "SDK checks for cached signed session token in secure local store.": "এসডিকে লোকাল স্টোরেজ থেকে সেশন টোকেন রিড করে।",
  "Server Ping": "২. সার্ভার পিং",
  "Posts token + current HWID + nonce to /api/v1/client/validate-token.": "টোকেন, HWID এবং ননস সার্ভারে পাঠায়।",
  "Asymmetric Signature": "৩. অ্যাসিমেট্রিক সিগনেচার",
  "Server validates account and returns Ed25519 digitally signed verification challenge.": "সার্ভার তথ্য যাচাই করে Ed25519 সাইনড ডিজিটাল অনুমোদন দেয়।",
  "Gate Unlock": "৪. গেট আনলক",
  "Client SDK verifies signature against public key, then initializes application UI.": "এসডিকে সিগনেচার নিশ্চিত করে মূল সফটওয়্যার উইন্ডো চালু করে।",
  "Signed Offline Cryptographic Leases": "সাইনড অফলাইন ক্রিপ্টোগ্রাফিক লিজ",
  "Support users traveling or in air-gapped environments": "ভ্রমণরত বা ইন্টারনেটবিহীন পরিবেশের গ্রাহকদের জন্য অফলাইন সুবিধা",
  "If your software needs to support offline operation, Habit Auth can issue a signed offline lease token. The lease embeds a strict hardware fingerprint and a cryptographically signed expiration timestamp (e.g. 72 hours). The client SDK verifies the Ed25519 signature locally without calling home until the lease expires.": "ইন্টারনেট ছাড়া সফটওয়্যার ব্যবহারের জন্য হ্যাবিট অথ সাইনড অফলাইন লিজ টোকেন প্রদান করে যা মেয়াদ শেষ না হওয়া পর্যন্ত সক্রিয় থাকে।",
  "Startup Guard Implementation (C# .NET)": "স্টার্টআপ গার্ড ইমপ্লিমেন্টেশন কোড (C# .NET)",
  "Auto-Updater Helper Engine": "অটো-আপডেটার হেল্পার ইঞ্জিন",
  "Ensure 100% of your user base runs your latest patched binaries. Deploy urgent security hotfixes, deliver new features, and force cracked older versions to shut down.": "আপনার সকল গ্রাহক যেন সর্বশেষ প্যাচ করা ভার্সন ব্যবহার করে তা নিশ্চিত করুন এবং পুরনো ভার্সন বন্ধ করে দিন।",
  "Version Check Handshake API": "ভার্সন চেক হ্যান্ডশেক API",
  "Real-time semver comparison and CDN routing": "রিয়েল-টাইম ভার্সন তুলনা ও সিডিএন ডেলিভারি",
  "At application launch, your software calls the version check endpoint. The Habit Auth backend checks the active release version configured in your application settings and returns update availability, force update flags, and direct CDN binary URLs.": "অ্যাপ চালুর সময়েই ভার্সন চেক এন্ডপয়েন্টে কল করে আপডেট ও ডিরেক্ট ডাউনলোড লিংক পাওয়া যায়।",
  "Force Update & Delivery Pipeline": "ফোর্স আপডেট ও ডেলিভারি পাইপলাইন",
  "How Habit Auth enforces mandatory vs optional software rollouts:": "হ্যাবিট অথ কীভাবে বাধ্যতামূলক ও ঐচ্ছিক আপডেট পরিচালনা করে:",
  "1. Version Check": "১. ভার্সন চেক",
  "Application queries /check-update on initial boot before loading any sensitive resources.": "অ্যাপ চালু হওয়ার সময়েই /check-update থেকে আপডেট স্ট্যাটাস জেনে নেয়।",
  "2. Force Gate": "২. ফোর্স গেট",
  "If forceUpdate: true, the client disables the main UI and renders an un-dismissible update prompt.": "যদি forceUpdate: true থাকে, তবে আপডেট না করা পর্যন্ত মূল উইন্ডো বন্ধ থাকে।",
  "3. SHA-256 Audit": "৩. SHA-256 অডিট",
  "Downloaded file bytes are verified against the response sha256 hash before replacing local disk files.": "ডাউনলোড করা ফাইলের হ্যাশ সার্ভার তথ্যের সাথে মিলিয়ে নিশ্চিত করা হয়।",
  "4. Atomic Swap": "৪. অটোমিক সোয়াপ",
  "A companion Updater.exe terminates the old PID, replaces the executable, and restarts the app.": "Updater.exe পুরনো প্রসেস বন্ধ করে নতুন ফাইল প্রতিস্থাপন করে অ্যাপ পুনরায় চালু করে।",
  "Desktop Client Integration Snippet (C# .NET)": "ডেস্কটপ ক্লায়েন্ট ইন্টিগ্রেশন কোড (C# .NET)",
  "In-App Support Tickets API": "ইন-অ্যাপ সাপোর্ট টিকিট API",
  "Allow users to submit bug reports and support tickets directly from inside your software interface, synced in real-time with your Habit Auth developer dashboard.": "ব্যবহারকারীরা সফটওয়্যারের ভেতর থেকেই বাগ রিপোর্ট বা সহায়তা চাইতে পারেন যা রিয়েল-টাইমে ড্যাশবোর্ডে সিঙ্ক হয়।",
  "In-App Ticket Endpoints Reference": "ইন-অ্যাপ টিকিট এন্ডপয়েন্ট রেফারেন্স",
  "Complete REST interface for client-embedded helpdesks": "ক্লায়েন্ট হেল্পডেস্কের জন্য সম্পূর্ণ REST ইন্টারফেস",
  "Opens a new support ticket attached to the authenticated user's session.": "লগইন করা ইউজারের সেশন সহকারে নতুন সাপোর্ট টিকিট ওপেন করে।",
  "Fetches active and resolved ticket threads for the current client user.": "বর্তমান ইউজারের সকল সক্রিয় ও সমাধানকৃত টিকিট থ্রেড লোড করে।",
  "Appends a user reply message to an existing open ticket thread.": "চলমান কোনো টিকিটে ব্যবহারকারীর নতুন রিপ্লাই মেসেজ যুক্ত করে।",
  "Embedded Helpdesk Architecture": "এমবেডেড হেল্পডেস্ক আর্কিটেকচার",
  "Traditional external ticketing systems force users into web browsers, email threads, or public Discord channels where angry users post complaints publicly. In-app tickets keep communications private, focused, and automated:": "ইন-অ্যাপ টিকিটের মাধ্যমে পাবলিক ডিসকর্ডে সমস্যার ভিড় না জমিয়ে ১-অন-১ গোপনীয় ও সুরক্ষিত সহায়তা দেওয়া যায়:",
  "Silent Hardware Diagnostics": "নীরব হার্ডওয়্যার ডায়াগনস্টিকস",
  "The SDK automatically attaches OS version, GPU model, RAM, and App Version to the ticket payload so you don't have to ask the customer.": "টিকিট সাবমিট করার সময় অপারেটিং সিস্টেম, র‌্যাম ও জিপিইউ তথ্য স্বয়ংক্রিয়ভাবে সংযুক্ত হয়ে যায়।",
  "Zero Discord Drama": "জিরো ডিসকর্ড ঝামেলা",
  "Bugs and support issues are handled 1-on-1 rather than having public channels flooded with repetitive questions.": "সমস্যাগুলো সরাসরি ড্যাশবোর্ড থেকে সমাধান করা যায়, ফলে ডিসকর্ড কমিউনিটি পরিচ্ছন্ন থাকে।",
  "Live Discord Alerts & Dashboard Sync": "লাইভ ডিসকর্ড অ্যালার্ট ও ড্যাশবোর্ড সিঙ্ক",
  "Real-time synchronization with developer tools": "ডেভেলপার টুলস ও ডিসকর্ডের সাথে তাৎক্ষণিক সমন্বয়",
  "When a client creates a ticket, it instantly pops up in your Habit Auth developer dashboard with an unread badge. Simultaneously, your support Discord channel receives a webhook embed containing the user's issue and a 1-click jump link to reply directly from your web dashboard.": "ইউজার টিকিট ওপেন করলে ড্যাশবোর্ডে লাল ব্যাজ দৃশ্যমান হয় এবং ডিসকর্ড চ্যানেলে ১-ক্লিক রিপ্লাই লিংক সহ নোটিফিকেশন পৌঁছে যায়।",
  "Multi-Language SDK Showcase": "মাল্টি-ল্যাঙ্গুয়েজ SDK শোকেস",
  "Zero-dependency client libraries for C#, C++, Python, Node.js, and raw REST HTTP.": "C#, C++, Python, Node.js এবং REST HTTP-এর জন্য জিরো-ডিপেন্ডেন্সি ক্লায়েন্ট লাইব্রেরি।",
  "Supported Platforms & Code Viewer": "সাপোর্টেড প্ল্যাটফর্ম ও কোড ভিউয়ার",
  "Cryptographic Verification": "ক্রিপ্টোগ্রাফিক ভেরিফিকেশন",
  "Complete REST API Specification": "সম্পূর্ণ REST API স্পেসিফিকেশন",
  "Direct HTTP API endpoints for integrating custom game engines, microservices, and web applications.": "কাস্টম গেম ইঞ্জিন, মাইক্রোসার্ভিস ও ওয়েব অ্যাপ্লিকেশনের জন্য সরাসরি HTTP API এন্ডপয়েন্ট।",
  "Authenticates user account credentials, performs hardware fingerprint verification, checks 24h brute-force lockout, and issues a session token.": "ইউজার অ্যাকাউন্ট ক্রেডেনশিয়াল ও হার্ডওয়্যার যাচাই করে ২৪ ঘণ্টা লকআউট পরীক্ষা শেষে সেশন টোকেন ইস্যু করে।"
}
};

function translateDocString(str, lang) {
  if (!str || typeof str !== 'string' || lang === 'en') return str;
  const dict = DOCS_TRANSLATIONS[lang];
  if (dict && dict[str]) return dict[str];
  return str;
}


export default function Documentation({ onBack, onOpenDashboard, onNavigate, initialTab, user, onOpenLogin }) {
  const { currentLang, setLanguage, languages, currentLanguageObj, t } = useLanguage();

  const [activeTab, setActiveTab] = useState(initialTab || 'intro');
  const [activeCodeLang, setActiveCodeLang] = useState('csharp');
  const [copiedKey, setCopiedKey] = useState('');
  const [sdkViewMode, setSdkViewMode] = useState('source');
  const [searchQuery, setSearchQuery] = useState('');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('habit_theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('habit_theme', nextTheme);
  };

  // Collapsible Nav Groups
  const [openGroups, setOpenGroups] = useState({
    gettingStarted: true,
    security: true,
    sdk: true,
    api: true,
    tools: true
  });

  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const langDropdownRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setLangDropdownOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset scroll position and active heading on tab change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    const toc = tableOfContents[activeTab];
    if (toc && toc.length > 0) {
      setActiveHeading(toc[0].id);
    }
  }, [activeTab]);

  const toggleGroup = (groupKey) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(''), 2200);
  };

  const dt = DOCS_I18N[currentLang] || DOCS_I18N[language] || DOCS_I18N.en;

  // Structured Navigation Groups
  const navGroups = useMemo(() => [
    {
      key: 'gettingStarted',
      title: dt.gettingStarted,
      items: [
        { id: 'intro', label: dt.intro, icon: Sparkles, badge: dt.overview },
        { id: 'getting-started', label: dt.quickstart, icon: Zap, badge: dt.core }
      ]
    },
    {
      key: 'security',
      title: dt.coreSecurity,
      items: [
        { id: 'security-hardening', label: dt.securityAntiCrack, icon: Shield, badge: dt.defense },
        { id: 'auth-sessions', label: dt.userAuth, icon: Lock },
        { id: 'licenses-hwid', label: dt.licensesHwid, icon: Key },
        { id: 'anti-tamper', label: dt.binaryIntegrity, icon: AlertTriangle },
        { id: 'token-validation', label: dt.tokenValidation, icon: KeyRound }
      ]
    },
    {
      key: 'sdk',
      title: dt.sdksLibraries,
      items: [
        { id: 'sdk-libraries', label: dt.multiLangSdks, icon: Code, badge: dt.sevenLangs },
        { id: 'auto-updater', label: dt.autoUpdater, icon: Download },
        { id: 'support-tickets', label: dt.supportTickets, icon: LifeBuoy }
      ]
    },
    {
      key: 'api',
      title: dt.apiReference,
      items: [
        { id: 'rest-api', label: dt.completeRestApi, icon: Terminal, badge: dt.v1 }
      ]
    }
  ], [dt, currentLang]);

    // Table of Contents map for "On this page" right sidebar
  const tableOfContents = useMemo(() => ({
    intro: [
      { id: 'intro-title', label: dt.introTitle || 'Authentication made for developers' },
      { id: 'what-is-habit-auth', label: dt.whatIsTitle || 'ⓘ What is Habit Auth?' },
      { id: 'what-can-it-be-used-for', label: dt.whatCanBeUsedTitle || '{dt.whatCanBeUsedTitle || "What can Habit Auth be used for?"}' },
      { id: 'which-would-you-focus', label: dt.whichFocusTitle || '{dt.whichFocusTitle || "Which would you like to focus on?"}' }
    ],
    'getting-started': [
      { id: 'gs-title', label: dt.gsTitle || 'Quickstart & Core Architecture' },
      { id: 'gs-steps', label: dt.step1Title ? (dt.step1Title.slice(3) + ' & Setup') : '3-Step Setup Process' },
      { id: 'gs-credentials', label: dt.credsTitle || '{dt.credsTitle || "Understanding Application Credentials"}' },
      { id: 'gs-crypto', label: dt.cryptoTitle || 'Ed25519 Cryptographic Signatures' }
    ],
    'security-hardening': [
      { id: 'sec-title', label: dt.secTitle || 'Security Best Practices' },
      { id: 'sec-philosophy', label: dt.secPhilTitle || 'Authentication vs. Obfuscation' },
      { id: 'sec-protections', label: dt.builtinProtTitle || 'Built-in Cryptographic Protections' }
    ],
    'auth-sessions': [
      { id: 'auth-title', label: dt.authTitle || 'User Authentication System' },
      { id: 'auth-lockout', label: dt.lockoutHeader || '24-Hour Brute-Force Lockout' },
      { id: 'auth-token', label: 'Signed Session Tokens' },
      { id: 'auth-lifecycle', label: 'Session Lifecycle & Heartbeat' }
    ],
    'licenses-hwid': [
      { id: 'lic-title', label: dt.licTitle || 'License Keys & HWID Binding' },
      { id: 'lic-algorithm', label: dt.algoTitle || 'Multi-Sensor HWID Fingerprinting' },
      { id: 'lic-reset', label: 'Hardware ID Reset Policy' },
      { id: 'lic-tiers', label: 'License Duration Tiers' }
    ],
    'anti-tamper': [
      { id: 'tamper-title', label: dt.tamperTitle || 'Binary Integrity Verification' },
      { id: 'tamper-autoban', label: dt.autobanTitle || 'Auto-Ban Defense Engine' },
      { id: 'tamper-alerts', label: 'Real-Time Webhook Alerts' },
      { id: 'tamper-hardening', label: 'Memory & Anti-Debug Practices' }
    ],
    'token-validation': [
      { id: 'gate-title', label: dt.gateTitle || 'Token Validation (Startup Gate)' },
      { id: 'gate-flow', label: 'Validation Handshake Flow' },
      { id: 'gate-offline', label: 'Signed Offline Leases' },
      { id: 'gate-code', label: 'Startup Guard Implementation' }
    ],
    'auto-updater': [
      { id: 'update-title', label: dt.updaterTitle || 'Auto-Updater Helper Engine' },
      { id: 'update-check', label: 'Version Check Handshake API' },
      { id: 'update-flow', label: 'Force Update & Delivery Flow' },
      { id: 'update-code', label: 'Desktop Client Integration' }
    ],
    'support-tickets': [
      { id: 'support-title', label: dt.supportTitle || 'Support Tickets API' },
      { id: 'support-endpoints', label: 'In-App Ticket Endpoints' },
      { id: 'support-architecture', label: 'Embedded Helpdesk Architecture' },
      { id: 'support-webhooks', label: 'Discord Alerts & Dashboard Sync' }
    ],
    'sdk-libraries': [
      { id: 'sdk-title', label: dt.sdkShowcaseTitle || 'Multi-Language SDK Showcase' },
      { id: 'sdk-languages', label: 'Supported Platforms & Code Viewer' }
    ],
    'rest-api': [
      { id: 'api-title', label: dt.restApiTitle || 'Complete REST API Reference' },
      { id: 'api-login', label: 'POST /client/login' },
      { id: 'api-license', label: 'POST /client/activate-license' },
      { id: 'api-update', label: 'POST /client/check-update' }
    ]
  }), [dt, currentLang]);

  const currentToc = tableOfContents[activeTab] || [];

  // Filter items if searching
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase();
    return navGroups.map(group => {
      const matchingItems = group.items.filter(item => 
        item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
      return { ...group, items: matchingItems };
    }).filter(group => group.items.length > 0);
  }, [searchQuery, navGroups]);

  const scrollToHeading = (id) => {
    setActiveHeading(id);
    const container = scrollContainerRef.current;
    if (!container) return;
    const target = container.querySelector(`#${id}`);
    if (target) {
      isScrollingRef.current = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);
    }
  };

  const handleScroll = () => {
    if (isScrollingRef.current) return;
    const container = scrollContainerRef.current;
    if (!container || !currentToc.length) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // 1. Scrolled to or near bottom (within 70px margin of error): ALWAYS highlight the last TOC item!
    if (scrollHeight - scrollTop - clientHeight <= 70) {
      setActiveHeading(currentToc[currentToc.length - 1].id);
      return;
    }

    // 2. Near top (within 40px): Highlight first TOC item
    if (scrollTop < 40) {
      setActiveHeading(currentToc[0].id);
      return;
    }

    // 3. Compare relative element positions using getBoundingClientRect
    const containerRect = container.getBoundingClientRect();
    const triggerOffset = 180;

    for (let i = currentToc.length - 1; i >= 0; i--) {
      const item = currentToc[i];
      const el = container.querySelector(`#${item.id}`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const relativeTop = elRect.top - containerRect.top;
        if (relativeTop <= triggerOffset) {
          setActiveHeading(item.id);
          return;
        }
      }
    }

    setActiveHeading(currentToc[0].id);
  };

  
  // ── AUTO-TRANSLATE ALL TEXT NODES A TO Z IN THE WORKSPACE ──
  useEffect(() => {
    if (currentLang === 'en') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const translateNode = (node) => {
      if (node.nodeType === 3) { // Text node
        const val = node.nodeValue;
        if (!val || !val.trim()) return;
        const trimmed = val.trim();
        const translated = translateDocString(trimmed, currentLang);
        if (translated && translated !== trimmed) {
          node.nodeValue = val.replace(trimmed, translated);
        }
      } else if (node.nodeType === 1) { // Element node
        // Never translate code, pre, or technical payloads
        if (['PRE', 'CODE', 'INPUT', 'TEXTAREA'].includes(node.tagName)) return;
        node.childNodes.forEach(child => translateNode(child));
      }
    };

    // Run translation pass
    translateNode(container);

    // Also watch for DOM updates
    const observer = new MutationObserver((mutations) => {
      observer.disconnect();
      translateNode(container);
      observer.observe(container, { childList: true, subtree: true });
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [currentLang, activeTab]);

  return (
    <div className="docs-shell">

      {/* ── 1. FIXED TOP DOCS NAVBAR (KEYAUTH STYLE) ─────────────────── */}
      <header className="docs-header">
        <div className="docs-header-left">
          {/* Mobile Toggle Button */}
          <button 
            className="docs-icon-btn"
            style={{ display: 'none' }}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            title="Toggle Navigation Menu"
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo & Brand */}
          <div className="docs-brand" onClick={onBack}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.45)',
              color: '#ffffff'
            }}>
              <Shield size={18} />
            </div>
            <span className="docs-brand-name">Habit Auth</span>
            <span className="docs-brand-badge">{dt.brandBadge || 'Docs v1.4'}</span>
          </div>

          {/* Visit Main Website link */}
          <button onClick={onBack} className="docs-visit-site">
            {dt.visitSite || 'Visit Our Website'} <ExternalLink size={12} />
          </button>
        </div>

        {/* Center Quick Search (Ctrl+K) */}
        <div className="docs-search-bar">
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            ref={searchInputRef}
            type="text"
            className="docs-search-input"
            placeholder={dt.searchPlaceholder || "Search documentation... (Ctrl+K)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          ) : (
            <span className="docs-kbd-shortcut">Ctrl+K</span>
          )}
        </div>

        {/* Right Actions */}
        <div className="docs-header-right">
          {/* GitHub Icon */}
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="docs-icon-btn"
            title="GitHub Repository"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>

          {/* Discord Icon */}
          <a 
            href="https://discord.gg" 
            target="_blank" 
            rel="noreferrer" 
            className="docs-icon-btn"
            title="Discord Support Community"
          >
            <LifeBuoy size={16} />
          </a>

          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative' }} ref={langDropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="docs-icon-btn"
              style={{ width: 'auto', padding: '0 10px', gap: '6px', fontSize: '12px', fontWeight: 600 }}
              title="Change Language"
            >
              <Globe size={14} color="#38bdf8" />
              <span>{currentLanguageObj.flag} {currentLanguageObj.name.slice(0, 3)}</span>
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>

            {langDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                width: '180px',
                background: '#0d101a',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
                zIndex: 100
              }}>
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: currentLang === l.code ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                      border: currentLang === l.code ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                      color: currentLang === l.code ? '#ffffff' : '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: currentLang === l.code ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{l.flag}</span>
                    <span style={{ flex: 1 }}>{l.name}</span>
                    {currentLang === l.code && <Check size={12} color="#38bdf8" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dashboard Button */}
          <button 
            onClick={() => {
              if (onOpenDashboard) {
                onOpenDashboard();
              } else if (onOpenLogin) {
                onOpenLogin();
              } else {
                window.location.href = '/dashboard';
              }
            }}
            style={{
              padding: '7px 16px',
              borderRadius: '999px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Terminal size={13} /> {user ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </header>


      {/* ── 2. THREE-COLUMN INDEPENDENT SCROLL WORKSPACE ─────────────── */}
      <div className="docs-body">

        {/* ── LEFT COLUMN: NAVIGATION SIDEBAR (INDEPENDENT SCROLL) ───── */}
        <aside className={`docs-left-col ${mobileNavOpen ? 'open' : ''}`}>
          {filteredGroups.map(group => {
            const isOpen = openGroups[group.key] !== false;
            return (
              <div key={group.key} className="docs-nav-group">
                <div 
                  className="docs-nav-group-header"
                  onClick={() => toggleGroup(group.key)}
                >
                  <span>{group.title}</span>
                  <ChevronDown 
                    size={13} 
                    style={{ 
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', 
                      transition: 'transform 0.2s ease' 
                    }} 
                  />
                </div>

                {isOpen && (
                  <div className="docs-nav-group-list">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          className={`docs-nav-link ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileNavOpen(false);
                          }}
                        >
                          <Icon size={15} color={isActive ? '#38bdf8' : '#64748b'} />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                              color: isActive ? '#38bdf8' : '#64748b'
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Need Assistance Card at bottom of Left Sidebar */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#60a5fa' }}>
                <Sparkles size={13} /> {dt.needHelpTitle || "Need Help Integrating?"}
              </div>
              <p style={{ margin: '4px 0 8px 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                {dt.needHelpDesc || "Join our developer Discord community for live assistance and SDK support."}
              </p>
              <a 
                href="https://discord.gg" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  textDecoration: 'none'
                }}
              >
                {dt.joinDiscord || "Join Discord Server"} <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </aside>


        {/* ── CENTER COLUMN: MAIN CONTENT (ONLY THIS SCROLLS!) ───────── */}
        <main 
          className="docs-center-col"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <article className="docs-article animate-slide-up">

            {/* ════ TAB 0: INTRODUCTION (KEYAUTH STYLE) ════════════════ */}
            {activeTab === 'intro' && (
              <div>
                <div style={{ marginBottom: '32px' }} id="intro-title">
                  <span className="badge badge-primary" style={{ background: 'rgba(37,99,235,0.18)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '12px' }}>{dt.introBadge || "Getting Started"}</span>
                  <h1 style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-1px', color: '#ffffff', margin: '8px 0 12px 0' }}>
                    {dt.introTitle || "Authentication made for developers!"}
                  </h1>
                  <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                    {dt.introSubtitle || "Secure, scalable, and modern authentication & licensing infrastructure for your applications."}
                  </p>
                </div>

                {/* Section 1: What is Habit Auth? */}
                <div style={{ marginBottom: '36px' }} id="what-is-habit-auth">
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Info size={20} color="#38bdf8" /> {dt.whatIsTitle || "What is Habit Auth?"}
                  </h2>
                  
                  <p style={{ fontSize: '14.5px', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '16px' }}>
                    {dt.whatIsP1 || "Habit Auth is an enterprise authentication, hardware licensing, and anti-tamper platform..."}
                  </p>
                  
                  <p style={{ fontSize: '14.5px', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px' }}>
                    {dt.whatIsP2 || "Applications are the backbone of the service..."}
                  </p>

                  <div className="glass-panel" style={{
                    padding: '20px 24px',
                    borderRadius: '14px',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    background: 'radial-gradient(ellipse at top left, rgba(37, 99, 235, 0.1) 0%, rgba(13, 16, 26, 0.8) 100%)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Shield size={16} color="#38bdf8" />
                      {dt.coreArchTitle || "Core Architectural Principle: Authentication vs. Obfuscation"}
                    </div>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                      {dt.coreArchP || "It is important to note that Habit Auth is an authentication and license management service..."}
                    </p>
                  </div>
                </div>

                {/* Section 2: {dt.whatCanBeUsedTitle || "What can Habit Auth be used for?"} */}
                <div style={{ marginBottom: '40px' }} id="what-can-it-be-used-for">
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                    {dt.whatCanBeUsedTitle || "What can Habit Auth be used for?"}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                    {dt.whatCanBeUsedP || "Regardless of your application's architecture or platform, Habit Auth can be used for just about anything:"}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {[
                      { title: dt.useCase1Title || "Game Development & Modding", desc: dt.useCase1Desc || "Protect in-game toolsets..." },
                      { title: dt.useCase2Title || "Desktop Software (C#, C++, WPF)", desc: dt.useCase2Desc || "Enterprise SaaS utilities..." },
                      { title: dt.useCase3Title || "Commercial Distribution & Licensing", desc: dt.useCase3Desc || "Sell software licenses via your own store or automated payment webhooks." },
                      { title: dt.useCase4Title || "Microservices & Private APIs", desc: dt.useCase4Desc || "Secure backend microservices..." },
                      { title: dt.useCase5Title || "Mobile & Cloud Applications", desc: dt.useCase5Desc || "Cross-platform licensing..." },
                      { title: dt.useCase6Title || "Enterprise Tooling", desc: dt.useCase6Desc || "Restrict sensitive internal company software..." }
                    ].map((item, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#ffffff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={14} color="#38bdf8" /> {item.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '16px' }}>
                    And more. If your programming language can make HTTP requests or execute compiled code, Habit Auth can be used in it!
                  </p>
                </div>

                {/* Section 3: {dt.whichFocusTitle || "Which would you like to focus on?"} */}
                <div style={{ marginBottom: '40px' }} id="which-would-you-focus">
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '18px' }}>
                    {dt.whichFocusTitle || "Which would you like to focus on?"}
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div 
                      className="glass-panel" 
                      onClick={() => setActiveTab('getting-started')}
                      style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '14px' }}>
                        <Zap size={20} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>{dt.focus1Title || "Quickstart & Setup"}</h3>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        {dt.focus1Desc || "Learn how to create an application..."}
                      </p>
                    </div>

                    <div 
                      className="glass-panel" 
                      onClick={() => setActiveTab('security-hardening')}
                      style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: '14px' }}>
                        <Shield size={20} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>{dt.focus2Title || "Security & Anti-Crack"}</h3>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        {dt.focus2Desc || "Discover reverse-engineering defenses..."}
                      </p>
                    </div>

                    <div 
                      className="glass-panel" 
                      onClick={() => setActiveTab('sdk-libraries')}
                      style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '14px' }}>
                        <Code size={20} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>{dt.focus3Title || "Premade SDKs & Code"}</h3>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        {dt.focus3Desc || "Download ready-to-use libraries..."}
                      </p>
                    </div>

                    <div 
                      className="glass-panel" 
                      onClick={() => setActiveTab('rest-api')}
                      style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '14px' }}>
                        <Terminal size={20} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>{dt.focus4Title || "REST API Reference"}</h3>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        {dt.focus4Desc || "Explore direct HTTP API endpoints..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* ════ TAB 1: QUICKSTART & ARCHITECTURE ══════════════════ */}
            {activeTab === 'getting-started' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="gs-title">
                  <span className="badge badge-primary">Fundamentals</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    Quickstart & Core Architecture
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    {dt.gsSubtitle || "Habit Auth provides zero-trust authentication..."}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }} id="gs-steps">
                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#60a5fa', marginBottom: '12px' }}>1</div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>Create Your Application</h3>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      {dt.step1Desc || "In the Dashboard, click New Application..."}
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#38bdf8', marginBottom: '12px' }}>2</div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>Drop in the SDK File</h3>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      {dt.step2Desc || "Add HabitAuth.cs directly into your codebase..."}
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#4ade80', marginBottom: '12px' }}>3</div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>Protect With 1 Line</h3>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      {dt.step3Desc || "Call auth.LoginAsync() on application startup."}
                    </p>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', borderRadius: '14px' }} id="gs-credentials">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#fff' }} className="flex-align">
                    <Key size={18} color="#38bdf8" style={{ marginRight: '8px' }} />
                    {dt.credsTitle || "Understanding Application Credentials"}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#fff' }}>{dt.appIdTitle || "App ID (Public Client Identifier)"}</div>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.5 }}>
                        {dt.appIdDesc || "Example: app_8a920dfa12b4 — Hardcoded safely inside desktop software..."}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#f87171' }}>{dt.appSecretTitle || "App Secret (Private Administrative Key)"}</div>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.5 }}>
                        {dt.appSecretDesc || "Example: sec_9941a8b23c94... — 64-character master secret."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="gs-crypto">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#fff' }} className="flex-align">
                    <Shield size={18} color="#4ade80" style={{ marginRight: '8px' }} />
                    Ed25519 Cryptographic Signatures
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                    {dt.cryptoDesc || "Every authentication response payload is digitally signed..."}
                  </p>
                </div>
              </div>
            )}


            {/* ════ TAB 2: SECURITY & ANTI-CRACK HARDENING ══════════════ */}
            {activeTab === 'security-hardening' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="sec-title">
                  <span className="badge badge-primary" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Enterprise Defense Standard
                  </span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    ⛨ Security Best Practices & Anti-Crack Hardening
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    {dt.secSubtitle || "Habit Auth protects your licensing and authentication..."}
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '28px', border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(8,9,14,0.8) 100%)', borderRadius: '14px' }} id="sec-philosophy">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f87171' }}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                        Core Security Philosophy: Authentication vs. Obfuscation
                      </h3>
                      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                        <b style={{ color: '#fff' }}>We are an authentication service, not an obfuscation service.</b> When you use Habit Auth official API libraries, cryptographic response signing, replay protection, and hardware locks are built in. However, if an attacker can simply modify your compiled binary in dnSpy or x64dbg and delete your <code>if (auth.Login())</code> check, your software will be cracked regardless of server security. Follow this guide to build an impenetrable defense!
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }} id="sec-protections">
                  <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: '#fff' }} className="flex-align">
                    <Lock size={18} color="#38bdf8" style={{ marginRight: '8px' }} />
                    {dt.builtinProtTitle || "Built-in Habit Auth Cryptographic Protections"}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    {[
                      { title: 'Zero-Replay Nonce Engine', desc: 'Each API request issues a cryptographic timestamped nonce. Replayed network payloads are instantly discarded.' },
                      { title: 'SHA-256 Multi-Sensor HWID', desc: 'Motherboard UUID, CPU serial, and primary disk drive serial are hashed together to form a unique hardware fingerprint.' },
                      { title: '24-Hour Brute-Force Lockout', desc: '5 consecutive failed password attempts trigger an automatic 24-hour hardware lock on the client IP and machine.' },
                      { title: 'Binary Integrity Auto-Ban', desc: 'The server compares the executable SHA-256 hash against published releases, auto-banning cracked binaries.' }
                    ].map((item, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#ffffff', marginBottom: '6px' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* ════ TAB 3: USER AUTH & 24H LOCKOUT ═════════════════════ */}
            {activeTab === 'auth-sessions' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="auth-title">
                  <span className="badge badge-primary">Client Security</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    User Authentication & 24h Lockout Engine
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Habit Auth protects client accounts with automated brute-force defense, PBKDF2 password hashing, dynamic monotonic nonces, and asymmetric Ed25519 session tokens.
                  </p>
                </div>

                {/* 24h Lockout Section */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="auth-lockout">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                      <Lock size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        24-Hour Brute-Force Lockout Defense
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Automated attack suppression for client software</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Credential stuffing and automated dictionary bots are the #1 attack vector against desktop software licenses. Habit Auth deploys an intelligent rate-limiter keyed on a triple composite identifier: <code>(Username + Client IP + Machine HWID)</code>.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Threshold</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>5 Failed Attempts</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>Within any rolling 15-minute window</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lockout Penalty</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>Strict 24 Hours</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>All login attempts rejected instantly</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Override Authority</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>Admin Dashboard</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>Developers can unlock users manually</div>
                    </div>
                  </div>

                  <div style={{ background: '#07080e', borderRadius: '10px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700 }}>429 / 403 LOCKOUT RESPONSE PAYLOAD</span>
                      <button 
                        onClick={() => copyCode(`{\n  "success": false,\n  "code": "ACCOUNT_TEMPORARILY_LOCKED",\n  "message": "Too many failed attempts. Account locked for 24 hours.",\n  "lockedUntil": 1788536400,\n  "remainingHours": 23.8\n}`, 'lockout_json')}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copiedKey === 'lockout_json' ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                        {copiedKey === 'lockout_json' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
{`{
  "success": false,
  "code": "ACCOUNT_TEMPORARILY_LOCKED",
  "message": "Too many failed attempts. Account locked for 24 hours.",
  "lockedUntil": 1788536400,
  "remainingHours": 23.8
}`}
                    </pre>
                  </div>
                </div>

                {/* Signed Session Tokens Section */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="auth-token">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Signed Session Tokens & Cryptographic Structure
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tamper-proof asymmetric Ed25519 authorization</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Upon successful authentication, Habit Auth returns a high-entropy signed session token. The token contains the subscriber's permissions, duration expiration, and machine fingerprint, signed with your server's private Ed25519 key.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#38bdf8', marginBottom: '4px' }}>Zero-Replay Nonce</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                        Tokens include a monotonic cryptographic nonce. Packet sniffers cannot replay cached tokens to fake a successful session.
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#4ade80', marginBottom: '4px' }}>Hardware Lock Hash</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                        The token embeds the SHA-256 HWID hash. If copied to another computer, validation fails instantly.
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#a78bfa', marginBottom: '4px' }}>Dynamic Expiration</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                        Standard sessions expire after 12 hours unless extended by recurring background heartbeat ping.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Lifecycle Section */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="auth-lifecycle">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', color: '#fff' }} className="flex-align">
                    <Activity size={18} color="#34d399" style={{ marginRight: '8px' }} />
                    Session Lifecycle & Heartbeat Validation
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    To maintain protection against mid-game cracks, memory injection, and concurrent unauthorized logins, your application should maintain a periodic heartbeat check:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>1</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}><b>Login Init:</b> Client sends credentials + local HWID to <code>/api/v1/client/login</code>.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>2</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}><b>Secure Memory Cache:</b> SDK stores the token in an encrypted memory structure (e.g. <code>SecureString</code>).</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>3</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}><b>Background Heartbeat:</b> Every 20 minutes, SDK calls <code>/api/v1/client/validate-token</code> with current session token.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>4</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}><b>Killswitch Trip:</b> If developer revokes user in dashboard or HWID changes, client process terminates immediately.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* ════ TAB 4: LICENSES & MACHINE HWID ═════════════════════ */}
            {activeTab === 'licenses-hwid' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="lic-title">
                  <span className="badge badge-primary">Hardware Binding</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    Licenses & Machine HWID Binding
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Permanently lock license keys to the user's physical machine hardware to prevent key sharing, multi-machine leakage, and illicit resale.
                  </p>
                </div>

                {/* HWID Algorithm Section */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="lic-algorithm">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Multi-Sensor HWID Fingerprinting Algorithm
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Triple-layer physical hardware hashing</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                    Simple auth systems rely on MAC address or IP address, which are trivially bypassed by VPNs or MAC spoofers. Habit Auth probes deep kernel WMI and IOCTL interfaces to query 3 independent physical hardware sensors:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>Sensor 1</span>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff' }}>Motherboard BIOS UUID</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 6px 0' }}>
                        Queries the system manufacturer UUID from SMBIOS table (<code>Win32_ComputerSystemProduct.UUID</code>).
                      </p>
                      <code style={{ fontSize: '11px', color: '#64748b' }}>Example: 4C4C4544-004B-4E10-8042-C8C04F4D3332</code>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>Sensor 2</span>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff' }}>Processor Silicon ID</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 6px 0' }}>
                        Queries CPU features and hardware stepping via CPUID assembler register (<code>Win32_Processor.ProcessorId</code>).
                      </p>
                      <code style={{ fontSize: '11px', color: '#64748b' }}>Example: BFEBFBFF000906EA</code>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>Sensor 3</span>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff' }}>Primary Disk Serial</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 6px 0' }}>
                        Reads physical storage drive serial from SMART IOCTL controller (<code>Win32_DiskDrive.SerialNumber</code>).
                      </p>
                      <code style={{ fontSize: '11px', color: '#64748b' }}>Example: S3ZJNB0M123456K</code>
                    </div>
                  </div>

                  <div style={{ padding: '14px 18px', background: '#07080e', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>FINAL COMBINED COMPOSITE HASH</span>
                    <div style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace' }}>
                      HWID = SHA256(BIOS_UUID + ":" + CPU_ID + ":" + DISK_SERIAL + ":" + APP_SALT).Substring(0, 16)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                      Resulting client fingerprint: <code>7A1F-9E02-8BC4-31D9</code>
                    </div>
                  </div>
                </div>

                {/* HWID Reset Policy Section */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="lic-reset">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                      <Shield size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Hardware ID Reset Policy & Cooldown Engine
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Balance user convenience with fraud prevention</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    When legitimate users upgrade their motherboard, replace an SSD, or reinstall Windows, their HWID fingerprint will change. Habit Auth offers two reset pathways:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#4ade80', marginBottom: '6px' }}>Automatic Cooldown Resets</div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        Configure a rolling cooldown in the Dashboard (e.g. <b>1 reset every 7 days</b>). Users can self-reset their HWID through the client login screen without contacting support.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#38bdf8', marginBottom: '6px' }}>Admin Dashboard 1-Click Reset</div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        Admins can view any user or license key in the dashboard and click <b>Reset HWID</b>. The previous binding is instantly unlinked and rebinds to the next machine that signs in.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration Tiers Section */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="lic-tiers">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', color: '#fff' }} className="flex-align">
                    <Key size={18} color="#a78bfa" style={{ marginRight: '8px' }} />
                    License Duration Tiers & Key Formatting
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Habit Auth license keys follow the standard 20-character format: <code>HABIT-XXXX-XXXX-XXXX-XXXX</code>. Keys are generated with an embedded Luhn checksum to catch typing errors instantly before sending an API request.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {[
                      { tier: '1 Day / 3 Days', label: 'Trial & Day Pass', desc: 'Auto-expires 24/72 hours from first activation.' },
                      { tier: '7 Days / 30 Days', label: 'Subscription', desc: 'Standard recurring monthly tier with renewal grace period.' },
                      { tier: 'Lifetime', label: 'Permanent Pass', desc: 'Never expires. Bound permanently to registered machine HWID.' },
                      { tier: 'Paused / Frozen', label: 'Maintenance Mode', desc: 'Can be frozen during developer updates without user time loss.' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff' }}>{item.tier}</div>
                        <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>{item.label}</div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* ════ TAB 5: BINARY INTEGRITY & AUTO-BAN ═════════════════ */}
            {activeTab === 'anti-tamper' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="tamper-title">
                  <span className="badge badge-primary">Anti-Tamper</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    Binary Integrity Verification & Auto-Ban
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Detect bytecode modifications, memory patching, and DLL injectors in real time. Automatically blacklist offending hardware IDs before cracks can be released.
                  </p>
                </div>

                {/* Auto-Ban Engine Section */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="tamper-autoban">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Runtime SHA-256 Hash Matching & Auto-Ban
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Zero tolerance for modified client executables</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    When you publish a new version of your software, you register its SHA-256 checksum in the Habit Auth dashboard. Every SDK authentication call reads its own executable file on disk, generates a SHA-256 digest, and sends it encrypted inside the login request.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Step 1: Checksum Probe</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>Client Reads PE Image</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>Calculates SHA-256 over entire binary</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Step 2: Server Audit</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>Database Hash Compare</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>Matches registered build in dashboard</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Step 3: Mismatch Response</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginTop: '2px' }}>Permanent Auto-Ban</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>HWID blacklisted + user suspended</div>
                    </div>
                  </div>
                </div>

                {/* Real-time Webhook Alerts */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="tamper-alerts">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Real-Time Security Incident Webhook Alerts
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Immediate push notifications to Discord or Slack</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Whenever an anti-tamper violation occurs, Habit Auth immediately delivers an automated rich notification payload to your private webhook channel:
                  </p>

                  <div style={{ background: '#07080e', borderRadius: '10px', padding: '16px 20px', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertTriangle size={15} /> [CRITICAL] Binary Tamper Attempt Flagged
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <div><b>Application:</b> MyCheatClient.exe</div>
                      <div><b>Username:</b> suspect_user_88</div>
                      <div><b>Client IP:</b> 185.220.101.5</div>
                      <div><b>Machine HWID:</b> 7A1F-9E02-8BC4-31D9</div>
                      <div><b>Detected Hash:</b> <code>d41d8cd98f00b204e9800998...</code></div>
                      <div><b>Action:</b> <span style={{ color: '#f87171', fontWeight: 700 }}>HWID Blacklisted & Account Banned</span></div>
                    </div>
                  </div>
                </div>

                {/* Hardening Practices */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="tamper-hardening">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', color: '#fff' }} className="flex-align">
                    <Shield size={18} color="#38bdf8" style={{ marginRight: '8px' }} />
                    Memory & Anti-Debugging Developer Best Practices
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                    Complement Habit Auth's server protection with these essential client-side defensive techniques:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: 1.7 }}>
                    <li><b>PEB Debugger Flag:</b> Continuously check <code>IsDebuggerPresent()</code> and <code>CheckRemoteDebuggerPresent()</code> on worker threads.</li>
                    <li><b>Hide Threads:</b> Call <code>NtSetInformationThread(ThreadHideFromDebugger)</code> to crash debuggers attaching via x64dbg.</li>
                    <li><b>VirtualProtect Integrity:</b> Verify that code sections (<code>.text</code>) remain marked <code>PAGE_EXECUTE_READ</code> and haven't been patched with <code>PAGE_EXECUTE_READWRITE</code>.</li>
                    <li><b>Obfuscate Strings:</b> Use compile-time XOR string encryption so that your <code>App ID</code> and endpoint URLs cannot be scraped with basic <code>strings</code> commands.</li>
                  </ul>
                </div>
              </div>
            )}


            {/* ════ TAB 6: TOKEN VALIDATION GATE ═══════════════════════ */}
            {activeTab === 'token-validation' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="gate-title">
                  <span className="badge badge-primary">Startup Gate</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    Token Validation Gate (Startup Enforcer)
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Execute instant cryptographic token handshakes at program startup to guarantee that only valid, paid, and un-revoked users can run your application.
                  </p>
                </div>

                {/* Handshake Flow */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="gate-flow">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Startup Validation Handshake Flow
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sub-35ms cryptographic verification sequence</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                    Rather than forcing the user to type their username and password every time your software boots, the SDK stores a secure token locally and runs a fast handshake before showing your main application window:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>1</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>Local Token Probe</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                        SDK checks for cached signed session token in secure local store.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(74,222,128,0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>2</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>Server Ping</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                        Posts <code>token + current HWID + nonce</code> to <code>/api/v1/client/validate-token</code>.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(168,85,247,0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>3</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>Asymmetric Signature</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                        Server validates account and returns Ed25519 digitally signed verification challenge.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>4</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>Gate Unlock</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                        Client SDK verifies signature against public key, then initializes application UI.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Offline Leases */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="gate-offline">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Signed Offline Cryptographic Leases
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Support users traveling or in air-gapped environments</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    If your software needs to support offline operation, Habit Auth can issue a signed offline lease token. The lease embeds a strict hardware fingerprint and a cryptographically signed expiration timestamp (e.g. 72 hours). The client SDK verifies the Ed25519 signature locally without calling home until the lease expires.
                  </p>
                </div>

                {/* Startup Code Snippet */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="gate-code">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }} className="flex-align">
                      <Code size={18} color="#38bdf8" style={{ marginRight: '8px' }} />
                      Startup Guard Implementation (C# .NET)
                    </h2>
                    <button 
                      onClick={() => copyCode(`using System;\nusing System.Threading.Tasks;\nusing HabitAuthSDK;\n\nnamespace MyDesktopApp\n{\n    static class Program\n    {\n        [STAThread]\n        static async Task Main()\n        {\n            var auth = new HabitAuthClient("app_8a920dfa12b4");\n\n            // 1. Check startup validation gate\n            var gateResult = await auth.ValidateTokenGateAsync();\n\n            if (!gateResult.Authorized)\n            {\n                // Token missing, expired, or HWID mismatched\n                System.Windows.Forms.MessageBox.Show(\n                    gateResult.Message ?? "Authorization required. Please log in.",\n                    "Habit Auth Security Gate",\n                    System.Windows.Forms.MessageBoxButtons.OK,\n                    System.Windows.Forms.MessageBoxIcon.Warning\n                );\n                // Launch Login Window\n                System.Windows.Forms.Application.Run(new LoginForm(auth));\n                return;\n            }\n\n            // 2. Token verified! Launch Main Application Window\n            System.Windows.Forms.Application.Run(new MainWindow(gateResult.User));\n        }\n    }\n}`, 'gate_snippet')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedKey === 'gate_snippet' ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                      {copiedKey === 'gate_snippet' ? 'Copied!' : 'Copy Snippet'}
                    </button>
                  </div>

                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    background: '#07080e',
                    borderRadius: '10px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
{`using System;
using System.Threading.Tasks;
using HabitAuthSDK;

namespace MyDesktopApp
{
    static class Program
    {
        [STAThread]
        static async Task Main()
        {
            var auth = new HabitAuthClient("app_8a920dfa12b4");

            // 1. Check startup validation gate
            var gateResult = await auth.ValidateTokenGateAsync();

            if (!gateResult.Authorized)
            {
                // Token missing, expired, or HWID mismatched -> Prompt Login
                System.Windows.Forms.Application.Run(new LoginForm(auth));
                return;
            }

            // 2. Token verified! Launch Main Application Window
            System.Windows.Forms.Application.Run(new MainWindow(gateResult.User));
        }
    }
}`}
                  </pre>
                </div>
              </div>
            )}


            {/* ════ TAB 7: AUTO-UPDATER ════════════════════════════════ */}
            {activeTab === 'auto-updater' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="update-title">
                  <span className="badge badge-primary">Distribution & Delivery</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    Auto-Updater Helper Engine
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Ensure 100% of your user base runs your latest patched binaries. Deploy urgent security hotfixes, deliver new features, and force cracked older versions to shut down.
                  </p>
                </div>

                {/* Version Checking API */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="update-check">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <Download size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Version Check Handshake API
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real-time semver comparison and CDN routing</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    At application launch, your software calls the version check endpoint. The Habit Auth backend checks the active release version configured in your application settings and returns update availability, force update flags, and direct CDN binary URLs.
                  </p>

                  <div style={{ background: '#07080e', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span className="badge badge-primary" style={{ fontWeight: 800 }}>POST</span>
                      <code style={{ fontSize: '13.5px', color: '#fff', fontWeight: 700 }}>/api/v1/client/check-update</code>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', width: '100%' }}>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>REQUEST PAYLOAD (JSON)</div>
                        <pre style={{ margin: 0, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0', overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`{
  "appId": "app_8a920dfa12b4",
  "currentVersion": "1.0.4",
  "channel": "stable"
}`}
                        </pre>
                      </div>

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>RESPONSE PAYLOAD (JSON)</div>
                        <pre style={{ margin: 0, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: '#4ade80', overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`{
  "success": true,
  "updateAvailable": true,
  "latestVersion": "1.2.0",
  "forceUpdate": true,
  "downloadUrl": "https://cdn.habitauth.com/builds/v1.2.0.exe",
  "sha256": "4b227777d4dd1fc61c6f884f...",
  "changelog": "- Windows 11 24H2 patch\\n- Memory guard"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update Delivery Flow */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="update-flow">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', color: '#fff' }} className="flex-align">
                    <Zap size={18} color="#fbbf24" style={{ marginRight: '8px' }} />
                    Force Update & Delivery Pipeline
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                    How Habit Auth enforces mandatory vs optional software rollouts:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#38bdf8', marginBottom: '6px' }}>1. Version Check</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                        Application queries <code>/check-update</code> on initial boot before loading any sensitive resources.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#f87171', marginBottom: '6px' }}>2. Force Gate</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                        If <code>forceUpdate: true</code>, the client disables the main UI and renders an un-dismissible update prompt.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#4ade80', marginBottom: '6px' }}>3. SHA-256 Audit</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                        Downloaded file bytes are verified against the response <code>sha256</code> hash before replacing local disk files.
                      </p>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#c084fc', marginBottom: '6px' }}>4. Atomic Swap</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                        A companion <code>Updater.exe</code> terminates the old PID, replaces the executable, and restarts the app.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client Integration Code */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="update-code">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }} className="flex-align">
                      <Code size={18} color="#34d399" style={{ marginRight: '8px' }} />
                      Desktop Client Integration Snippet (C# .NET)
                    </h2>
                    <button 
                      onClick={() => copyCode(`var update = await auth.CheckUpdateAsync("1.0.4");\nif (update.UpdateAvailable)\n{\n    if (update.ForceUpdate)\n    {\n        Console.WriteLine($"[!] Mandatory Update Required: v{update.LatestVersion}");\n        Console.WriteLine($"Changelog:\\n{update.Changelog}");\n        await auth.LaunchUpdaterAsync(update.DownloadUrl);\n        Environment.Exit(0);\n    }\n}`, 'update_snippet')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedKey === 'update_snippet' ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                      {copiedKey === 'update_snippet' ? 'Copied!' : 'Copy Snippet'}
                    </button>
                  </div>

                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    background: '#07080e',
                    borderRadius: '10px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
{`// 1. Check for updates on software launch
var update = await auth.CheckUpdateAsync(currentVersion: "1.0.4");

if (update.UpdateAvailable)
{
    Console.WriteLine($"[!] Update Available: v{update.LatestVersion}");
    Console.WriteLine($"Changelog:\\n{update.Changelog}");

    if (update.ForceUpdate)
    {
        Console.WriteLine("[*] Mandatory security patch. Launching updater...");
        await auth.DownloadAndLaunchUpdaterAsync(update.DownloadUrl, update.Sha256);
        Environment.Exit(0); // Terminate old process
    }
}`}
                  </pre>
                </div>
              </div>
            )}


            {/* ════ TAB 8: SUPPORT TICKETS API ═════════════════════════ */}
            {activeTab === 'support-tickets' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="support-title">
                  <span className="badge badge-primary">Customer Care</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    In-App Support Tickets API
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Allow users to submit bug reports and support tickets directly from inside your software interface, synced in real-time with your Habit Auth developer dashboard.
                  </p>
                </div>

                {/* Ticket Endpoints */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="support-endpoints">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <LifeBuoy size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        In-App Ticket Endpoints Reference
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Complete REST interface for client-embedded helpdesks</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="badge badge-primary" style={{ fontWeight: 800 }}>POST</span>
                        <code style={{ fontSize: '13.5px', color: '#fff', fontWeight: 700 }}>/api/v1/client/tickets/create</code>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 8px 0' }}>
                        Opens a new support ticket attached to the authenticated user's session.
                      </p>
                      <pre style={{ margin: 0, padding: '10px', background: '#07080e', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`Payload: { "token": "ses_xxx", "subject": "Crash on Startup", "category": "bug", "message": "Error 0xC0000005 occurred." }
Response: { "success": true, "ticketId": "tkt_8a2910fa", "status": "OPEN" }`}
                      </pre>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="badge badge-primary" style={{ fontWeight: 800, background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>GET</span>
                        <code style={{ fontSize: '13.5px', color: '#fff', fontWeight: 700 }}>/api/v1/client/tickets/list</code>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 8px 0' }}>
                        Fetches active and resolved ticket threads for the current client user.
                      </p>
                      <pre style={{ margin: 0, padding: '10px', background: '#07080e', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`Headers: Authorization: Bearer ses_xxx
Response: { "success": true, "tickets": [{ "id": "tkt_1", "subject": "...", "status": "PENDING_ADMIN" }] }`}
                      </pre>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="badge badge-primary" style={{ fontWeight: 800 }}>POST</span>
                        <code style={{ fontSize: '13.5px', color: '#fff', fontWeight: 700 }}>/api/v1/client/tickets/reply</code>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 8px 0' }}>
                        Appends a user reply message to an existing open ticket thread.
                      </p>
                      <pre style={{ margin: 0, padding: '10px', background: '#07080e', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`Payload: { "token": "ses_xxx", "ticketId": "tkt_8a2910fa", "reply": "Attached diagnostic log." }`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Embedded Helpdesk Architecture */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '14px' }} id="support-architecture">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', color: '#fff' }} className="flex-align">
                    <MessageSquare size={18} color="#a78bfa" style={{ marginRight: '8px' }} />
                    Embedded Helpdesk Architecture
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Traditional external ticketing systems force users into web browsers, email threads, or public Discord channels where angry users post complaints publicly. In-app tickets keep communications private, focused, and automated:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#38bdf8', marginBottom: '4px' }}>Silent Hardware Diagnostics</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                        The SDK automatically attaches OS version, GPU model, RAM, and App Version to the ticket payload so you don't have to ask the customer.
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#4ade80', marginBottom: '4px' }}>Zero Discord Drama</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                        Bugs and support issues are handled 1-on-1 rather than having public channels flooded with repetitive questions.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discord & Dashboard Sync */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }} id="support-webhooks">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Live Discord Alerts & Dashboard Sync
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real-time synchronization with developer tools</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    When a client creates a ticket, it instantly pops up in your Habit Auth developer dashboard with an unread badge. Simultaneously, your support Discord channel receives a webhook embed containing the user's issue and a 1-click jump link to reply directly from your web dashboard.
                  </p>
                </div>
              </div>
            )}


            {/* ════ TAB 9: MULTI-LANGUAGE SDKS ════════════════════════ */}
            {/* ════ TAB 9: MULTI-LANGUAGE SDKS ════════════════════════ */}
            {activeTab === 'sdk-libraries' && (() => {
              const activeSdk = SDK_REGISTRY.find(s => s.id === activeCodeLang);
              const isCurl = activeCodeLang === 'curl';
              const codeToDisplay = isCurl 
                ? getCodeSnippet('curl')
                : (sdkViewMode === 'source' ? (activeSdk?.sourceCode || '') : (activeSdk?.usageExample || getCodeSnippet(activeCodeLang)));
              const lineCount = codeToDisplay ? codeToDisplay.split('\n').length : 0;
              const kbSize = codeToDisplay ? (new Blob([codeToDisplay]).size / 1024).toFixed(1) : 0;

              return (
                <div>
                  <div style={{ marginBottom: '28px' }} id="sdk-title">
                    <span className="badge badge-primary">SDK Integration</span>
                    <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                      Multi-Language SDK Showcase
                    </h1>
                    <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                      Zero-dependency, production-ready client libraries with HWID fingerprinting, dual Ed25519 asymmetric & HMAC-SHA256 response verification, anti-tamper defenses, and automated heartbeat telemetry.
                    </p>
                  </div>

                  {/* Code Viewer & Download Hub */}
                  <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }} id="sdk-languages">
                    {/* Top Language Navigation Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      background: 'rgba(10, 12, 20, 0.95)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'csharp', label: 'C# .NET' },
                          { id: 'cpp', label: 'C++ Native' },
                          { id: 'python', label: 'Python' },
                          { id: 'nodejs', label: 'Node.js' },
                          { id: 'go', label: 'Go' },
                          { id: 'rust', label: 'Rust' },
                          { id: 'curl', label: 'cURL / REST' }
                        ].map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => setActiveCodeLang(lang.id)}
                            style={{
                              padding: '7px 14px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              background: activeCodeLang === lang.id ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.05)',
                              color: activeCodeLang === lang.id ? '#ffffff' : '#94a3b8',
                              boxShadow: activeCodeLang === lang.id ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeSdk && (
                          <button 
                            onClick={() => downloadSdkFile(activeSdk.filename, activeSdk.sourceCode)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.35)',
                              color: '#4ade80',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Download ${activeSdk.filename} file`}
                          >
                            <Download size={14} />
                            <span>Download {activeSdk.filename}</span>
                          </button>
                        )}

                        <button 
                          onClick={() => copyCode(codeToDisplay, 'sdk_code')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedKey === 'sdk_code' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                          {copiedKey === 'sdk_code' ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                    </div>

                    {/* Secondary Info Header & Source vs Example Toggle */}
                    {!isCurl && activeSdk && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 18px',
                        background: 'rgba(15, 18, 30, 0.85)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileCode size={16} color="#38bdf8" />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                            {sdkViewMode === 'source' ? activeSdk.filename : (activeCodeLang === 'csharp' ? 'Form1.cs' : (activeCodeLang === 'cpp' ? 'main.cpp' : (activeCodeLang === 'python' ? 'main.py' : (activeCodeLang === 'nodejs' ? 'index.js' : 'main'))))}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontWeight: 700
                          }}>
                            {activeSdk.badge || `v${activeSdk.version}`}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {lineCount} lines ({kbSize} KB)
                          </span>
                        </div>

                        {/* Toggle between Full Production Client and Quickstart Usage */}
                        <div style={{
                          display: 'flex',
                          background: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '8px',
                          padding: '3px',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          <button
                            onClick={() => setSdkViewMode('source')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              background: sdkViewMode === 'source' ? '#2563eb' : 'transparent',
                              color: sdkViewMode === 'source' ? '#ffffff' : '#94a3b8',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Full Client Source Code ({activeSdk.filename})
                          </button>
                          <button
                            onClick={() => setSdkViewMode('example')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              background: sdkViewMode === 'example' ? '#2563eb' : 'transparent',
                              color: sdkViewMode === 'example' ? '#ffffff' : '#94a3b8',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Quickstart Example
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Code Container */}
                    <pre style={{
                      margin: 0,
                      padding: '20px',
                      background: '#07080e',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: '12.5px',
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      overflowX: 'auto',
                      maxHeight: '620px',
                      overflowY: 'auto'
                    }}>
                      {codeToDisplay}
                    </pre>
                  </div>

                  {/* Architecture & Feature Breakdown */}
                  {activeSdk && activeSdk.docs && activeSdk.docs.length > 0 && (
                    <div style={{ marginTop: '28px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} color="#38bdf8" />
                        {activeSdk.name} Architecture & Security Capabilities
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '14px'
                      }}>
                        {activeSdk.docs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="glass-panel"
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          >
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#60a5fa', margin: '0 0 6px 0' }}>
                              {doc.title}
                            </h4>
                            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                              {doc.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}


            {/* ════ TAB 10: COMPLETE REST API ══════════════════════════ */}
            {activeTab === 'rest-api' && (
              <div>
                <div style={{ marginBottom: '28px' }} id="api-title">
                  <span className="badge badge-primary">REST v1</span>
                  <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
                    Complete REST API Specification
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                    Direct HTTP API endpoints for integrating custom game engines, microservices, and web applications.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }} id="api-login">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontWeight: 800 }}>POST</span>
                      <code style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>/api/v1/client/login</code>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      Authenticates user account credentials, performs hardware fingerprint verification, checks 24h brute-force lockout, and issues a session token.
                    </p>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', margin: 0, overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`Payload: { "appId": "app_xxx", "username": "user", "password": "pwd", "hwid": "HWID-XXX" }
Response: { "success": true, "token": "ses_xxx", "user": { "username": "user", "expires_at": 1788450000 } }`}
                    </pre>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }} id="api-license">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontWeight: 800 }}>POST</span>
                      <code style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>/api/v1/client/activate-license</code>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      Redeems a license key, sets duration timer, and permanently binds to client machine HWID.
                    </p>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', margin: 0, overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`Payload: { "appId": "app_xxx", "licenseKey": "HABIT-XXXX-XXXX", "hwid": "HWID-XXX" }
Response: { "success": true, "message": "License activated successfully", "expiresAt": 1798450000 } }`}
                    </pre>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }} id="api-update">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontWeight: 800 }}>POST</span>
                      <code style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>/api/v1/client/check-update</code>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      Compares current running version against published release, returning force update flag and download link.
                    </p>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', margin: 0, overflowX: 'auto', maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box' }}>
{`Payload: { "appId": "app_xxx", "currentVersion": "1.0.0" }
Response: { "success": true, "updateAvailable": true, "latestVersion": "1.1.0", "downloadUrl": "https://..." }`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

          </article>
        </main>


        {/* ── RIGHT COLUMN: TABLE OF CONTENTS (ON THIS PAGE) ─────────── */}
        <aside className="docs-right-col">
          <div className="docs-toc-title">
            <Menu size={13} /> {dt.onThisPage || "On this page"}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {currentToc.map(item => {
              const isActive = activeHeading === item.id;
              return (
                <div
                  key={item.id}
                  className={`docs-toc-item ${isActive ? 'active' : ''}`}
                  onClick={() => scrollToHeading(item.id)}
                >
                  {item.label}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
              {dt.quickActions || "Quick Actions"}
            </div>
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0'
              }}
            >
              {dt.backToTop || "↑ Back to top"}
            </button>
          </div>
        </aside>

      </div>

    </div>
  );
}

function getCodeSnippet(lang) {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://habitauth.com';
  const apiBase = `${currentOrigin}/api/v1`;
  switch (lang) {
    case 'csharp':
      return `using System;
using System.Threading.Tasks;
using HabitAuth;

class Program
{
    static async Task Main(string[] args)
    {
        // 1. Initialize HabitAuth with Dashboard Credentials
        var auth = new HabitAuthApp("MyApplication", "app_8a920dfa12b4", "app_secret_here", "1.0.0");

        // Handshake with server & anti-tamper check
        if (!await auth.Init())
        {
            Console.WriteLine($"[!] Handshake failed: {auth.LastResponse.Message}");
            return;
        }

        // 2. Perform Login with automatic SHA-256 HWID generation
        bool success = await auth.Login("customer_username", "Password@123");

        if (success)
        {
            Console.WriteLine($"[+] Access Granted! Welcome {auth.User.Username}");
            Console.WriteLine($"[+] Subscription expires: {auth.User.ExpiresAt}");
            Console.WriteLine($"[+] Bound HWID: {auth.User.Hwid}");

            // 3. Start background heartbeat telemetry
            auth.StartHeartbeat(30);
        }
        else if (auth.LastResponse.ErrorCode == "ACCOUNT_TEMPORARILY_LOCKED")
        {
            Console.WriteLine($"[!] Account locked for 24 hours: {auth.LastResponse.RemainingLockoutHours}h remaining.");
        }
        else
        {
            Console.WriteLine($"[-] Authentication Failed: {auth.LastResponse.Message}");
        }
    }
}`;

    case 'cpp':
      return `#include <iostream>
#include "HabitAuth.hpp"

int main()
{
    // 1. Initialize Native C++ Client with dashboard credentials
    HabitAuth::Client auth("MyApplication", "app_8a920dfa12b4", "app_secret_here", "1.0.0");

    // Handshake with server
    if (!auth.Init())
    {
        std::cout << "[!] Handshake failed: " << auth.last_response.message << "\\n";
        return 1;
    }

    // 2. Login with Hardware ID locking (or auth.License("HABIT-XXXX") for 1-key login)
    if (auth.Login("client_user", "MyPassword123!"))
    {
        std::cout << "[+] Logged in successfully! Welcome " << auth.user.username << "\\n";
        std::cout << "[+] Session Token: " << auth.session_token << "\\n";
        std::cout << "[+] Bound HWID: " << auth.user.hwid << "\\n";

        // 3. Start background heartbeat telemetry
        auth.StartHeartbeat(30);
    }
    else
    {
        std::cout << "[-] Login failed: " << auth.last_response.message << "\\n";
    }
    return 0;
}`;

    case 'python':
      return `from habit_auth import HabitAuth

# 1. Initialize client with dashboard credentials
auth = HabitAuth("MyApplication", "app_8a920dfa12b4", version="1.0.0")

# Handshake & server status check
ok, msg = auth.init()
if not ok:
    print(f"[!] Handshake failed: {msg}")
    exit(1)

# 2. Authenticate user with automatic HWID detection
success, msg = auth.login("customer_username", "Password@123")
if success:
    print(f"[+] Access granted to {auth.user['username']}")
    print(f"[+] Session Token: {auth.session_token}")
    print(f"[+] Bound HWID: {auth.user.get('hwid')}")

    # 3. Start background heartbeat telemetry
    auth.start_heartbeat(interval=30)
else:
    print(f"[-] Authentication failed: {msg}")`;

    case 'nodejs':
      return `const HabitAuth = require('./HabitAuth.js');

const auth = new HabitAuth({
  appName: 'MyApplication',
  appId: 'app_8a920dfa12b4',
  appSecret: 'app_secret_here',
  version: '1.0.0'
});

async function run() {
  // 1. Handshake with server
  const ok = await auth.init();
  if (!ok) {
    console.error('[!] Handshake failed:', auth.lastResponse.message);
    return;
  }

  // 2. Authenticate user
  const success = await auth.login('customer_user', 'MySecretPassword');
  if (success) {
    console.log('[+] Logged in! Welcome:', auth.user.username);
    console.log('[+] Session Token:', auth.sessionToken);

    // 3. Start background heartbeat telemetry
    auth.startHeartbeat(30);
  } else {
    console.error('[-] Login failed:', auth.lastResponse.message);
  }
}
run();`;

    case 'go':
      return `package main

import (
	"fmt"
	"habitauth"
)

func main() {
	// 1. Initialize Go client with dashboard credentials
	client := habitauth.NewClient("MyApplication", "app_8a920dfa12b4", "app_secret_here", "1.0.0", "${apiBase}")

	// Handshake with server
	ok, err := client.Init("")
	if !ok || err != nil {
		fmt.Printf("[!] Handshake failed: %v\\n", err)
		return
	}

	// 2. User authentication with HWID binding
	loggedIn, err := client.Login("customer_username", "Password@123")
	if loggedIn {
		fmt.Printf("[+] Welcome, %s!\\n", client.User.Username)
		fmt.Printf("[+] Session Token: %s\\n", client.SessionToken)
		fmt.Printf("[+] Machine HWID: %s\\n", client.User.HWID)

		// 3. Start background heartbeat telemetry
		client.StartHeartbeat(30)
	} else {
		fmt.Printf("[-] Authentication failed: %v\\n", client.LastResponse.Message)
	}
}`;

    case 'rust':
      return `use std::error::Error;
mod habit_auth;
use habit_auth::HabitAuth;

fn main() -> Result<(), Box<dyn Error>> {
    // 1. Initialize client with dashboard credentials
    let mut auth = HabitAuth::new(
        "MyApplication",
        "app_8a920dfa12b4",
        "app_secret_here",
        "1.0.0",
        "${apiBase}",
    );

    // Handshake with server
    if !auth.init(None)? {
        eprintln!("[!] Handshake failed: {:?}", auth.last_response.message);
        return Ok(());
    }

    // 2. User authentication with HWID binding
    if auth.login("customer_username", "Password@123")? {
        println!("[+] Logged in! Welcome {:?}", auth.user.as_ref().map(|u| &u.username));
        println!("[+] Session Token: {:?}", auth.session_token);
    } else {
        eprintln!("[-] Authentication failed: {:?}", auth.last_response.message);
    }

    Ok(())
}`;

    case 'curl':
      return `# 1. User Login with HWID check
curl -X POST ${apiBase}/client/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "app_8a920dfa12b4",
    "username": "customer_one",
    "password": "Password123!",
    "hwid": "7A1F-9E02-8BC4-31D9"
  }'

# 2. 1-Key License Login (instant authentication)
curl -X POST ${apiBase}/client/license \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "app_8a920dfa12b4",
    "license_key": "HABIT-F7C7-E087-6D48-AE47",
    "hwid": "7A1F-9E02-8BC4-31D9"
  }'

# 3. Validate License Key
curl -X POST ${apiBase}/license/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "app_8a920dfa12b4",
    "license_key": "HABIT-F7C7-E087-6D48-AE47"
  }'

# 4. Self-Service HWID Reset
curl -X POST ${apiBase}/client/reset-hwid \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "app_8a920dfa12b4",
    "username": "customer_one"
  }'`;

    default:
      return '';
  }
}
