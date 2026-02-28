const fs = require('fs');
const path = require('path');

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PowerDeck</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <div class="glass-container">
        <aside class="nav-rail">
            <div class="logo">
                <span class="logo-icon">🚀</span>
            </div>
            <nav>
                <button class="nav-item active" title="Dashboard" onclick="showView('dashboard')">
                    <span class="icon">📊</span>
                </button>
                <button class="nav-item" title="Layout Editor" onclick="showView('editor')">
                    <span class="icon">🎨</span>
                </button>
                <button class="nav-item" title="Settings" onclick="showView('settings')">
                    <span class="icon">⚙️</span>
                </button>
            </nav>
            <div class="status-indicator" id="connectionStatus">
                <div class="dot"></div>
            </div>
        </aside>

        <main class="content-area">
            <header class="top-bar">
                <div class="header-left">
                    <h1 id="viewTitle">Dashboard</h1>
                    <p class="subtitle">Welcome back, Commander.</p>
                </div>
                <div class="header-right">
                    <div class="live-clock" id="liveClock">00:00:00</div>
                </div>
            </header>

            <section id="dashboardView" class="view-section active">
                <div class="dashboard-grid">
                    <div class="grid-container" id="buttonGrid">
                        <!-- Buttons injected by dashboard.ts -->
                    </div>
                </div>
                
                <div class="widgets-area" id="widgetsArea">
                    <div class="section-header">
                        <h2>Active Widgets</h2>
                        <button class="btn-text" onclick="showWidgetEditor()">+ Add Widget</button>
                    </div>
                    <div class="widgets-grid" id="widgetsContainer">
                        <!-- Widgets injected by dashboard.ts -->
                    </div>
                </div>
            </section>

            <section id="editorView" class="view-section">
                <!-- Layout Editor Content -->
                <div class="editor-placeholder">
                    <h2>Grid Configurator</h2>
                    <div class="settings-card">
                         <label>
                            Grid Size:
                            <select id="gridSize">
                                <option value="3">3x3</option>
                                <option value="4" selected>4x4</option>
                                <option value="5">5x5</option>
                                <option value="6">6x6</option>
                            </select>
                        </label>
                        <label>
                            Button Size:
                            <input type="range" id="buttonSize" min="50" max="200" value="100">
                            <span id="buttonSizeVal">100px</span>
                        </label>
                        <button class="btn-primary" onclick="saveSettings()">Apply Changes</button>
                    </div>
                    <button class="btn-outline add-btn-large" onclick="addNewButton()">+ Create New Button</button>
                </div>
            </section>

            <section id="settingsView" class="view-section">
                <h2>Application Settings</h2>
                <div class="settings-list">
                    <div class="settings-card">
                        <h3>Profile Management</h3>
                        <label>
                            Active Profile:
                            <select id="activeProfileSelect" onchange="switchProfile(this.value)">
                                <!-- Options injected by dashboard.ts -->
                            </select>
                        </label>
                        <div class="form-group" style="display: flex; gap: 10px; margin-top: 10px;">
                            <input type="text" id="newProfileName" placeholder="New Profile Name..." style="flex: 1;">
                            <button class="btn-primary" onclick="createNewProfile()">Create</button>
                        </div>
                    </div>

                    <div class="settings-card">
                        <h3>Configuration Portability</h3>
                        <p style="color: var(--text-dim); margin-bottom: 15px;">Export your setup to a JSON file or import a backup.</p>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-outline" onclick="exportConfig()" style="flex: 1;">Export JSON</button>
                            <button class="btn-outline" onclick="document.getElementById('importFile').click()" style="flex: 1;">Import JSON</button>
                            <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importConfig(event)">
                        </div>
                    </div>

                    <div class="settings-card">
                        <h3>Preference Controls</h3>
                        <label>
                            Glassmorphism Intensity:
                            <input type="range" id="glassIntensity" min="0" max="100" value="30">
                        </label>
                        <label>
                            Accent Color:
                            <input type="color" id="accentColor" value="#6366f1">
                        </label>
                    </div>
                    <div class="settings-card">
                        <h3>Data Management</h3>
                        <p style="color: var(--text-dim); margin-bottom: 15px;">Danger Zone - This actions cannot be undone.</p>
                        <button class="btn-primary" style="background: var(--danger)" onclick="resetAllData()">Reset All Data</button>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Button Editor Modal -->
    <div id="buttonEditor" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h2 id="btnEditorTitle">New Button</h2>
                <button class="close-btn" onclick="closeButtonEditor()">&times;</button>
            </div>
            <form id="buttonForm">
                <input type="hidden" id="editBtnIndex" value="-1">
                <div class="form-group">
                    <label>Icon (Emoji)</label>
                    <input type="text" id="btnIcon" placeholder="🎵" required>
                </div>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="btnLabel" placeholder="Play Music" required>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select id="btnType" onchange="toggleBtnFields()">
                        <option value="keyboard">Keyboard Shortcut</option>
                        <option value="system">System Command / URL</option>
                    </select>
                </div>
                
                <div id="keyboardFields">
                    <div class="form-group">
                        <label>Key</label>
                        <input type="text" id="btnKey" placeholder="space">
                    </div>
                    <div class="form-group">
                        <label>Shortcut Hint (displayed)</label>
                        <input type="text" id="btnShortcut" placeholder="SPC">
                    </div>
                </div>

                <div id="systemFields" style="display: none;">
                    <div class="form-group">
                        <label>Action</label>
                        <select id="btnAction">
                            <option value="command">Command Line</option>
                            <option value="open">Open URL/File</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Command/URL</label>
                        <input type="text" id="btnCommand" placeholder="https://google.com">
                    </div>
                </div>

                <button type="submit" class="btn-primary">Save Button</button>
            </form>
        </div>
    </div>

    <!-- Widget Editor Modal -->
    <div id="widgetEditor" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h2>New Widget</h2>
                <button class="close-btn" onclick="closeWidgetEditor()">&times;</button>
            </div>
            <form id="widgetForm">
                <div class="form-group">
                    <label>Widget Name</label>
                    <input type="text" id="widgetName" placeholder="CPU Monitor..." required>
                </div>
                <div class="form-group">
                    <label>HTML</label>
                    <textarea id="widgetHtml" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>CSS</label>
                    <textarea id="widgetCss" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>JS</label>
                    <textarea id="widgetJs" rows="3"></textarea>
                </div>
                <button type="submit" class="btn-primary">Create</button>
            </form>
        </div>
    </div>

    <script src="js/config.js"></script>
    <script src="js/websocket.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>`;

const DASHBOARD_CSS = `:root {
    --bg-color: #0c0d12;
    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.08);
    --accent-color: #6366f1;
    --accent-glow: rgba(99, 102, 241, 0.4);
    --text-main: #f8fafc;
    --text-dim: #94a3b8;
    --success: #10b981;
    --danger: #ef4444;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Outfit', sans-serif;
    background-color: var(--bg-color);
    background-image: 
        radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
    color: var(--text-main);
    min-height: 100vh;
    overflow: hidden;
}

.glass-container {
    display: flex;
    height: 100vh;
    padding: 20px;
}

/* Nav Rail */
.nav-rail {
    width: 80px;
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    margin-right: 20px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.logo {
    font-size: 24px;
    margin-bottom: 40px;
}

nav {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
}

.nav-item {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-main);
    transform: translateY(-2px);
}

.nav-item.active {
    background: var(--accent-color);
    color: white;
    box-shadow: 0 0 15px var(--accent-glow);
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--danger);
    position: relative;
}

.status-indicator.connected {
    background: var(--success);
}

.status-indicator .dot::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

/* Content Area */
.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
}

h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(to right, #fff, #94a3b8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    font-size: 14px;
    color: var(--text-dim);
    font-weight: 300;
}

.live-clock {
    font-family: monospace;
    font-size: 18px;
    background: var(--glass-bg);
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid var(--glass-border);
}

/* View Sections */
.view-section {
    display: none;
    opacity: 0;
    transition: opacity 0.4s ease;
}

.view-section.active {
    display: block;
    opacity: 1;
}

/* Dashboard Grid */
.dashboard-grid {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 30px;
    backdrop-filter: blur(4px);
}

.grid-container {
    display: grid;
    gap: 20px;
    justify-content: center;
}

/* Stream Button */
.stream-button {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    overflow: hidden;
}

.stream-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s;
}

.stream-button:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.stream-button .delete-btn {
    position: absolute;
    top: 5px;
    left: 5px;
    width: 20px;
    height: 20px;
    background: var(--danger);
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    opacity: 0;
    transition: 0.2s;
    z-index: 10;
}

.stream-button:hover .delete-btn { opacity: 1; }
.stream-button .delete-btn:hover { transform: scale(1.2); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
.stream-button:hover::before { opacity: 1; }

.stream-button .icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
}

.stream-button .label {
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    color: var(--text-main);
}

.stream-button .shortcut {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 10px;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-dim);
}

/* Widgets */
.widgets-area { margin-top: 20px; }
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.widgets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.widget-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 18px;
    padding: 20px;
    min-height: 150px;
    position: relative;
    transition: 0.3s;
}

.widget-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--glass-border);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
}

.settings-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
}

.settings-card h3 {
    margin-bottom: 20px;
    font-size: 18px;
    color: var(--accent-color);
}

.settings-card label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 20px;
    color: var(--text-dim);
    font-size: 15px;
}

.settings-card input[type="range"] { flex: 0 0 200px; }
.settings-card input[type="color"] {
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
}

select {
    background: #1e1e2d;
    color: var(--text-main);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: inherit;
    cursor: pointer;
}

select option { background: #1e1e2d; color: var(--text-main); padding: 10px; }

/* Buttons */
.btn-primary {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--accent-glow);
}

.btn-text {
    background: transparent;
    border: none;
    color: var(--accent-color);
    font-weight: 600;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    transition: 0.2s;
}

.btn-text:hover { background: rgba(99, 102, 241, 0.1); }

.btn-outline {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: var(--text-main);
    padding: 10px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;
}

.btn-outline:hover { background: var(--glass-bg); border-color: var(--text-dim); }

/* Modals */
.modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal-card {
    background: #1a1b26;
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    width: 100%;
    max-width: 500px;
    padding: 30px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.close-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

.close-btn:hover {
    color: var(--text-main);
    background: rgba(255, 255, 255, 0.05);
    transform: rotate(90deg);
}

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-dim); }
.form-group input, .form-group textarea {
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 12px;
    color: white;
    font-family: inherit;
}

/* Custom Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }`;

const DASHBOARD_TS = `interface Button {
    icon: string;
    label: string;
    type: string;
    key?: string;
    modifiers?: string[];
    action?: string;
    command?: string;
    text?: string;
    customData?: any;
    shortcut?: string;
}

interface Widget {
    name: string;
    html: string;
    css: string;
    js: string;
}

class Dashboard {
    private buttons: Button[] = [];
    private widgets: Widget[] = [];
    private settings: { gridSize: number; buttonSize: number; accentColor: string; glassIntensity: number } = {
        gridSize: 4,
        buttonSize: 100,
        accentColor: '#6366f1',
        glassIntensity: 30
    };
    private activeProfile: string = 'Default';
    private profiles: { [name: string]: { buttons: Button[], widgets: Widget[], settings: any } } = {};

    constructor() {
        this.loadProfiles();
        this.applyTheme();
        this.renderDashboard();
        this.initClock();
        this.setupEventListeners();
        this.updateConnectionStatus((window as any).isConnected || false);
    }

    private loadProfiles(): void {
        const savedProfiles = localStorage.getItem('streamDeckProfiles');
        const active = localStorage.getItem('streamDeckActiveProfile');
        
        if (savedProfiles) {
            this.profiles = JSON.parse(savedProfiles);
            this.activeProfile = active || 'Default';
            this.loadActiveProfile();
        } else {
            // First time setup - migrate or create default
            this.activeProfile = 'Default';
            this.loadLegacyData();
            this.saveAllData();
        }
        this.updateProfileSelect();
    }

    private loadActiveProfile(): void {
        const data = this.profiles[this.activeProfile];
        if (data) {
            this.buttons = data.buttons || [];
            this.widgets = data.widgets || [];
            this.settings = { ...this.settings, ...(data.settings || {}) };
        }
    }

    private loadLegacyData(): void {
        // Try to load from old individual keys
        const b = localStorage.getItem('streamDeckButtons');
        const w = localStorage.getItem('streamDeckWidgets');
        const s = localStorage.getItem('streamDeckSettings');
        
        this.buttons = b ? JSON.parse(b) : [
            { icon: '🎵', label: 'Play/Pause', type: 'keyboard', key: 'space', modifiers: [], shortcut: 'SPC' },
            { icon: '⏭️', label: 'Next Track', type: 'keyboard', key: 'right', modifiers: ['ctrl', 'alt'], shortcut: 'CTR+ALT+R' },
            { icon: '🌐', label: 'Browser', type: 'system', action: 'open', command: 'https://www.google.com' },
            { icon: '🔒', label: 'Lock PC', type: 'system', action: 'command', command: 'rundll32.exe user32.dll,LockWorkStation' }
        ];

        this.widgets = w ? JSON.parse(w) : [
            {
                name: 'Digital Clock',
                html: '<div class="widget-clock" id="w-clock">00:00:00</div>',
                css: '.widget-clock { font-size: 2.5rem; font-weight: 700; text-align: center; color: var(--accent-color); text-shadow: 0 0 20px var(--accent-glow); padding: 20px; font-family: "Outfit"; }',
                js: 'setInterval(() => { const el = document.getElementById("w-clock"); if(el) el.textContent = new Date().toLocaleTimeString(); }, 1000);'
            },
            {
                name: 'System Monitor',
                html: '<div class="sys-mon">' +
                    '<div class="stat"><label>CPU</label><div class="bar"><div class="fill" style="width: 42%"></div></div></div>' +
                    '<div class="stat"><label>RAM</label><div class="bar"><div class="fill" style="width: 68%"></div></div></div>' +
                '</div>',
                css: '.sys-mon { display: flex; flex-direction: column; gap: 10px; padding: 10px; } .stat { display: flex; align-items: center; gap: 10px; } .stat label { width: 40px; font-size: 12px; } .bar { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; } .fill { height: 100%; background: var(--accent-color); border-radius: 3px; box-shadow: 0 0 10px var(--accent-glow); }',
                js: ''
            },
            {
                name: 'Now Playing',
                html: '<div class="player-mock">' +
                    '<div class="art">🎵</div>' +
                    '<div class="info">' +
                        '<div class="title">Starlight</div>' +
                        '<div class="artist">Muse</div>' +
                    '</div>' +
                '</div>',
                css: '.player-mock { display: flex; align-items: center; gap: 15px; padding: 10px; } .art { width: 50px; height: 50px; background: #222; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; } .title { font-weight: 600; } .artist { font-size: 12px; color: var(--text-dim); }',
                js: ''
            }
        ];
        
        if (s) this.settings = { ...this.settings, ...JSON.parse(s) };
        
        this.profiles['Default'] = {
            buttons: this.buttons,
            widgets: this.widgets,
            settings: this.settings
        };
    }

    private applyTheme(): void {
        document.documentElement.style.setProperty('--accent-color', this.settings.accentColor);
        document.documentElement.style.setProperty('--accent-glow', \`\${this.settings.accentColor}66\`);
        document.documentElement.style.setProperty('--glass-bg', \`rgba(255, 255, 255, \${this.settings.glassIntensity / 1000})\`);
    }

    private renderDashboard(): void {
        this.renderButtons();
        this.renderWidgets();
    }

    private renderButtons(): void {
        const grid = document.getElementById('buttonGrid');
        if (!grid) return;

        grid.style.gridTemplateColumns = \`repeat(\${this.settings.gridSize}, \${this.settings.buttonSize}px)\`;
        grid.style.gridAutoRows = \`\${this.settings.buttonSize}px\`;

        grid.innerHTML = '';

        this.buttons.forEach((button, index) => {
            const buttonEl = document.createElement('div');
            buttonEl.className = 'stream-button';
            buttonEl.innerHTML = \`
                <button class="delete-btn" onclick="event.stopPropagation(); window.dashboardInstance.removeButton(\${index})">&times;</button>
                <span class="icon">\${button.icon}</span>
                <span class="label">\${button.label}</span>
                \${button.shortcut ? \`<span class="shortcut">\${button.shortcut}</span>\` : ''}
            \`;

            buttonEl.onclick = () => this.executeButtonAction(button);
            buttonEl.oncontextmenu = (e) => {
                e.preventDefault();
                this.editButton(index);
            };

            grid.appendChild(buttonEl);
        });
    }

    private renderWidgets(): void {
        const container = document.getElementById('widgetsContainer');
        if (!container) return;

        container.innerHTML = '';

        this.widgets.forEach((widget, index) => {
            const widgetEl = document.createElement('div');
            widgetEl.className = 'widget-card';
            widgetEl.innerHTML = \`
                <div class="widget-header">
                    <h3>\${widget.name}</h3>
                    <button onclick="window.dashboardInstance.removeWidget(\${index})" class="btn-text" style="color: var(--danger)">Remove</button>
                </div>
                <div class="widget-content" id="widget-\${index}"></div>
            \`;

            container.appendChild(widgetEl);

            const contentEl = document.getElementById(\`widget-\${index}\`);
            if (contentEl) contentEl.innerHTML = widget.html;

            const styleId = \`style-widget-\${index}\`;
            if (!document.getElementById(styleId)) {
                const styleEl = document.createElement('style');
                styleEl.id = styleId;
                styleEl.textContent = widget.css;
                document.head.appendChild(styleEl);
            }

            if (widget.js) {
                const scriptEl = document.createElement('script');
                scriptEl.textContent = widget.js;
                document.body.appendChild(scriptEl);
            }
        });
    }

    private setupEventListeners(): void {
        document.getElementById('widgetForm')?.addEventListener('submit', (e) => this.createWidget(e));
        document.getElementById('buttonForm')?.addEventListener('submit', (e) => this.handleButtonSubmit(e));

        const accentInput = document.getElementById('accentColor') as HTMLInputElement;
        if (accentInput) {
            accentInput.value = this.settings.accentColor;
            accentInput.oninput = (e) => {
                this.settings.accentColor = (e.target as HTMLInputElement).value;
                this.applyTheme();
            };
        }

        const glassInput = document.getElementById('glassIntensity') as HTMLInputElement;
        if (glassInput) {
            glassInput.value = this.settings.glassIntensity.toString();
            glassInput.oninput = (e) => {
                this.settings.glassIntensity = parseInt((e.target as HTMLInputElement).value);
                this.applyTheme();
            };
        }

        const gridSizeSelect = document.getElementById('gridSize') as HTMLSelectElement;
        if (gridSizeSelect) {
            gridSizeSelect.value = this.settings.gridSize.toString();
            gridSizeSelect.onchange = (e) => {
                this.settings.gridSize = parseInt((e.target as HTMLSelectElement).value);
                this.renderButtons();
            };
        }

        const buttonSizeRange = document.getElementById('buttonSize') as HTMLInputElement;
        const buttonSizeVal = document.getElementById('buttonSizeVal');
        if (buttonSizeRange) {
            buttonSizeRange.value = this.settings.buttonSize.toString();
            buttonSizeRange.oninput = (e) => {
                const val = (e.target as HTMLInputElement).value;
                this.settings.buttonSize = parseInt(val);
                if (buttonSizeVal) buttonSizeVal.textContent = val + 'px';
                this.renderButtons();
            };
        }
    }

    private initClock(): void {
        const clockEl = document.getElementById('liveClock');
        if (!clockEl) return;
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString();
        }, 1000);
    }

    public updateConnectionStatus(connected: boolean): void {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            if (connected) statusEl.classList.add('connected');
            else statusEl.classList.remove('connected');
        }
    }

    private executeButtonAction(button: Button): void {
        if (typeof (window as any).sendCommand === 'function') {
            (window as any).sendCommand(button);
        } else {
            console.log('Sending command:', button);
        }
        
        const target = event?.currentTarget as HTMLElement;
        if (target) {
            target.style.transform = 'scale(0.92)';
            setTimeout(() => target.style.transform = '', 100);
        }
    }

    public addNewButton(): void {
        const modal = document.getElementById('buttonEditor');
        const form = document.getElementById('buttonForm') as HTMLFormElement;
        const title = document.getElementById('btnEditorTitle');
        const indexInput = document.getElementById('editBtnIndex') as HTMLInputElement;

        if (modal && form && title) {
            form.reset();
            title.textContent = 'New Button';
            indexInput.value = '-1';
            modal.style.display = 'flex';
            (window as any).toggleBtnFields();
        }
    }

    public editButton(index: number): void {
        const button = this.buttons[index];
        const modal = document.getElementById('buttonEditor');
        const title = document.getElementById('btnEditorTitle');
        const indexInput = document.getElementById('editBtnIndex') as HTMLInputElement;

        if (modal && title) {
            title.textContent = 'Edit Button';
            indexInput.value = index.toString();
            
            (document.getElementById('btnIcon') as HTMLInputElement).value = button.icon;
            (document.getElementById('btnLabel') as HTMLInputElement).value = button.label;
            (document.getElementById('btnType') as HTMLSelectElement).value = button.type;
            
            if (button.type === 'keyboard') {
                (document.getElementById('btnKey') as HTMLInputElement).value = button.key || '';
                (document.getElementById('btnShortcut') as HTMLInputElement).value = button.shortcut || '';
            } else if (button.type === 'system') {
                (document.getElementById('btnAction') as HTMLSelectElement).value = button.action || 'command';
                (document.getElementById('btnCommand') as HTMLInputElement).value = button.command || '';
            }

            modal.style.display = 'flex';
            (window as any).toggleBtnFields();
        }
    }

    private handleButtonSubmit(event: Event): void {
        event.preventDefault();
        const index = parseInt((document.getElementById('editBtnIndex') as HTMLInputElement).value);
        
        const button: Button = {
            icon: (document.getElementById('btnIcon') as HTMLInputElement).value,
            label: (document.getElementById('btnLabel') as HTMLInputElement).value,
            type: (document.getElementById('btnType') as HTMLSelectElement).value
        };

        if (button.type === 'keyboard') {
            button.key = (document.getElementById('btnKey') as HTMLInputElement).value;
            button.shortcut = (document.getElementById('btnShortcut') as HTMLInputElement).value;
        } else {
            button.action = (document.getElementById('btnAction') as HTMLSelectElement).value;
            button.command = (document.getElementById('btnCommand') as HTMLInputElement).value;
        }

        if (index === -1) {
            this.buttons.push(button);
        } else {
            this.buttons[index] = button;
        }

        this.saveButtons();
        this.renderButtons();
        this.closeButtonEditor();
    }

    public closeButtonEditor(): void {
        const modal = document.getElementById('buttonEditor');
        if (modal) modal.style.display = 'none';
    }

    private createWidget(event: Event): void {
        event.preventDefault();
        const widget = {
            name: (document.getElementById('widgetName') as HTMLInputElement).value,
            html: (document.getElementById('widgetHtml') as HTMLTextAreaElement).value,
            css: (document.getElementById('widgetCss') as HTMLTextAreaElement).value,
            js: (document.getElementById('widgetJs') as HTMLTextAreaElement).value
        };
        this.widgets.push(widget);
        this.saveWidgets();
        this.renderWidgets();
        this.closeWidgetEditor();
    }

    public removeWidget(index: number): void {
        if (confirm('Delete this widget?')) {
            this.widgets.splice(index, 1);
            this.saveWidgets();
            this.renderWidgets();
        }
    }

    public removeButton(index: number): void {
        if (confirm('Delete this button?')) {
            this.buttons.splice(index, 1);
            this.saveButtons();
            this.renderButtons();
        }
    }

    public closeWidgetEditor(): void {
        const editor = document.getElementById('widgetEditor');
        if (editor) editor.style.display = 'none';
        (document.getElementById('widgetForm') as HTMLFormElement)?.reset();
    }

    private saveAllData(): void {
        this.profiles[this.activeProfile] = {
            buttons: this.buttons,
            widgets: this.widgets,
            settings: this.settings
        };
        localStorage.setItem('streamDeckProfiles', JSON.stringify(this.profiles));
        localStorage.setItem('streamDeckActiveProfile', this.activeProfile);
    }

    private updateProfileSelect(): void {
        const select = document.getElementById('activeProfileSelect') as HTMLSelectElement;
        if (!select) return;
        select.innerHTML = '';
        Object.keys(this.profiles).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            option.selected = (name === this.activeProfile);
            select.appendChild(option);
        });
    }

    public switchProfile(name: string): void {
        if (name === this.activeProfile) return;
        this.saveAllData();
        this.activeProfile = name;
        this.loadActiveProfile();
        this.applyTheme();
        this.renderDashboard();
        this.updateProfileSelect();
    }

    public createNewProfile(): void {
        const input = document.getElementById('newProfileName') as HTMLInputElement;
        const name = input?.value.trim();
        if (!name) return;
        if (this.profiles[name]) {
            alert('Profile already exists!');
            return;
        }
        
        // Create new profile with current settings but empty buttons/widgets
        this.profiles[name] = {
            buttons: [],
            widgets: [],
            settings: { ...this.settings }
        };
        input.value = '';
        this.switchProfile(name);
    }

    public exportConfig(): void {
        this.saveAllData();
        const data = {
            profiles: this.profiles,
            activeProfile: this.activeProfile,
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`stream-deck-config-\${new Date().toISOString().split('T')[0]}.json\`;
        a.click();
        URL.revokeObjectURL(url);
    }

    public importConfig(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.profiles && data.activeProfile) {
                    this.profiles = data.profiles;
                    this.activeProfile = data.activeProfile;
                    this.saveAllData();
                    location.reload();
                } else {
                    alert('Invalid configuration file.');
                }
            } catch (err) {
                alert('Error parsing JSON.');
            }
        };
        reader.readAsText(file);
    }

    private saveButtons(): void {
        this.saveAllData();
    }

    private saveWidgets(): void {
        this.saveAllData();
    }

    public saveSettings(): void {
        this.saveAllData();
        alert('Configuration saved effectively!');
    }

    public resetAllData(): void {
        if (confirm('Are you absolutely sure? This will wipe all profiles and settings.')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Global hooks
(window as any).showView = (viewId: string) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId + 'View')?.classList.add('active');
    const navItem = document.querySelector(\`.nav-item[title="\${viewId.charAt(0).toUpperCase() + viewId.slice(1)}"]\`);
    if (navItem) navItem.classList.add('active');
    const titleEl = document.getElementById('viewTitle');
    if (titleEl) titleEl.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
};

(window as any).showWidgetEditor = () => {
    const editor = document.getElementById('widgetEditor');
    if (editor) editor.style.display = 'flex';
};

(window as any).closeWidgetEditor = () => (window as any).dashboardInstance.closeWidgetEditor();
(window as any).addNewButton = () => (window as any).dashboardInstance.addNewButton();
(window as any).closeButtonEditor = () => (window as any).dashboardInstance.closeButtonEditor();
(window as any).saveSettings = () => (window as any).dashboardInstance.saveSettings();
(window as any).resetAllData = () => (window as any).dashboardInstance.resetAllData();
(window as any).switchProfile = (name: string) => (window as any).dashboardInstance.switchProfile(name);
(window as any).createNewProfile = () => (window as any).dashboardInstance.createNewProfile();
(window as any).exportConfig = () => (window as any).dashboardInstance.exportConfig();
(window as any).importConfig = (e: Event) => (window as any).dashboardInstance.importConfig(e);

(window as any).toggleBtnFields = () => {
    const type = (document.getElementById('btnType') as HTMLSelectElement).value;
    const kb = document.getElementById('keyboardFields');
    const sys = document.getElementById('systemFields');
    if (kb && sys) {
        kb.style.display = type === 'keyboard' ? 'block' : 'none';
        sys.style.display = type === 'system' ? 'block' : 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize WebSocket if available
    if (typeof (window as any).connectWebSocket === 'function') {
        (window as any).connectWebSocket();
    }

    (window as any).dashboardInstance = new Dashboard();
    const oldUpdateStatus = (window as any).updateConnectionStatus;
    (window as any).updateConnectionStatus = (connected: boolean) => {
        if (oldUpdateStatus) oldUpdateStatus(connected);
        if ((window as any).dashboardInstance) (window as any).dashboardInstance.updateConnectionStatus(connected);
    };
});`;

// Write files
const publicPath = path.join(__dirname, '..', 'public');
const cssPath = path.join(publicPath, 'css');
const jsPath = path.join(publicPath, 'js');

// Ensure directories exist
[publicPath, cssPath, jsPath].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

fs.writeFileSync(path.join(publicPath, 'index.html'), DASHBOARD_HTML);
fs.writeFileSync(path.join(cssPath, 'dashboard.css'), DASHBOARD_CSS);
fs.writeFileSync(path.join(jsPath, 'dashboard.ts'), DASHBOARD_TS);

console.log('✅ Dashboard files generated successfully in /public');
