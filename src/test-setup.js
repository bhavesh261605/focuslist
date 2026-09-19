import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
// jsdom does not implement native modal APIs; emulate only their state change.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
window.matchMedia = vi.fn().mockImplementation(() => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.shortcuts;
  vi.useRealTimers();
});
