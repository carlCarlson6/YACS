# YACS TUI Reimplementation with OpenTUI

## Goal
Reimplement the YACS TUI application using the OpenTUI library to replace the current Ink-based implementation. OpenTUI is a native terminal UI core written in Zig with TypeScript/React bindings that provides better performance and native component support.

## User Preferences
1. **Library**: Migrate from Ink to OpenTUI
2. **Runtime**: Switch from Node.js/npm to Bun (OpenTUI is currently Bun-exclusive)
3. **Theme**: Maintain matrix/cyberpunk aesthetic (green on black, cyan accents, high contrast)
4. **Functionality**: Preserve all existing features (projects list, deploy, revert, update)

## Current State (Ink-based)
- **Package**: `@yacs/tui` in `apps/yacs-tui/`
- **Dependencies**: `ink`, `ink-text-input`, `react`, `meow` (CLI args)
- **Components**:
  - `App.tsx` - Main app with view routing
  - `MainMenu.tsx` - Number-based menu selection with TextInput
  - `ProjectsList.tsx` - List projects from API
  - `Deploy.tsx` - Deploy project workflow
  - `Revert.tsx` - Revert deployment
  - `ProjectUpdate.tsx` - Update project
- **Entry point**: `cli.ts` uses `meow` for CLI argument parsing

## File Changes

### 1. `apps/yacs-tui/package.json` (Full rewrite)
Replace Ink-based dependencies with OpenTUI:

```json
{
  "name": "@yacs/tui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "dist/cli.js",
  "bin": {
    "yacs": "dist/cli.js"
  },
  "scripts": {
    "dev": "bun --hot src/cli.tsx",
    "build": "bun build src/cli.tsx --outdir dist --target node",
    "start": "bun dist/cli.js",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "@yacs/schemas": "*",
    "@opentui/core": "^0.1.0",
    "@opentui/react": "^0.1.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^25.6.0",
    "@types/react": "^18.3.12",
    "typescript": "^5.6.0"
  }
}
```

**Changes**:
- Remove `ink`, `ink-text-input`, `tsx`, `meow`
- Add `@opentui/core`, `@opentui/react`
- Switch from `tsx watch` to `bun --hot` for dev
- Switch from `tsc --build` to `bun build` for production builds

### 2. `apps/yacs-tui/tsconfig.json` (Update)
Update TypeScript configuration for OpenTUI React bindings:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "rootDir": "src",
    "outDir": "dist",
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "references": [
    { "path": "../../shared/schemas" }
  ]
}
```

**Changes**:
- Add `"lib": ["ESNext", "DOM"]` for OpenTUI React support
- Keep `"jsx": "react-jsx"` but add `"jsxImportSource": "@opentui/react"`
- Add `"module": "ESNext"` and `"moduleResolution": "bundler"` for Bun compatibility

### 3. `apps/yacs-tui/src/cli.tsx` (Rename from cli.ts, Full rewrite)
Replace meow with direct argument parsing and use OpenTUI renderer:

```tsx
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import React from "react";
import App from "./components/App.js";

const args = process.argv.slice(2);
const apiUrl = args.includes("--api-url") 
  ? args[args.indexOf("--api-url") + 1] 
  : process.env.YACS_API_URL || "http://localhost:3000";

const command = args.find(arg => !arg.startsWith("--")) || "menu";

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  });

  createRoot(renderer).render(<App apiUrl={apiUrl} initialView={command} />);
}

main();
```

**Changes**:
- Rename `cli.ts` to `cli.tsx` (JSX support needed)
- Remove `meow` dependency, use manual argument parsing
- Replace Ink's `render()` with OpenTUI's `createCliRenderer()` + `createRoot()`
- Pass `apiUrl` and optional `initialView` to App

### 4. `apps/yacs-tui/src/components/App.tsx` (Rewrite)
Migrate from Ink's `Box`/`Text` to OpenTUI's `box`/`text`:

```tsx
import React, { useState } from "react";
import { box, text } from "@opentui/react";
import MainMenu from "./MainMenu.js";
import ProjectsList from "./ProjectsList.js";
import Deploy from "./Deploy.js";
import Revert from "./Revert.js";
import ProjectUpdate from "./ProjectUpdate.js";

interface AppProps {
  apiUrl: string;
  initialView?: string;
}

const App: React.FC<AppProps> = ({ apiUrl, initialView = "menu" }) => {
  const [view, setView] = useState<"menu" | "projects" | "deploy" | "revert" | "update">(initialView as any);

  const renderView = () => {
    switch (view) {
      case "menu":
        return <MainMenu onSelect={setView} />;
      case "projects":
        return <ProjectsList apiUrl={apiUrl} onBack={() => setView("menu")} />;
      case "deploy":
        return <Deploy apiUrl={apiUrl} onBack={() => setView("menu")} />;
      case "revert":
        return <Revert apiUrl={apiUrl} onBack={() => setView("menu")} />;
      case "update":
        return <ProjectUpdate apiUrl={apiUrl} onBack={() => setView("menu")} />;
    }
  };

  return (
    <box flexDirection="column" padding={1}>
      <text fg="#00FF00" bold>═══════════════════════════════════════</text>
      {renderView()}
      <text fg="#00FF00" bold>═══════════════════════════════════════</text>
    </box>
  );
};

export default App;
```

**Changes**:
- Import `box` and `text` from `@opentui/react` instead of `Box` and `Text` from `ink`
- Use lowercase JSX intrinsic elements (`<box>`, `<text>`) instead of PascalCase components
- Change `padding` prop usage (OpenTUI uses numeric values directly)
- Accept `initialView` prop for CLI command routing

### 5. `apps/yacs-tui/src/components/MainMenu.tsx` (Rewrite)
Replace custom number input with OpenTUI's `<select>` component:

```tsx
import React from "react";
import { box, text, select, useKeyboard } from "@opentui/react";
import { useRenderer } from "@opentui/react";

interface MainMenuProps {
  onSelect: (view: "projects" | "deploy" | "revert" | "update") => void;
}

const items = [
  { name: "List Projects", description: "View all projects", value: "projects" },
  { name: "Deploy Project", description: "Deploy to a project", value: "deploy" },
  { name: "Revert Deployment", description: "Revert to previous deployment", value: "revert" },
  { name: "Update Project", description: "Update project settings", value: "update" },
];

const MainMenu: React.FC<MainMenuProps> = ({ onSelect }) => {
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (key.name === "escape") {
      renderer.destroy();
    }
  });

  return (
    <box flexDirection="column" gap={1}>
      <text fg="#00FF00" bold>YACS - Yet Another Cloud Service</text>
      <text fg="#AAAAAA">Select an option (use arrow keys, Enter to confirm):</text>
      <select
        options={items}
        onSelect={(index, option) => {
          onSelect(option.value as any);
        }}
        width={50}
        selectedBackgroundColor="#003300"
        selectedTextColor="#00FFFF"
        textColor="#FFFFFF"
        descriptionColor="#888888"
        showDescription
      />
      <text fg="#666666" dim>Press Escape to exit</text>
    </box>
  );
};

export default MainMenu;
```

**Changes**:
- Remove `TextInput` from `ink-text-input`
- Use OpenTUI's `<select>` component for native menu selection with keyboard navigation
- Use `useKeyboard` hook and `useRenderer` from `@opentui/react`
- Remove custom number input logic and error handling (now handled by select)
- Apply cyberpunk theme colors

### 6. `apps/yacs-tui/src/components/Deploy.tsx` (Rewrite)
Fix input handling with OpenTUI's `<input>` component:

```tsx
import React from "react";
import { box, text, input, useKeyboard } from "@opentui/react";
import { useRenderer } from "@opentui/react";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

interface DeployProps {
  apiUrl?: string;
  onBack: () => void;
}

type Step = "input" | "lint" | "test" | "build" | "upload" | "done";

const Deploy: React.FC<DeployProps> = ({ apiUrl, onBack }) => {
  const [step, setStep] = React.useState<Step>("input");
  const [projectDir, setProjectDir] = React.useState("");
  const [log, setLog] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const renderer = useRenderer();

  useKeyboard(
    (_key) => {
      if (_key.name === "escape" && step !== "input") {
        onBack();
      }
    },
    { isActive: step !== "input" }
  );

  const startDeploy = (dir: string) => {
    if (!existsSync(dir)) {
      setError(`Directory not found: ${dir}`);
      return;
    }
    setProjectDir(dir);
    setStep("lint");
  };

  React.useEffect(() => {
    if (step === "input" || step === "done" || error) return;

    // ... (same deploy logic as before, using spawn)

    const deploy = async () => {
      try {
        // Run lint, test, build sequentially
        // Then upload to API
        setStep("done");
      } catch (err) {
        setError((err as Error).message);
      }
    };

    deploy();
  }, [step, projectDir, apiUrl]);

  if (step === "input") {
    return (
      <box flexDirection="column" gap={1}>
        <text fg="#00FF00" bold>Deploy Project</text>
        <text fg="#00FFFF">Enter project directory:</text>
        <input
          placeholder="~/projects/my-app"
          onInput={setProjectDir}
          onSubmit={startDeploy}
          focused
          width={50}
          backgroundColor="#1a1a1a"
          focusedBackgroundColor="#2a2a2a"
          textColor="#FFFFFF"
          cursorColor="#00FF00"
        />
        <text fg="#666666" dim>Press Enter to confirm, Escape for menu</text>
      </box>
    );
  }

  // ... rest of deploy status display (use <text> instead of <Text>)
};
```

**Changes**:
- Replace `TextInput` with OpenTUI's `<input>` component
- Use `focused` prop instead of internal focus management
- Use `onInput` and `onSubmit` events
- Fix re-render issue (OpenTUI's input handles focus properly)
- Apply cyberpunk theme

### 7. `apps/yacs-tui/src/components/ProjectsList.tsx` (Rewrite)
Migrate to OpenTUI components:

```tsx
import React, { useEffect, useState } from "react";
import { box, text, scrollbox } from "@opentui/react";
import { useKeyboard } from "@opentui/react";
import { Project } from "@yacs/schemas";

interface ProjectsListProps {
  apiUrl: string;
  onBack: () => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ apiUrl, onBack }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useKeyboard((key) => {
    if (key.name === "escape") {
      onBack();
    }
  });

  useEffect(() => {
    fetch(`${apiUrl}/projects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiUrl]);

  if (loading) return <text fg="#00FFFF">Loading projects...</text>;
  if (error) return <text fg="#FF0000">Error: {error}</text>;

  return (
    <box flexDirection="column" gap={1}>
      <text fg="#00FF00" bold>Projects</text>
      <scrollbox height={20} width={60}>
        {projects.map((p) => (
          <box key={p.id} flexDirection="row" gap={2}>
            <text fg="#00FFFF">{p.name}</text>
            <text fg={p.status === "running" ? "#00FF00" : p.status === "stopped" ? "#FFFF00" : "#FF0000"}>
              [{p.status}]
            </text>
          </box>
        ))}
      </scrollbox>
      <text fg="#666666" dim>Press Escape to go back</text>
    </box>
  );
};
```

**Changes**:
- Replace Ink components with OpenTUI equivalents
- Use `<scrollbox>` for scrollable project list
- Apply cyberpunk theme colors

### 8. `apps/yacs-tui/src/components/Revert.tsx` (Rewrite)
Similar migration pattern - use OpenTUI components and `<input>` for deployment ID.

### 9. `apps/yacs-tui/src/components/ProjectUpdate.tsx` (Rewrite)
Similar migration - use OpenTUI `<input>` components for fields, `<select>` for status.

## Implementation Steps

1. **Setup**: Install Bun (if not already installed)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Update package.json**: Rewrite with OpenTUI dependencies and Bun scripts

3. **Update tsconfig.json**: Configure for OpenTUI React bindings

4. **Rewrite cli.tsx**: Replace meow with OpenTUI renderer initialization

5. **Rewrite App.tsx**: Migrate to OpenTUI box/text components

6. **Rewrite MainMenu.tsx**: Use OpenTUI `<select>` for native menu

7. **Rewrite Deploy.tsx**: Use OpenTUI `<input>` with proper focus handling

8. **Rewrite ProjectsList.tsx**: Use OpenTUI components + `<scrollbox>`

9. **Rewrite Revert.tsx**: Migrate to OpenTUI components

10. **Rewrite ProjectUpdate.tsx**: Migrate to OpenTUI components

11. **Test**: Run `bun run dev` and verify all functionality works

12. **Build**: Run `bun run build` to create distributable

## OpenTUI Key Features to Leverage

1. **Native components**: `<select>`, `<input>`, `<scrollbox>` replace custom implementations
2. **Focus management**: Built-in focus routing (no more `useInput` conflicts)
3. **Keyboard handling**: `useKeyboard` hook with structured KeyEvent objects
4. **Styling**: Direct props (`fg`, `backgroundColor`, `border`, etc.)
5. **Performance**: Native Zig core (faster than Ink's JS-based rendering)

## Migration Considerations

1. **Bun requirement**: OpenTUI currently requires Bun. This changes the runtime from Node.js to Bun.
2. **File extensions**: May need `.tsx` instead of `.ts` for components with JSX
3. **CLI args**: Replace `meow` with manual parsing or OpenTUI's built-in arg handling
4. **Build process**: Switch from `tsc` to `bun build`
5. **Node.js compatibility**: If Node support is needed later, wait for OpenTUI's Node support (in-progress)

## Status: Pending
- [ ] Install Bun
- [ ] Update package.json and tsconfig.json
- [ ] Rewrite all components
- [ ] Test functionality
- [ ] Update documentation
