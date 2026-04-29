import React from "react";
import { Box, Text } from "ink";
import { Result as MeowResult } from "meow";
import ProjectsList from "./ProjectsList.js";
import Deploy from "./Deploy.js";
import Revert from "./Revert.js";
import ProjectUpdate from "./ProjectUpdate.js";

interface AppProps {
  cli: MeowResult<any>;
}

const App: React.FC<AppProps> = ({ cli }) => {
  const [input] = cli.input as string[];

  const renderCommand = () => {
    switch (input) {
      case "projects":
        return <ProjectsList apiUrl={cli.flags.apiUrl as string | undefined} />;
      case "deploy":
        return <Deploy projectDir={(cli.input as string[])[1]} apiUrl={cli.flags.apiUrl as string | undefined} />;
      case "revert":
        return <Revert deploymentId={(cli.input as string[])[1]} apiUrl={cli.flags.apiUrl as string | undefined} />;
      case "project":
        return <ProjectUpdate projectId={(cli.input as string[])[1]} flags={cli.flags} apiUrl={cli.flags.apiUrl as string | undefined} />;
      default:
        return (
          <Box flexDirection="column">
            <Text bold>YACS - Yet Another Cloud Service</Text>
            <Text></Text>
            <Text>Run {cli.help}</Text>
          </Box>
        );
    }
  };

  return <Box flexDirection="column" padding={1}>{renderCommand()}</Box>;
};

export default App;
