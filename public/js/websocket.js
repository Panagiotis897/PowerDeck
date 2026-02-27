let ws;
let isConnected = false;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to server');
        isConnected = true;
        updateConnectionStatus(true);
    };

    ws.onclose = () => {
        console.log('Disconnected from server');
        isConnected = false;
        updateConnectionStatus(false);
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;

    if (statusEl.classList.contains('status-indicator')) {
        // New Premium Dashboard - Dot based
        if (connected) statusEl.classList.add('connected');
        else statusEl.classList.remove('connected');
    } else {
        // Old Dashboard - Text based
        statusEl.textContent = connected ? 'Connected' : 'Disconnected';
        statusEl.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
    }
}

function sendCommand(command) {
    if (isConnected && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(command));
    } else {
        console.error('WebSocket not connected');
    }
}

function handleIncomingMessage(data) {
    console.log('Received message:', data);
    // Handle messages from other devices
    // You can update UI based on received data
}