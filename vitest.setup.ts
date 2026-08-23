import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

if (!window.PointerEvent) {
  window.PointerEvent = class PointerEvent extends Event {
    pointerId = 1;
    pointerType = "mouse";
    isPrimary = true;
    clientX = 0;
    clientY = 0;
  } as unknown as typeof PointerEvent;
}

Object.defineProperties(Element.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  setPointerCapture: { configurable: true, value: () => {} },
  releasePointerCapture: { configurable: true, value: () => {} },
  scrollIntoView: { configurable: true, value: () => {} },
});
