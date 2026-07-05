// Graceful fallback for react-native-gesture-handler.
//
// Older APKs (built before RNGH was added) don't have the native module. If we
// import RNGH at the top of any module, those APKs crash on splash when the
// OTA bundle replaces their embedded JS. So we try-require it once and expose
// `isAvailable` so callers can pick a fallback render path.
//
// Callers MUST check `rngh.isAvailable` before using `Gesture`/`GestureDetector`.

type RnghShape = {
  Gesture?: unknown;
  GestureDetector?: unknown;
  GestureHandlerRootView?: unknown;
};

let _mod: RnghShape = {};
let _available = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lib = require("react-native-gesture-handler");
  _mod = lib || {};
  _available = Boolean(_mod.GestureDetector && _mod.Gesture);
} catch {
  _available = false;
}

export const rngh = {
  isAvailable: _available,
  Gesture: _mod.Gesture as never,
  GestureDetector: _mod.GestureDetector as never,
  GestureHandlerRootView: _mod.GestureHandlerRootView as never,
};
