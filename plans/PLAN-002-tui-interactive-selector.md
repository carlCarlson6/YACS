# YACS TUI Interactive Selector Plan

## Goal
Replace CLI command-based workflow (`yacs <command> [options]`) with an interactive menu that launches on `yacs` execution, using interactive prompts for arguments and returning to the menu after commands.

## User Preferences
1. **Post-command behavior**: Return to menu (run multiple commands without restarting)
2. **Argument input**: Interactive prompts (no CLI args required)

## Dependencies to Install
- `ink-select-input`: Menu selector component
- `ink-text-input`: Interactive text input for arguments
- Remove `meow` (no longer needed for CLI parsing)

## File Changes

### 1. `apps/yacs-tui/package.json`
- Add: `ink-select-input`, `ink-text-input`
- Remove: `meow`

### 2. `apps/yacs-tui/src/cli.ts`
Simplify to remove CLI parsing:
```ts
#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./components/App.js";

const apiUrl = process.env.YACS_API_URL || "http://localhost:3000";
render(React.createElement(App, { apiUrl }));
```

### 3. `apps/yacs-tui/src/components/App.tsx`
Replace command switching with view state:
- State: `view` (`"menu" | "projects" | "deploy" | "revert" | "update"`)
- Render `MainMenu` for `"menu"`, else render corresponding component with `onBack` prop
```tsx
import React, { useState } from "react";
import { Box } from "ink";
import MainMenu from "./MainMenu.js";
import ProjectsList from "./ProjectsList.js";
import Deploy from "./Deploy.js";
import Revert from "./Revert.js";
import ProjectUpdate from "./ProjectUpdate.js";

interface AppProps { apiUrl: string; }

const App: React.FC<AppProps> = ({ apiUrl }) => {
  const [view, setView] = useState<"menu" | "projects" | "deploy" | "revert" | "update">("menu");

  const renderView = () => {
    switch (view) {
      case "menu": return <MainMenu onSelect={setView} />;
      case "projects": return <ProjectsList apiUrl={apiUrl} onBack={() => setView("menu")} />;
      case "deploy": return <Deploy apiUrl={apiUrl} onBack={() => setView("menu")} />;
      case "revert": return <Revert apiUrl={apiUrl} onBack={() => setView("menu")} />;
      case "update": return <ProjectUpdate apiUrl={apiUrl} onBack={() => setView("menu")} />;
    }
  };

  return <Box flexDirection="column" padding={1}>{renderView()}</Box>;
};

export default App;
```

### 4. `apps/yacs-tui/src/components/MainMenu.tsx` (New)
Selector menu using `SelectInput`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

interface MainMenuProps {
  onSelect: (view: "projects" | "deploy" | "revert" | "update") => void;
}

const items = [
  { label: "List Projects", value: "projects" },
  { label: "Deploy Project", value: "deploy" },
  { label: "Revert Deployment", value: "revert" },
  { label: "Update Project", value: "update" },
];

const MainMenu: React.FC<MainMenuProps> = ({ onSelect }) => (
  <Box flexDirection="column">
    <Text bold>YACS - Yet Another Cloud Service</Text>
    <Text>Select a command:</Text>
    <SelectInput items={items} onSelect={(item) => onSelect(item.value as any)} />
  </Box>
);

export default MainMenu;
```

### 5. Update Existing Components
Add `onBack: () => void` prop and interactive text inputs for required arguments:

| Component | Interactive Inputs | Back Navigation |
|-----------|-------------------|-----------------|
| `ProjectsList` | None | `useInput` (escape key) |
| `Deploy` | Project directory path (`TextInput`) | Escape key + `onBack` |
| `Revert` | Deployment ID (`TextInput`) | Escape key + `onBack` |
| `ProjectUpdate` | Project ID (required), name/status (optional) (`TextInput`) | Escape key + `onBack` |

## User Flow
`yacs` → Menu selector → Pick command → Enter args via prompts → Execute → Return to menu → Repeat/Exit (Ctrl+C)

## Implementation Steps
1. ~~Install new dependencies~~ ✅
2. ~~Update `cli.ts`~~ ✅
3. ~~Create `MainMenu.tsx`~~ ✅
4. ~~Update `App.tsx`~~ ✅
5. ~~Refactor existing components with `onBack` and text inputs~~ ✅
6. ~~Test with `npm run dev -w @yacs/tui`~~ ✅

## Status: Completed
- Dependencies installed: `ink-select-input`, `ink-text-input`
- Removed: `meow`
- Created: `MainMenu.tsx` with interactive selector
- Updated: `App.tsx` with view state management
- Refactored: All components with `onBack` prop and interactive inputs
- Build: TypeScript compilation successful
