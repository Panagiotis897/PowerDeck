# 🚀 Premium Stream Deck Web App

A beautiful, functional, and highly customizable Stream Deck web application. Control your computer, execute macros, and monitor your system through a high-end glassmorphism-styled dashboard.

## ✨ Features

- **Premium Interface**: Stunning glassmorphism design with fluid animations and a responsive layout.
- **Drag & Drop Layouts**: Easily rearrange buttons and widgets with intuitive drag-and-drop functionality.
- **Board Mode**: A distraction-free, full-screen experience that hides menus and maximizes your grid (inspired by SIM Dashboard).
- **Fit to Screen**: Toggle between fixed-size buttons or a fluid grid that automatically fills your entire screen.
- **Multiple Profiles**: Create, save, and switch between different dashboard layouts (e.g., Gaming, Work, Streaming).
- **Custom Widgets**: Import or create your own widgets using HTML, CSS, and JavaScript.
- **Macro Control**: Execute keyboard shortcuts and system commands directly from the dashboard.
- **Dynamic Configuration**: Adjust grid size, button size, accent colors, and transparency in real-time.
- **Persistence**: All settings, buttons, and profiles are saved locally in your browser.
- **Import/Export**: Easily backup or share your entire configuration as a JSON file.

## 🛠️ Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 14 or higher)

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Panagiotis897/PowerDeck.git
   cd PowerDeck
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile TypeScript**:
   This project uses TypeScript for the dashboard logic.
   ```bash
   npx tsc
   ```

4. **Generate Dashboard**:
   Initialize the premium dashboard files (HTML, CSS, TS):
   ```bash
   npm run generate-dash
   ```

## 🚀 Getting Started

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Access the Dashboard**:
   Open your browser and navigate to:
   `http://localhost:3000`

## 🏗️ Architecture

The app follows a modern web-to-system architecture:

1.  **Frontend**: A glassmorphic dashboard built with HTML/CSS and TypeScript. UI state is persisted in `localStorage`.
2.  **Generator**: A Node.js script (`scripts/generate-dashboard.js`) that handles the generation of static assets, allowing for easy updates and modular component injection.
3.  **Backend**: An Express.js server (`server.js`) that serves the static files and maintains a WebSocket connection with the clients.
4.  **System Bridge**: The backend translates WebSocket messages into system-level commands (keyboard macros, app launches) using platform-specific scripts.

## 💻 Cross-Platform Support

The system bridge is designed to work seamlessly across major operating systems:

-   **Windows**: Uses PowerShell with `System.Windows.Forms` for precision key sending.
-   **macOS**: Leverages AppleScript (`osascript`) for native UI interaction.
-   **Linux**: Utilizes `xdotool` for keyboard emulation.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the app.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
