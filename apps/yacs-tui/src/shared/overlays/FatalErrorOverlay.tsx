import { useKeyboard, useRenderer } from "@opentui/react";
import { T } from "../theme";
import { useFatalError } from "../contexts/FatalErrorContext";

export function FatalErrorOverlay() {
  const { fatalError, dismissError } = useFatalError();
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (!fatalError) return;
    if (key.name === "escape") {
      renderer.destroy();
      process.exit(1);
    }
    dismissError();
  });

  if (!fatalError) return null;

  return (
    <box
      title="// !! UNCAUGHT EXCEPTION !! //"
      titleAlignment="center"
      style={{
        flexDirection: "column",
        gap: 1,
        border: true,
        borderStyle: "double",
        borderColor: T.danger,
        padding: 1,
      }}
    >
      <box style={{ flexDirection: "column" }}>
        {fatalError.message.split("\n").slice(0, 12).map((line, i) => (
          <text key={i} fg={T.danger} attributes={i === 0 ? 1 : 0}>
            {i === 0 ? `⚠ ${line}` : `  ${line}`}
          </text>
        ))}
      </box>
      {fatalError.stack && (
        <box style={{ flexDirection: "column", border: true, borderColor: T.borderDim, padding: 1 }}>
          {fatalError.stack.split("\n").slice(0, 6).map((line, i) => (
            <text key={i} fg={T.textDim}>{line}</text>
          ))}
        </box>
      )}
      <text fg={T.textDim}>[any key] dismiss · [Esc] quit</text>
    </box>
  );
}
