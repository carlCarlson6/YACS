import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { readFileSync } from "fs";
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

  useInput((_input, key) => {
    if (key.escape && step !== "lint" && step !== "test" && step !== "build" && step !== "upload") {
      onBack();
    }
  });

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

    const runStep = async (command: string, next: Step) => {
      setLog((prev) => [...prev, `\n$ ${command}`]);

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(command, { cwd: projectDir, shell: true });

        proc.stdout.on("data", (data) => {
          setLog((prev) => [...prev, data.toString().trim()]);
        });

        proc.stderr.on("data", (data) => {
          setLog((prev) => [...prev, data.toString().trim()]);
        });

        proc.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`${command} failed with exit code ${code}`));
          }
        });
      });

      setStep(next);
    };

    const deploy = async () => {
      try {
        await runStep("npm run lint", "test");
        await runStep("npm run test", "build");
        await runStep("npm run build", "upload");

        const distPath = join(projectDir, "dist");
        const buildOutput = existsSync(distPath)
          ? JSON.stringify({ files: ["dist/"], size: "unknown" })
          : "";

        const res = await fetch(`${apiUrl}/projects/TODO/deployments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: "TODO", buildOutput }),
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        setStep("done");
      } catch (err) {
        setError((err as Error).message);
      }
    };

    deploy();
  }, [step, projectDir, apiUrl]);

  if (step === "input") {
    return (
      <Box flexDirection="column">
        <Text bold>Deploy Project</Text>
        <Text>Enter project directory:</Text>
        <TextInput
          value={projectDir}
          onChange={setProjectDir}
          onSubmit={startDeploy}
        />
        <Text dimColor>Press escape to go back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Deploying: {projectDir}</Text>
      <Box>
        <Text color={step === "lint" ? "yellow" : step === "done" || ["test", "build", "upload", "done"].includes(step) ? "green" : "gray"}>
          {step === "lint" ? "▸ " : "  "}lint
        </Text>
        <Text color={step === "test" ? "yellow" : ["build", "upload", "done"].includes(step) ? "green" : "gray"}>
          {step === "test" ? "▸ " : "  "}test
        </Text>
        <Text color={step === "build" ? "yellow" : ["upload", "done"].includes(step) ? "green" : "gray"}>
          {step === "build" ? "▸ " : "  "}build
        </Text>
        <Text color={step === "upload" ? "yellow" : step === "done" ? "green" : "gray"}>
          {step === "upload" ? "▸ " : "  "}upload
        </Text>
      </Box>
      {error && <Text color="red">Error: {error}</Text>}
      {step === "done" && <Text color="green">Deploy complete! Press escape to go back</Text>}
      <Box flexDirection="column">
        {log.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
};

export default Deploy;
