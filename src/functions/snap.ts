import { grid } from '../constants';

export function snap(n: number) {
    return Math.max(0, Math.round(n / grid) * grid);
}
