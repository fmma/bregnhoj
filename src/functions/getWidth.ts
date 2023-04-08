import type { Viewport } from "../components/Types";

export function getWidth() {
  return document.body.clientWidth;
}

export function getHeight() {
  return window.innerHeight;
}

export function getPixelRatio() {
  return window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;
}

const ogPixelRatio = getPixelRatio();

export function getViewport(): Viewport {
  return {
    width: getWidth(),
    pixelRatio: getPixelRatio() / ogPixelRatio
  }
}