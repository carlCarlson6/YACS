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
