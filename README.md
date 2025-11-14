# BehavioralTrack

A mobile-first web application for behavioral therapists to track client behaviors in real-time during therapy sessions.

## Overview

BehavioralTrack replaces pen-and-paper behavior tracking with a clean, intuitive digital solution. Therapists can quickly log behavior frequencies, track durations, and export session data for analysis and reporting.

## Features

- **Quick Tally Counter**: Click to increment behavior counts instantly
- **Duration Timer**: Start/stop timers to track how long behaviors occur
- **Auto-logging**: Automatic date/time stamps for all entries
- **Data Export**: Export session data to CSV or PDF format
- **Mobile-First Design**: Optimized for tablets and phones used during sessions
- **Real-time Tracking**: No delays or page refreshes during sessions

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **CSS Modules** - Scoped styling
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication tokens

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Auto-restart during development

## Project Structure

```
BehavioralTrack/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (views)
│   │   ├── services/      # API communication layer
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # Global state management
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # Global CSS and themes
│   └── package.json
│
├── server/                # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API route definitions
│   │   ├── middleware/    # Custom middleware
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── database/              # Database setup
│   ├── migrations/        # Database version control
│   └── schema.sql         # Initial database schema
│
└── docs/                  # Documentation
    ├── architecture.md    # System architecture
    ├── api.md            # API documentation
    └── deployment.md     # Deployment guide
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BehavioralTrack
   ```

2. **Set up the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Development

Run both frontend and backend in development mode:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Environment Variables

### Server (.env)

```env
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=behavioral_track
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

## API Endpoints

See [docs/api.md](docs/api.md) for detailed API documentation.

## Deployment

See [docs/deployment.md](docs/deployment.md) for cPanel deployment instructions.

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
