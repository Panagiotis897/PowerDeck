# 🚀 Premium Stream Deck Web App

A beautiful, functional, and highly customizable Stream Deck web application. Control your computer, execute macros, and monitor your system through a high-end glassmorphism-styled dashboard.

## ✨ Features

- **Premium Interface**: Stunning glassmorphism design with fluid animations and a responsive layout.
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
   git clone https://github.com/your-username/stream-deck-web.git
   cd stream-deck-web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile TypeScript**:
   This project uses TypeScript for the premium dashboard logic.
   ```bash
   npx tsc
   ```

4. **Generate Dashboard**:
   Initialize the premium dashboard files:
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

3. **Go Premium**:
   Click the **"Premium Dashboard"** button on the classic sidebar to experience the new interface.

## 🎨 Customizing

- **Adding Buttons**: Click the "Layout Editor" (🎨) in the sidebar, then click "+ Create New Button".
- **Creating Widgets**: Go to the Dashboard view and click "+ Add Widget" to write your own HTML/CSS/JS components.
- **Profiles**: Switch profiles or create new ones in the Settings (⚙️) panel.
- **Backup**: Use the "Export JSON" button in Settings to save your layout.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the app.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
