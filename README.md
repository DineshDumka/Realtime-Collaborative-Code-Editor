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

### Deploying to Render.com

This project is configured for easy deployment using Docker. Follow these steps to deploy on Render.com:

#### 1. Set up a Render Account
- Create an account at [Render.com](https://render.com)
- Click on "New" and select "Web Service"

#### 2. Configure your Web Service
- Choose "Deploy from Git Repository"
- Connect your GitHub account and select your repository
- Select "Docker" as the Environment
- Set a name for your service (e.g., "codetogether")
- Select a region close to your users
- Choose the plan (Free tier works for testing)

#### 3. Environment Variables
Set up the following environment variables:

- `NODE_ENV`: Set to `production`
- `PORT`: Set to `5000` (Render will override this with its own port)
- `MONGODB_URI`: Your MongoDB connection string (optional)
- `SKIP_DB_CONNECTION`: Set to `true` if not using MongoDB
- `REACT_APP_FIREBASE_API_KEY`: Your Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID`: Your Firebase app ID
- `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON (as a single line)

#### 4. Deploy
- Click "Create Web Service"
- Render will automatically build and deploy your Docker image
- Once deployment is complete, your app will be available at the URL provided by Render

#### 5. Verify WebSocket Connection
- Make sure WebSocket connections are working by testing the realtime collaboration features
- Check your browser console for any connection errors

### Dockerized Development

You can also use Docker for local development:

```bash
# Build and start the containers
docker-compose up

# Access the application at http://localhost:3000
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

- Developed by [Dinesh Dumka](https://github.com/DineshDumka)
