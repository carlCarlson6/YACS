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
