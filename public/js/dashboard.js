"use strict";
class Dashboard {
    constructor() {
        this.buttons = [];
        this.widgets = [];
        this.settings = {
            gridSize: 4,
            buttonSize: 100,
            accentColor: '#6366f1',
            glassIntensity: 30,
            fitToScreen: false
        };
        this.activeProfile = 'Default';
        this.profiles = {};
        this.draggedButtonIndex = null;
        this.draggedWidgetIndex = null;
        this.loadProfiles();
        this.applyTheme();
        this.renderDashboard();
        this.initClock();
        this.setupEventListeners();
        this.updateConnectionStatus(window.isConnected || false);
    }
    loadProfiles() {
        const savedProfiles = localStorage.getItem('streamDeckProfiles');
        const active = localStorage.getItem('streamDeckActiveProfile');
        if (savedProfiles) {
            this.profiles = JSON.parse(savedProfiles);
            this.activeProfile = active || 'Default';
            this.loadActiveProfile();
        }
        else {
            // First time setup - migrate or create default
            this.activeProfile = 'Default';
            this.loadLegacyData();
            this.saveAllData();
        }
        this.updateProfileSelect();
    }
    loadActiveProfile() {
        const data = this.profiles[this.activeProfile];
        if (data) {
            this.buttons = data.buttons || [];
            this.widgets = data.widgets || [];
            this.settings = Object.assign(Object.assign({}, this.settings), (data.settings || {}));
        }
    }
    loadLegacyData() {
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
        if (s)
            this.settings = Object.assign(Object.assign({}, this.settings), JSON.parse(s));
        this.profiles['Default'] = {
            buttons: this.buttons,
            widgets: this.widgets,
            settings: this.settings
        };
    }
    applyTheme() {
        document.documentElement.style.setProperty('--accent-color', this.settings.accentColor);
        document.documentElement.style.setProperty('--accent-glow', `${this.settings.accentColor}66`);
        document.documentElement.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${this.settings.glassIntensity / 1000})`);
    }
    renderDashboard() {
        this.renderButtons();
        this.renderWidgets();
    }
    renderButtons() {
        const grid = document.getElementById('buttonGrid');
        if (!grid)
            return;
        if (this.settings.fitToScreen) {
            grid.style.gridTemplateColumns = `repeat(${this.settings.gridSize}, 1fr)`;
            grid.style.gridAutoRows = '1fr';
            grid.style.width = '100%';
            grid.style.height = '100%';
            // When fitting to screen, we might want buttons to stretch
        }
        else {
            grid.style.gridTemplateColumns = `repeat(${this.settings.gridSize}, ${this.settings.buttonSize}px)`;
            grid.style.gridAutoRows = `${this.settings.buttonSize}px`;
            grid.style.width = 'auto';
            grid.style.height = 'auto';
        }
        grid.innerHTML = '';
        this.buttons.forEach((button, index) => {
            const buttonEl = document.createElement('div');
            buttonEl.className = 'stream-button';
            if (this.settings.fitToScreen) {
                buttonEl.classList.add('fluid');
            }
            buttonEl.draggable = true;
            buttonEl.innerHTML = `
                <button class="delete-btn" onclick="event.stopPropagation(); window.dashboardInstance.removeButton(${index})">&times;</button>
                <span class="icon">${button.icon}</span>
                <span class="label">${button.label}</span>
                ${button.shortcut ? `<span class="shortcut">${button.shortcut}</span>` : ''}
            `;
            buttonEl.onclick = () => this.executeButtonAction(button);
            buttonEl.oncontextmenu = (e) => {
                e.preventDefault();
                this.editButton(index);
            };
            // Drag and Drop Logic for Buttons
            buttonEl.addEventListener('dragstart', (e) => {
                this.draggedButtonIndex = index;
                e.target.classList.add('dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                }
            });
            buttonEl.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                this.draggedButtonIndex = null;
            });
            buttonEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer)
                    e.dataTransfer.dropEffect = 'move';
                return false;
            });
            buttonEl.addEventListener('drop', (e) => {
                e.stopPropagation();
                if (this.draggedButtonIndex !== null && this.draggedButtonIndex !== index) {
                    // Swap logic
                    const temp = this.buttons[this.draggedButtonIndex];
                    this.buttons[this.draggedButtonIndex] = this.buttons[index];
                    this.buttons[index] = temp;
                    this.saveButtons();
                    this.renderButtons();
                }
                return false;
            });
            grid.appendChild(buttonEl);
        });
    }
    renderWidgets() {
        const container = document.getElementById('widgetsContainer');
        if (!container)
            return;
        container.innerHTML = '';
        this.widgets.forEach((widget, index) => {
            const widgetEl = document.createElement('div');
            widgetEl.className = 'widget-card';
            widgetEl.draggable = true;
            widgetEl.innerHTML = `
                <div class="widget-header">
                    <h3>${widget.name}</h3>
                    <button onclick="window.dashboardInstance.removeWidget(${index})" class="btn-text" style="color: var(--danger)">Remove</button>
                </div>
                <div class="widget-content" id="widget-${index}"></div>
            `;
            // Drag and Drop Logic for Widgets
            widgetEl.addEventListener('dragstart', (e) => {
                this.draggedWidgetIndex = index;
                e.target.classList.add('dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                }
            });
            widgetEl.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                this.draggedWidgetIndex = null;
            });
            widgetEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer)
                    e.dataTransfer.dropEffect = 'move';
                return false;
            });
            widgetEl.addEventListener('drop', (e) => {
                e.stopPropagation();
                if (this.draggedWidgetIndex !== null && this.draggedWidgetIndex !== index) {
                    // Swap logic
                    const temp = this.widgets[this.draggedWidgetIndex];
                    this.widgets[this.draggedWidgetIndex] = this.widgets[index];
                    this.widgets[index] = temp;
                    this.saveWidgets();
                    this.renderWidgets();
                }
                return false;
            });
            container.appendChild(widgetEl);
            const contentEl = document.getElementById(`widget-${index}`);
            if (contentEl)
                contentEl.innerHTML = widget.html;
            const styleId = `style-widget-${index}`;
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
    setupEventListeners() {
        var _a, _b;
        (_a = document.getElementById('widgetForm')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (e) => this.createWidget(e));
        (_b = document.getElementById('buttonForm')) === null || _b === void 0 ? void 0 : _b.addEventListener('submit', (e) => this.handleButtonSubmit(e));
        const accentInput = document.getElementById('accentColor');
        if (accentInput) {
            accentInput.value = this.settings.accentColor;
            accentInput.oninput = (e) => {
                this.settings.accentColor = e.target.value;
                this.applyTheme();
            };
        }
        const glassInput = document.getElementById('glassIntensity');
        if (glassInput) {
            glassInput.value = this.settings.glassIntensity.toString();
            glassInput.oninput = (e) => {
                this.settings.glassIntensity = parseInt(e.target.value);
                this.applyTheme();
            };
        }
        const gridSizeSelect = document.getElementById('gridSize');
        if (gridSizeSelect) {
            gridSizeSelect.value = this.settings.gridSize.toString();
            gridSizeSelect.onchange = (e) => {
                this.settings.gridSize = parseInt(e.target.value);
                this.renderButtons();
            };
        }
        const buttonSizeRange = document.getElementById('buttonSize');
        const buttonSizeVal = document.getElementById('buttonSizeVal');
        if (buttonSizeRange) {
            buttonSizeRange.value = this.settings.buttonSize.toString();
            buttonSizeRange.oninput = (e) => {
                const val = e.target.value;
                this.settings.buttonSize = parseInt(val);
                if (buttonSizeVal)
                    buttonSizeVal.textContent = val + 'px';
                this.renderButtons();
            };
        }
        this.updateFitButton();
        this.setupBoardMode();
    }
    toggleFit() {
        this.settings.fitToScreen = !this.settings.fitToScreen;
        this.updateFitButton();
        this.renderButtons();
        this.saveSettings();
    }
    setupBoardMode() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('board-mode')) {
                this.toggleBoardMode();
            }
        });
    }
    toggleBoardMode() {
        document.body.classList.toggle('board-mode');
        const overlay = document.getElementById('boardModeOverlay');
        if (overlay) {
            overlay.style.display = document.body.classList.contains('board-mode') ? 'block' : 'none';
        }
        // If entering board mode and fit to screen is off, maybe we should suggest it? 
        // For now, let's just trigger a resize event to ensure layout updates
        window.dispatchEvent(new Event('resize'));
    }
    updateFitButton() {
        const btn = document.getElementById('toggleFitBtn');
        if (btn) {
            btn.textContent = this.settings.fitToScreen ? 'Fit: On' : 'Fit: Off';
            btn.style.background = this.settings.fitToScreen ? 'var(--accent-color)' : 'transparent';
            btn.style.color = this.settings.fitToScreen ? 'white' : 'var(--text-main)';
        }
    }
    initClock() {
        const clockEl = document.getElementById('liveClock');
        if (!clockEl)
            return;
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString();
        }, 1000);
    }
    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            if (connected)
                statusEl.classList.add('connected');
            else
                statusEl.classList.remove('connected');
        }
    }
    executeButtonAction(button) {
        if (typeof window.sendCommand === 'function') {
            window.sendCommand(button);
        }
        else {
            console.log('Sending command:', button);
        }
        const target = event === null || event === void 0 ? void 0 : event.currentTarget;
        if (target) {
            target.style.transform = 'scale(0.92)';
            setTimeout(() => target.style.transform = '', 100);
        }
    }
    addNewButton() {
        const modal = document.getElementById('buttonEditor');
        const form = document.getElementById('buttonForm');
        const title = document.getElementById('btnEditorTitle');
        const indexInput = document.getElementById('editBtnIndex');
        if (modal && form && title) {
            form.reset();
            title.textContent = 'New Button';
            indexInput.value = '-1';
            modal.style.display = 'flex';
            window.toggleBtnFields();
        }
    }
    editButton(index) {
        const button = this.buttons[index];
        const modal = document.getElementById('buttonEditor');
        const title = document.getElementById('btnEditorTitle');
        const indexInput = document.getElementById('editBtnIndex');
        if (modal && title) {
            title.textContent = 'Edit Button';
            indexInput.value = index.toString();
            document.getElementById('btnIcon').value = button.icon;
            document.getElementById('btnLabel').value = button.label;
            document.getElementById('btnType').value = button.type;
            if (button.type === 'keyboard') {
                document.getElementById('btnKey').value = button.key || '';
                document.getElementById('btnShortcut').value = button.shortcut || '';
            }
            else if (button.type === 'system') {
                document.getElementById('btnAction').value = button.action || 'command';
                document.getElementById('btnCommand').value = button.command || '';
            }
            modal.style.display = 'flex';
            window.toggleBtnFields();
        }
    }
    handleButtonSubmit(event) {
        event.preventDefault();
        const index = parseInt(document.getElementById('editBtnIndex').value);
        const button = {
            icon: document.getElementById('btnIcon').value,
            label: document.getElementById('btnLabel').value,
            type: document.getElementById('btnType').value
        };
        if (button.type === 'keyboard') {
            button.key = document.getElementById('btnKey').value;
            button.shortcut = document.getElementById('btnShortcut').value;
        }
        else {
            button.action = document.getElementById('btnAction').value;
            button.command = document.getElementById('btnCommand').value;
        }
        if (index === -1) {
            this.buttons.push(button);
        }
        else {
            this.buttons[index] = button;
        }
        this.saveButtons();
        this.renderButtons();
        this.closeButtonEditor();
    }
    closeButtonEditor() {
        const modal = document.getElementById('buttonEditor');
        if (modal)
            modal.style.display = 'none';
    }
    createWidget(event) {
        event.preventDefault();
        const widget = {
            name: document.getElementById('widgetName').value,
            html: document.getElementById('widgetHtml').value,
            css: document.getElementById('widgetCss').value,
            js: document.getElementById('widgetJs').value
        };
        this.widgets.push(widget);
        this.saveWidgets();
        this.renderWidgets();
        this.closeWidgetEditor();
    }
    removeWidget(index) {
        if (confirm('Delete this widget?')) {
            this.widgets.splice(index, 1);
            this.saveWidgets();
            this.renderWidgets();
        }
    }
    removeButton(index) {
        if (confirm('Delete this button?')) {
            this.buttons.splice(index, 1);
            this.saveButtons();
            this.renderButtons();
        }
    }
    closeWidgetEditor() {
        var _a;
        const editor = document.getElementById('widgetEditor');
        if (editor)
            editor.style.display = 'none';
        (_a = document.getElementById('widgetForm')) === null || _a === void 0 ? void 0 : _a.reset();
    }
    saveAllData() {
        this.profiles[this.activeProfile] = {
            buttons: this.buttons,
            widgets: this.widgets,
            settings: this.settings
        };
        localStorage.setItem('streamDeckProfiles', JSON.stringify(this.profiles));
        localStorage.setItem('streamDeckActiveProfile', this.activeProfile);
    }
    updateProfileSelect() {
        const select = document.getElementById('activeProfileSelect');
        if (!select)
            return;
        select.innerHTML = '';
        Object.keys(this.profiles).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            option.selected = (name === this.activeProfile);
            select.appendChild(option);
        });
    }
    switchProfile(name) {
        if (name === this.activeProfile)
            return;
        this.saveAllData();
        this.activeProfile = name;
        this.loadActiveProfile();
        this.applyTheme();
        this.renderDashboard();
        this.updateProfileSelect();
    }
    createNewProfile() {
        const input = document.getElementById('newProfileName');
        const name = input === null || input === void 0 ? void 0 : input.value.trim();
        if (!name)
            return;
        if (this.profiles[name]) {
            alert('Profile already exists!');
            return;
        }
        // Create new profile with current settings but empty buttons/widgets
        this.profiles[name] = {
            buttons: [],
            widgets: [],
            settings: Object.assign({}, this.settings)
        };
        input.value = '';
        this.switchProfile(name);
    }
    exportConfig() {
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
        a.download = `stream-deck-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    importConfig(event) {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            try {
                const data = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                if (data.profiles && data.activeProfile) {
                    this.profiles = data.profiles;
                    this.activeProfile = data.activeProfile;
                    this.saveAllData();
                    location.reload();
                }
                else {
                    alert('Invalid configuration file.');
                }
            }
            catch (err) {
                alert('Error parsing JSON.');
            }
        };
        reader.readAsText(file);
    }
    saveButtons() {
        this.saveAllData();
    }
    saveWidgets() {
        this.saveAllData();
    }
    saveSettings() {
        this.saveAllData();
        alert('Configuration saved effectively!');
    }
    resetAllData() {
        if (confirm('Are you absolutely sure? This will wipe all profiles and settings.')) {
            localStorage.clear();
            location.reload();
        }
    }
}
// Global hooks
window.showView = (viewId) => {
    var _a;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    (_a = document.getElementById(viewId + 'View')) === null || _a === void 0 ? void 0 : _a.classList.add('active');
    const navItem = document.querySelector(`.nav-item[title="${viewId.charAt(0).toUpperCase() + viewId.slice(1)}"]`);
    if (navItem)
        navItem.classList.add('active');
    const titleEl = document.getElementById('viewTitle');
    if (titleEl)
        titleEl.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
};
window.showWidgetEditor = () => {
    const editor = document.getElementById('widgetEditor');
    if (editor)
        editor.style.display = 'flex';
};
window.closeWidgetEditor = () => window.dashboardInstance.closeWidgetEditor();
window.addNewButton = () => window.dashboardInstance.addNewButton();
window.closeButtonEditor = () => window.dashboardInstance.closeButtonEditor();
window.saveSettings = () => window.dashboardInstance.saveSettings();
window.resetAllData = () => window.dashboardInstance.resetAllData();
window.switchProfile = (name) => window.dashboardInstance.switchProfile(name);
window.createNewProfile = () => window.dashboardInstance.createNewProfile();
window.exportConfig = () => window.dashboardInstance.exportConfig();
window.importConfig = (e) => window.dashboardInstance.importConfig(e);
window.toggleBtnFields = () => {
    const type = document.getElementById('btnType').value;
    const kb = document.getElementById('keyboardFields');
    const sys = document.getElementById('systemFields');
    if (kb && sys) {
        kb.style.display = type === 'keyboard' ? 'block' : 'none';
        sys.style.display = type === 'system' ? 'block' : 'none';
    }
};
window.toggleFit = () => window.dashboardInstance.toggleFit();
window.toggleBoardMode = () => window.dashboardInstance.toggleBoardMode();
document.addEventListener('DOMContentLoaded', () => {
    // Initialize WebSocket if available
    if (typeof window.connectWebSocket === 'function') {
        window.connectWebSocket();
    }
    window.dashboardInstance = new Dashboard();
    const oldUpdateStatus = window.updateConnectionStatus;
    window.updateConnectionStatus = (connected) => {
        if (oldUpdateStatus)
            oldUpdateStatus(connected);
        if (window.dashboardInstance)
            window.dashboardInstance.updateConnectionStatus(connected);
    };
});
