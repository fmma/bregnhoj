import { MOBILE_BREAKPOINT } from "../constants";

export function is_mobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}
