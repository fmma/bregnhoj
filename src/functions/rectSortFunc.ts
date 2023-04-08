import type { Pos } from "../components/Types";

export const norm = (p: Pos) => p.x * p.x * 0.05 + p.y * p.y;

export const posSortFun = (p1: Pos, p2: Pos) => norm(p1) - norm(p2);