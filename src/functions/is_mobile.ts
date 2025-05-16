import { mobileBreakpoint } from "../constants";

export function is_mobile() {
    return window.innerWidth < mobileBreakpoint;
}