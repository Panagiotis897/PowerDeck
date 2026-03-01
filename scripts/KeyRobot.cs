using System;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Threading;

class KeyRobot {
    [DllImport("user32.dll")]
    static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    const int KEYEVENTF_EXTENDEDKEY = 0x0001;
    const int KEYEVENTF_KEYUP = 0x0002;

    static void Main(string[] args) {
        if (args.Length == 0) return;

        string command = args[0];
        Console.WriteLine("Target Key: " + command);

        // 1. Give the user time to switch windows if needed (300ms)
        Thread.Sleep(300);

        // 2. Check which window is currently active
        IntPtr activeWindow = GetForegroundWindow();
        Console.WriteLine("Active Window Handle: " + activeWindow);

        try {
            // Use SendKeys for the macro
            // We use SendWait to block until the key is processed
            SendKeys.SendWait(command);
            Console.WriteLine("SendWait complete.");
        } catch (Exception e) {
            Console.WriteLine("SendWait Error: " + e.Message);
        }
    }
}
