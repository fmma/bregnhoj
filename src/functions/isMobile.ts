import { mobileBreakpoint } from "../constants";

export function isMobile() {
    return window.innerWidth < mobileBreakpoint;
}