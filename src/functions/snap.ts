import { grid } from '../constants';

export function snap(n: number) {
    return Math.max(0, Math.round(n / grid) * grid);
}


export function incSnap(n: number) {
    return n + grid;
}

export function decSnap(n: number) {
    return n - grid;
}