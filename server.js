const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { exec, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

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
            // Log raw message for debugging
            console.log('Raw message received:', message.toString());
            const data = JSON.parse(message.toString());
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

// Path to our custom high-speed robot
const KEY_ROBOT_PATH = path.join(__dirname, 'scripts', 'KeyRobot.exe');

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
    const { action = 'press', key, modifiers = [] } = data;
    console.log(`Processing keyboard action: ${action}, key: ${key}, modifiers: ${modifiers}`);
    
    // Platform-specific keyboard commands
    if (platform === 'win32') {
        // Windows
        
        // Map common keys to the format KeyRobot expects (SendKeys)
        const keyMap = {
            'space': ' ',
            'enter': '{ENTER}',
            'tab': '{TAB}',
            'esc': '{ESC}',
            'escape': '{ESC}',
            'up': '{UP}',
            'down': '{DOWN}',
            'left': '{LEFT}',
            'right': '{RIGHT}',
            'backspace': '{BACKSPACE}',
            'delete': '{DELETE}',
            'home': '{HOME}',
            'end': '{END}',
            'pgup': '{PGUP}',
            'pgdn': '{PGDN}',
            'f1': '{F1}', 'f2': '{F2}', 'f3': '{F3}', 'f4': '{F4}', 'f5': '{F5}', 'f6': '{F6}',
            'f7': '{F7}', 'f8': '{F8}', 'f9': '{F9}', 'f10': '{F10}', 'f11': '{F11}', 'f12': '{F12}'
        };

        let script = '';
        if (modifiers.includes('ctrl')) script += '^';
        if (modifiers.includes('alt')) script += '%';
        if (modifiers.includes('shift')) script += '+';
        
        const mappedKey = keyMap[key.toLowerCase()] || key;
        
        switch (action) {
            case 'press':
                // Try our custom KeyRobot first (it's very fast and native)
                if (fs.existsSync(KEY_ROBOT_PATH)) {
                    let finalKey = mappedKey;
                    // Escape special characters if not already mapped
                    if (!keyMap[key.toLowerCase()] && ['+', '^', '%', '~', '(', ')', '{', '}'].includes(finalKey)) {
                        finalKey = `{${finalKey}}`;
                    }
                    
                    const fullCommand = `${script}${finalKey}`;
                    console.log(`Using KeyRobot: ${fullCommand}`);
                    // Use double quotes for the entire command to handle paths and arguments correctly
                    exec(`scripts\\KeyRobot.exe "${fullCommand}"`, (error, stdout, stderr) => {
                        if (error) console.error('KeyRobot Error:', error);
                        if (stdout) console.log('KeyRobot Output:\n', stdout);
                        if (stderr) console.error('KeyRobot Stderr:\n', stderr);
                    });
                    return;
                }

                // Try node-key-sender if available (faster and more robust if Java exists)
                if (typeof keySender !== 'undefined' && action === 'press') {
                    try {
                        const modifierMap = { 'ctrl': 'control', 'alt': 'alt', 'shift': 'shift' };
                        const mods = modifiers.map(m => modifierMap[m] || m);
                        console.log(`Attempting node-key-sender: ${key}, mods: ${mods}`);
                        // Add a small delay for node-key-sender too
                        setTimeout(() => {
                            keySender.sendKey(key.toLowerCase(), mods);
                        }, 100);
                        return;
                    } catch (e) {
                        console.log('node-key-sender failed, falling back to PowerShell:', e.message);
                    }
                }

                // Fallback to PowerShell
                const psCommand = `powershell -command "Start-Sleep -m 100; $wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${script}${mappedKey}')"`;
                exec(psCommand);
                break;
            case 'type':
                // Type command
                if (fs.existsSync(KEY_ROBOT_PATH)) {
                    // Send text with special characters escaped
                    const escapedText = data.text.replace(/[\+\^\%\~\(\)\{\}\[\]]/g, '{$&}');
                    exec(`scripts\\KeyRobot.exe "${escapedText}"`, (error, stdout, stderr) => {
                        if (error) console.error('KeyRobot Error (type):', error);
                    });
                    return;
                }
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