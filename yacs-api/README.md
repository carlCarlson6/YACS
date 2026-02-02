# YACS API

Express-based REST API for the YACS cloud deployment service.

## Overview

This is the backend API that powers both the YACS web frontend and TUI. It provides endpoints for project management and deployment.

## Project Structure

```
src/
├── index.ts                 # Main application entry point
├── controllers/
│   └── projectController.ts # Project business logic
├── routes/
│   └── projects.ts         # Project API endpoints
├── middlewares/
│   ├── errorHandler.ts     # Global error handling
│   └── validation.ts       # Request validation
└── utils/                  # Utility functions
```

## Features

- ✅ RESTful API endpoints for project management
- ✅ CORS support for cross-origin requests
- ✅ Environment configuration with dotenv
- ✅ Error handling middleware
- ✅ Request validation
- ✅ Health check endpoint
- ✅ Logging middleware

## API Endpoints

### Health Check
- `GET /health` - Check API status

### Projects
- `GET /api/v1/projects` - List all projects for a user
- `GET /api/v1/projects/:id` - Get a specific project
- `POST /api/v1/projects` - Create a new project
- `PUT /api/v1/projects/:id` - Update a project
- `DELETE /api/v1/projects/:id` - Delete a project
- `POST /api/v1/projects/:id/deploy` - Deploy a project

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The API will start on port 3000 (or the port specified in `.env`)

## Building

```bash
npm run build
```

## Production

```bash
npm start
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
PORT=3000
NODE_ENV=development
API_VERSION=v1
```

## Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

---

**Part of:** [YACS - Yet Another Cloud Service](https://github.com/carCarlson6/YACS)
