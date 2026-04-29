import React, { useState } from "react";
import { Box, Text } from "ink";
import MainMenu from "./MainMenu.js";
import ProjectsList from "./ProjectsList.js";
import Deploy from "./Deploy.js";
import Revert from "./Revert.js";
import ProjectUpdate from "./ProjectUpdate.js";

interface AppProps {
  apiUrl: string;
}

const App: React.FC<AppProps> = ({ apiUrl }) => {
  const [view, setView] = useState<"menu" | "projects" | "deploy" | "revert" | "update">("menu");

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
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>═══════════════════════════════════════</Text>
      {renderView()}
      <Text color="green" bold>═══════════════════════════════════════</Text>
    </Box>
  );
};

export default App;
