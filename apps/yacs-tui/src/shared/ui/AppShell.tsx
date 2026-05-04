import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react";
import { useEffect, useState, type ReactNode } from "react";
import { T } from "../theme";
import { useStatus } from "../contexts/StatusContext";
import { useConfirm } from "../contexts/ConfirmContext";
import { useFatalError } from "../contexts/FatalErrorContext";

/**
 * Outer chrome of the TUI: full-screen frame, header, status bar, and
 * the global Esc-to-quit handler (suppressed when an overlay is active).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { status, busy } = useStatus();
  const { confirm } = useConfirm();
  const { fatalError } = useFatalError();
  const renderer = useRenderer();
  const { width, height } = useTerminalDimensions();
  const spinnerFrames = ["-", "\\", "|", "/"];
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  useEffect(() => {
    if (!busy) {
      setSpinnerIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setSpinnerIndex((current) => (current + 1) % spinnerFrames.length);
    }, 120);
    return () => clearInterval(timer);
  }, [busy]);

  useKeyboard((key) => {
    if (fatalError || confirm) return;
    if (key.name === "escape") {
      renderer.destroy();
      process.exit(0);
    }
  });

  return (
    <box
      title="// Y A C S //"
      titleAlignment="center"
      style={{
        width,
        height,
        flexDirection: "column",
        padding: 1,
        gap: 1,
        backgroundColor: T.bg,
        border: true,
        borderStyle: "double",
        borderColor: T.borderBright,
      }}
    >
      <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <text fg={T.primary} attributes={1}>
          {">_ YET ANOTHER CLOUD SERVICE"}
        </text>
      </box>

      {children}

      <box
        style={{
          flexDirection: "row",
          border: true,
          borderColor: T.borderDim,
          padding: 0,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <text fg={T.primaryDim}>
          {status ? `${busy ? `${spinnerFrames[spinnerIndex]} ` : ""}${status}` : "// awaiting input //"}
        </text>
      </box>
    </box>
  );
}
