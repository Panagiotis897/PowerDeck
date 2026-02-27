const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { exec, spawn } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Store connected clients
const clients = new Set();

// Detect platform
const platform = os.platform();

// WebSocket connection handling
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total clients:', clients.size);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleCommand(data);
            
            // Broadcast to all clients except sender
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        ...data,
                        broadcast: true
                    }));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total clients:', clients.size);
    });
});

// Handle different types of commands
function handleCommand(data) {
    console.log('Received command:', data);
    
    switch (data.type) {
        case 'keyboard':
            handleKeyboardCommand(data);
            break;
        case 'system':
            handleSystemCommand(data);
            break;
        case 'custom':
            handleCustomCommand(data);
            break;
        default:
            console.log('Unknown command type:', data.type);
    }
}

function handleKeyboardCommand(data) {
    const { action, key, modifiers = [] } = data;
    
    // Platform-specific keyboard commands
    if (platform === 'win32') {
        // Windows
        let script = '';
        if (modifiers.includes('ctrl')) script += '^';
        if (modifiers.includes('alt')) script += '%';
        if (modifiers.includes('shift')) script += '+';
        
        switch (action) {
            case 'press':
                // Use PowerShell to send keys
                const psCommand = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${script}${key}')"`;
                exec(psCommand, (error) => {
                    if (error) console.error('Error sending keys:', error);
                });
                break;
            case 'type':
                const typeCommand = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${data.text}')"`;
                exec(typeCommand, (error) => {
                    if (error) console.error('Error typing text:', error);
                });
                break;
        }
    } else if (platform === 'darwin') {
        // macOS
        let script = 'osascript -e \'tell application "System Events" to ';
        if (modifiers.length > 0) {
            script += `key code ${getMacKeyCode(key)} using {${modifiers.join(', ')}}`;
        } else {
            script += `keystroke "${key}"`;
        }
        script += '\'';
        
        exec(script, (error) => {
            if (error) console.error('Error sending keys:', error);
        });
    } else {
        // Linux
        let command = 'xdotool ';
        if (modifiers.length > 0) {
            command += `key ${modifiers.join('+')}+${key}`;
        } else {
            command += `key ${key}`;
        }
        
        exec(command, (error) => {
            if (error) console.error('Error sending keys:', error);
        });
    }
}

function getMacKeyCode(key) {
    // Map common keys to macOS key codes
    const keyCodes = {
        'space': 49,
        'return': 36,
        'tab': 48,
        'delete': 51,
        'escape': 53,
        'left': 123,
        'right': 124,
        'down': 125,
        'up': 126
    };
    return keyCodes[key] || key;
}

function handleSystemCommand(data) {
    const { action, command } = data;
    
    switch (action) {
        case 'open':
            if (platform === 'win32') {
                exec(`start ${command}`, (error) => {
                    if (error) console.error('Error opening app:', error);
                });
            } else if (platform === 'darwin') {
                exec(`open ${command}`, (error) => {
                    if (error) console.error('Error opening app:', error);
                });
            } else {
                exec(command, (error) => {
                    if (error) console.error('Error executing command:', error);
                });
            }
            break;
        case 'command':
            exec(command, (error, stdout, stderr) => {
                if (error) console.error('Error executing command:', error);
                console.log('Command output:', stdout);
            });
            break;
    }
}

function handleCustomCommand(data) {
    // Handle custom widget commands
    console.log('Custom command:', data);
    // You can implement custom logic here
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on:`);
    console.log(`- Local: http://localhost:${PORT}`);
    
    // Get local IP address
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`- Network: http://${iface.address}:${PORT}`);
            }
        }
    }
});