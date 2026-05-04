import { useEffect, useState } from "react";
import { T } from "../theme";
import type { DeploymentStep } from "../runBuildAndDeploy";

const STEP_LABELS: Record<DeploymentStep, string> = {
  install: "installing dependencies",
  lint: "running lint",
  test: "running tests",
  build: "building",
  publish: "publishing deployment",
  success: "deployment complete",
  error: "deployment failed",
};

const RUNNING_STEPS: DeploymentStep[] = ["install", "lint", "test", "build", "publish"];
const SPINNER_FRAMES = ["-", "\\", "|", "/"];

export function DeploymentStepIndicator({ step }: { step: DeploymentStep | null }) {
  const running = step ? RUNNING_STEPS.includes(step) : false;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!running) {
      setIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % SPINNER_FRAMES.length);
    }, 120);
    return () => clearInterval(timer);
  }, [running]);

  if (!step || !running) return null;

  return (
    <box style={{ flexDirection: "row", gap: 1 }}>
      <text fg={T.accent}>{SPINNER_FRAMES[index]}</text>
      <text fg={T.primary}>{STEP_LABELS[step]}</text>
    </box>
  );
}
