const DEVICE_ID_KEY = "werft:device-id";

let fallbackDeviceId: string | undefined;

function newId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}:${uuid}`;
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
}

export function createEntityId(prefix: string) {
  return newId(prefix);
}

export function getDeviceId() {
  if (typeof globalThis.localStorage === "undefined") {
    fallbackDeviceId ??= newId("device");
    return fallbackDeviceId;
  }

  const stored = globalThis.localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const created = newId("device");
  globalThis.localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export function resetDeviceIdForTests() {
  fallbackDeviceId = undefined;
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.removeItem(DEVICE_ID_KEY);
  }
}
