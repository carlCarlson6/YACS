type KeyInput = { name: string; ctrl?: boolean } | string;

declare global {
  // eslint-disable-next-line no-var
  var __opentuiEmitKey: ((key: { name: string; ctrl?: boolean }) => void) | undefined;
}

export function emitKeyboard(input: KeyInput) {
  const emitter = globalThis.__opentuiEmitKey;
  if (!emitter) {
    throw new Error("OpenTUI keyboard mock is not initialized");
  }
  if (typeof input === "string") {
    emitter({ name: input });
    return;
  }
  emitter(input);
}
