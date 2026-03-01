interface Button {
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
            { icon: '🎵', label: 'Play/Pause', type: 'keyboard', action: 'press', key: 'space', modifiers: [], shortcut: 'SPC' },
            { icon: '⏭️', label: 'Next Track', type: 'keyboard', action: 'press', key: 'right', modifiers: ['ctrl', 'alt'], shortcut: 'CTR+ALT+R' },
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
        document.documentElement.style.setProperty('--accent-glow', `${this.settings.accentColor}66`);
        document.documentElement.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${this.settings.glassIntensity / 1000})`);
    }

    private renderDashboard(): void {
        this.renderButtons();
        this.renderWidgets();
    }

    private renderButtons(): void {
        const grid = document.getElementById('buttonGrid');
        if (!grid) return;

        grid.style.gridTemplateColumns = `repeat(${this.settings.gridSize}, ${this.settings.buttonSize}px)`;
        grid.style.gridAutoRows = `${this.settings.buttonSize}px`;

        grid.innerHTML = '';

        this.buttons.forEach((button, index) => {
            const buttonEl = document.createElement('div');
            buttonEl.className = 'stream-button';
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
            widgetEl.innerHTML = `
                <div class="widget-header">
                    <h3>${widget.name}</h3>
                    <button onclick="window.dashboardInstance.removeWidget(${index})" class="btn-text" style="color: var(--danger)">Remove</button>
                </div>
                <div class="widget-content" id="widget-${index}"></div>
            `;

            container.appendChild(widgetEl);

            const contentEl = document.getElementById(`widget-${index}`);
            if (contentEl) contentEl.innerHTML = widget.html;

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
            button.action = 'press';
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
        a.download = `stream-deck-config-${new Date().toISOString().split('T')[0]}.json`;
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
    const navItem = document.querySelector(`.nav-item[title="${viewId.charAt(0).toUpperCase() + viewId.slice(1)}"]`);
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
});