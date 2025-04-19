# CodeTogether - Realtime Collaborative Code Editor

A feature-rich collaborative code editor that allows multiple users to work on the same code simultaneously. The application includes realtime code synchronization, chat functionality, different language support, themes, and code execution capabilities.

![Collaborative Code Editor](screenshot.png)

## Features

- **Realtime Code Collaboration**: Multiple users can edit code simultaneously
- **Language Support**: Syntax highlighting for various programming languages
- **Theme Selection**: Choose from different editor themes
- **Room Management**: Create or join rooms with a unique ID
- **User Presence**: See who's currently active in the room
- **Realtime Chat**: Communicate with other users in the room
- **Code Execution**: Run your code and see the output

## Layout

The application follows a structured layout:

- **Top Header**: Theme selector
- **Left Sidebar**: Room management, language selection, and user list
- **Center**: Code editor with an output panel below
- **Right Sidebar**: Realtime chat functionality

## Tech Stack

- **Frontend**: React, CodeMirror, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Styling**: CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/DineshDumka/Realtime-Collaborative-Code-Editor.git
   cd Realtime-Collaborative-Code-Editor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

### Running the Application

1. Start the backend server:
   ```
   npm run server:dev
   ```

2. Start the frontend development server in a new terminal:
   ```
   npm start
   ```

3. Open your browser and go to `http://localhost:3000`

## Usage

1. **Create a Room**: Enter your name and click "Create New Room"
2. **Join a Room**: Enter your name and the room ID, then click "Join"
3. **Share the Room ID**: Use the "Copy Room ID" button to share with others
4. **Collaborate**: Edit code together in real-time
5. **Chat**: Use the chat panel to communicate
6. **Run Code**: Click the "Run Code" button to execute and see output
7. **Change Settings**: Select different themes or languages as needed

## Deployment

The application can be deployed using various services:

1. **Frontend**: Netlify, Vercel, or GitHub Pages
2. **Backend**: Heroku, Digital Ocean, or AWS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

- Developed by [Dinesh Dumka](https://github.com/DineshDumka)
