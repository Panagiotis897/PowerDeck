using System;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Threading;

class KeyRobot {
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [STAThread]
    static void Main(string[] args) {
        if (args.Length == 0) return;

        string text = args[0];
        
        // 1. Give the user time to switch focus (300ms)
        Thread.Sleep(300);

        try {
            if (text.Contains("${selection}")) {
                // HANDLE SELECTION WRAPPING
                
                // Clear clipboard first to avoid old data
                Clipboard.Clear();
                
                // Trigger Copy (Ctrl+C)
                SendKeys.SendWait("^c");
                Thread.Sleep(100); // Wait for OS to process copy

                // Get copied text
                string selectedText = "";
                if (Clipboard.ContainsText()) {
                    selectedText = Clipboard.GetText();
                }

                // Replace placeholder
                string finalText = text.Replace("${selection}", selectedText);
                
                // Type the final text
                // We use Clipboard again for pasting to be faster and support complex chars
                Clipboard.SetText(finalText);
                SendKeys.SendWait("^v");
            } else {
                // STANDARD TYPING
                // For long text, using Clipboard + Ctrl+V is much more reliable than SendKeys
                if (text.Length > 10) {
                    Clipboard.SetText(text);
                    SendKeys.SendWait("^v");
                } else {
                    SendKeys.SendWait(text);
                }
            }
        } catch (Exception e) {
            Console.WriteLine("Error: " + e.Message);
        }
    }
}
