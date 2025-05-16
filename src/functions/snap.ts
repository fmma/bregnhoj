import { GRID } from '../constants';

export function snap(n: number) {
    return Math.max(0, Math.round(n / GRID) * GRID);
}

export function inc_snap(n: number) {
    return n + GRID;
}

export function dec_snap(n: number) {
    return n - GRID;
}
