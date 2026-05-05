import { useKeyboard } from "@opentui/react";
import { T } from "../theme";
import { useConfirm } from "../contexts/ConfirmContext";
import { useStatus } from "../contexts/StatusContext";
import { useFatalError } from "../contexts/FatalErrorContext";

export function ConfirmOverlay() {
  const { confirm, closeConfirm } = useConfirm();
  const { setStatus } = useStatus();
  const { fatalError } = useFatalError();

  useKeyboard((key) => {
    if (fatalError || !confirm) return;
    if (key.name === "y") {
      const c = confirm;
      closeConfirm();
      void Promise.resolve(c.run());
      return;
    }
    if (key.name === "n" || key.name === "backspace") {
      closeConfirm();
      setStatus("> cancelled");
    }
  });

  if (!confirm) return null;

  return (
    <box
      title={confirm.title}
      titleAlignment="left"
      style={{
        flexDirection: "column",
        gap: 1,
        border: true,
        borderStyle: "double",
        borderColor: confirm.danger ? T.danger : T.highlight,
        padding: 1,
      }}
    >
      <text fg={confirm.danger ? T.danger : T.highlight}>
        {confirm.danger ? "⚠ " : "? "}
        {confirm.message}
      </text>
      {confirm.detail && <text fg={T.textDim}>{confirm.detail}</text>}
      <box style={{ flexDirection: "row", gap: 2 }}>
        <box style={{ border: true, borderColor: T.live, paddingLeft: 1, paddingRight: 1 }}>
          <text fg={T.live}>[Y] yes</text>
        </box>
        <box style={{ border: true, borderColor: T.borderDim, paddingLeft: 1, paddingRight: 1 }}>
          <text fg={T.muted}>[N] no</text>
        </box>
      </box>
    </box>
  );
}
