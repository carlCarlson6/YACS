# YACS TUI Numbered Input Plan

## Goal
Replace `ink-select-input` (arrow key navigation) with numbered input using Ink's `useInput` hook, allowing users to type command numbers (1-4) to select options.

## User Preferences
1. **Input method**: Type number instead of arrow key navigation
2. **Visual feedback**: Display numbered list (1. List Projects, 2. Deploy Project, etc.)

## Dependencies to Remove
- `ink-select-input`: No longer needed for menu selection

## File Changes

### 1. `apps/yacs-tui/src/components/MainMenu.tsx`
Replace `SelectInput` with custom numbered input:

```tsx
import React from "react";
import { Box, Text, useInput } from "ink";

interface MainMenuProps {
  onSelect: (view: "projects" | "deploy" | "revert" | "update") => void;
}

const items: { label: string; value: "projects" | "deploy" | "revert" | "update" }[] = [
  { label: "List Projects", value: "projects" },
  { label: "Deploy Project", value: "deploy" },
  { label: "Revert Deployment", value: "revert" },
  { label: "Update Project", value: "update" },
];

const MainMenu: React.FC<MainMenuProps> = ({ onSelect }) => {
  useInput((input) => {
    const num = parseInt(input, 10);
    if (num >= 1 && num <= items.length) {
      onSelect(items[num - 1].value);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>YACS - Yet Another Cloud Service</Text>
      <Text>Select a command (type the number):</Text>
      {items.map((item, index) => (
        <Text key={item.value}>
          {index + 1}. {item.label}
        </Text>
      ))}
    </Box>
  );
};

export default MainMenu;
```

### 2. `apps/yacs-tui/package.json`
- Remove: `ink-select-input`

## User Flow
`yacs` → Numbered menu → Type 1-4 → Command executes → Return to menu

## Implementation Steps
1. Update `MainMenu.tsx` with `useInput` hook and numbered list
2. Remove `ink-select-input` dependency
3. Test with `npm run dev -w @yacs/tui`

## Status: Pending
- [ ] Update `MainMenu.tsx`
- [ ] Remove `ink-select-input` from dependencies
- [ ] Test numbered input functionality
