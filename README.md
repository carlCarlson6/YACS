# YACS - Yet Another Cloud Service

A cloud service platform that enables users to deploy their web pages with ease.

## Overview

YACS is a comprehensive cloud deployment platform consisting of three main components:
- A Terminal User Interface (TUI) for quick deployments
- A web-based frontend for project management
- A backend API powering both interfaces

## Project Structure

### 1. **yacs-tui** - Terminal User Interface
A command-line tool for deploying projects to YACS.

**Location:** `/yacs-tui`

**Features:**
- Deploy projects directly from the terminal
- Project management via CLI
- Configuration management

**Tech Stack:**
- TypeScript
- Node.js (ES2020+)
- ts-node for direct execution

**Quick Start:**
```bash
cd yacs-tui
npm install
npm start
```

### 2. **yacs-fe** - Web Frontend
A web application for managing user projects and interacting with the YACS platform.

**Location:** `/yacs-fe`

**Features:**
- User project dashboard
- Project management UI
- Calls the yacs-api backend

### 3. **yacs-api** - Backend API
RESTful API that powers both the web frontend and TUI.

**Location:** `/yacs-api`

**Features:**
- Project management endpoints
- Deployment orchestration
- User authentication and authorization

### 4. **test-yacs-project-to-deploy** - Test Project
A test Vite project used for deployment testing.

**Location:** `/test-yacs-project-to-deploy`

**Tech Stack:**
- Vite
- React
- TypeScript

## Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js (ES2020+)
- **Build Tool:** TypeScript Compiler (tsc)
- **Development:** ts-node for direct TypeScript execution
- **Frontend:** React + Vite
- **Frontend Build:** Vite

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/carCarlson6/YACS.git
cd YACS
```

2. Install dependencies for each component:
```bash
# Install yacs-tui dependencies
cd yacs-tui
npm install

# Install test project dependencies
cd ../test-yacs-project-to-deploy
npm install
```

## Project Workflow

1. Users can deploy projects using either:
   - **yacs-tui**: Direct terminal interface for quick deployments
   - **yacs-fe**: Web interface for full project management

2. Both interfaces communicate with **yacs-api** for all operations

3. Deployed projects are hosted on the YACS cloud platform

## Development

### Building
```bash
npm run build
```

### Running Tests
```bash
npm run test
```

### Development Mode
```bash
npm run dev
```

## Contributing

Please ensure code follows the TypeScript standards and includes proper type annotations.

## License

MIT

---

**Repository:** https://github.com/carCarlson6/YACS
