# YACS - Yet Another Cloud Service

A cloud service platform that enables users to deploy their web pages with ease.

## Overview

### Components:
- A TUI -Terminal User Interface
- A backend API

### Features:
- List the projects, returned info:
- Make new deployment for a project
   1. TUI will run the npm commands lint, test, build.
   2. TUI will upload the build output to the BE.
   3. BE will serve deployment through a created url
- Revert a deployment
- Update project
   - Name
   - Status: running, stopped

For the moment only vite FE apps can be deployed, and only npm will used to run command

## Project Structure

### **yacs-tui** - Terminal User Interface
A command-line tool for deploying projects to YACS.

**Location:** `/yacs-tui`

**Features:**
- Deploy projects directly from the terminal
- Project management via CLI
- Configuration management

**Tech Stack:**
- TypeScript
- Node
- [ink](https://github.com/vadimdemedes/ink)

### **yacs-api** - Backend API
RESTful API that powers both the web frontend and TUI.

**Location:** `/yacs-api`

**Features:**
- Project management endpoints
- Deployment orchestration
- User authentication and authorization

**Tech Stack:**
- TypeScript
- Node
- express
