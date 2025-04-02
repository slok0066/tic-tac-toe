# Tic Tac Toe Game

A modern and feature-rich Tic Tac Toe game with online multiplayer, AI opponents, and customizable settings.

## Features

- 🎮 Play against friends locally
- 🤖 Challenge AI with various difficulty levels (Easy, Medium, Hard, God)
- 🌐 Create or join private game rooms
- 🔄 Find random opponents online
- ⚙️ Customize game settings (theme, sounds, animations)
- 🎨 Multiple themes and visual effects
- 🔊 Sound effects for game actions

## Installation

### Prerequisites

- Node.js 14+
- npm or yarn

### Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd tic-tac-toe
   ```

2. Install client dependencies
   ```bash
   npm install
   ```

3. Install server dependencies
   ```bash
   cd server
   npm install
   cd ..
   ```

## Running the Game

1. Start the server (for online multiplayer)
   ```bash
   cd server
   npm start
   ```

2. In a separate terminal, start the client
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Game Modes

### Play with Friend
Play locally on the same device, taking turns.

### Play with AI
Challenge the computer with different difficulty levels:
- **Easy**: Random moves, perfect for beginners
- **Medium**: Mix of strategy and random moves
- **Hard**: Smart AI that plays strategically
- **God**: Near-perfect AI that uses the minimax algorithm

### Create/Join Room
Create a private room and share the code with a friend to play together, or join an existing room with a code.

### Random Match
Get matched with a random player who's also looking for a game.

## Technologies Used

- React
- TypeScript
- Vite
- Socket.IO for real-time communication
- Framer Motion for animations
- TailwindCSS for styling

## Sound Credits

Sound effects in the public/sounds directory are required for the audio features.
You can add your own MP3 files with the following names:
- move-x.mp3
- move-o.mp3
- win.mp3
- draw.mp3
- click.mp3
- notification.mp3
- error.mp3

## License

MIT 