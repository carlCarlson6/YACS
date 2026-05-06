import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as React from "react";

type KeyboardHandler = (key: { name: string; ctrl?: boolean }) => void;

const keyboardHandlers = new Set<KeyboardHandler>();

function emitKeyboard(key: { name: string; ctrl?: boolean }) {
  keyboardHandlers.forEach((handler) => handler(key));
}

declare global {
  // eslint-disable-next-line no-var
  var __opentuiEmitKey: ((key: { name: string; ctrl?: boolean }) => void) | undefined;
}

globalThis.__opentuiEmitKey = emitKeyboard;

vi.mock("@opentui/react", () => {
  return {
    useKeyboard: (handler: KeyboardHandler) => {
      React.useEffect(() => {
        keyboardHandlers.add(handler);
        return () => {
          keyboardHandlers.delete(handler);
        };
      }, [handler]);
    },
    useRenderer: () => ({
      destroy: vi.fn(),
    }),
    useTerminalDimensions: () => ({ width: 120, height: 40 }),
    createRoot: () => ({ render: vi.fn() }),
  } as typeof import("@opentui/react");
});

afterEach(() => {
  cleanup();
  keyboardHandlers.clear();
});

beforeEach(() => {
  vi.restoreAllMocks();
});
