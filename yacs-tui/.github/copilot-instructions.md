# YACS TUI - Copilot Instructions

## Project Overview
TypeScript CLI application for Yet Another Cloud Service (YACS) with terminal user interface capabilities.

## Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js (ES2020+)
- **Build Tool**: TypeScript Compiler (tsc)
- **Development**: ts-node for direct TypeScript execution

## Key Commands
- `npm run dev` - Run with ts-node (development)
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled application
- `npm run clean` - Remove dist folder

## Project Structure
- `src/` - TypeScript source files
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project metadata and dependencies

## Development Guidelines
- Maintain strict TypeScript mode enabled
- Use ES2020 target for modern JavaScript features
- Add new CLI commands in `src/` directory
- Keep compiled output in `dist/` directory
