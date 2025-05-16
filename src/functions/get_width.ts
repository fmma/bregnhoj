import type { Viewport } from "../types";

export function get_width() {
  return document.body.clientWidth;
}

export function get_height() {
  return window.innerHeight;
}

export function get_pixel_ratio() {
  return window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;
}

const ogPixelRatio = get_pixel_ratio();

export function get_viewport(): Viewport {
  return {
    width: get_width(),
    pixelRatio: get_pixel_ratio() / ogPixelRatio
  }
}
