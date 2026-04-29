import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

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
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      process.exit(0);
    }
  });

  const handleSubmit = (value: string) => {
    const num = parseInt(value, 10);
    if (num >= 1 && num <= items.length) {
      setError(null);
      onSelect(items[num - 1].value);
    } else {
      setError(`Invalid selection: "${value}". Please enter 1-${items.length}.`);
      setInput("");
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold color="green">YACS - Yet Another Cloud Service</Text>
      <Text>Select a command (type the number and press Enter):</Text>
      {items.map((item, index) => (
        <Text key={item.value} color={input === String(index + 1) ? "cyan" : undefined}>
          {index + 1}. {item.label}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text>Selection: </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </Box>
      {error && <Text color="red">Error: {error}</Text>}
      <Text dimColor>Press escape to exit</Text>
    </Box>
  );
};

export default MainMenu;
