import { grid, defaultWidth, defaultHeight, minDefaultWidth, minDefaultHeight } from "../constants";
import type { Rect } from "../types";

export class Bitmap {

    _set = new Set<number>();

    w = 100;
    h = defaultHeight + grid;

    lastY = 0;

    reset(rs: Rect[]) {
        this.lastY = 0;
        this._set.clear();
        this.h = 0;
        for(const r of rs) {
            if(r.h + r.y > this.h)
                this.h = r.h + r.y;
        }
        this.h += defaultHeight + grid;
        for(const r of rs) {
            this.addRect(r);
        }
    }
    getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    nextRect(random: boolean): Rect {
        for (let y = this.lastY; y < this.h; y += grid) {
            for (let x = 0; x < this.w; x += grid) {
                const r = random ? {
                    x,
                    y,
                    w: minDefaultWidth + this.getRandomInt(-2,20) * grid,
                    h: minDefaultHeight + this.getRandomInt(-2, 20) * grid
                } : {
                    x,
                    y,
                    w: minDefaultWidth,
                    h: minDefaultHeight
                }

                if(this.canAddRect(r)) {
                    this.lastY = y;
                    this.growToArea(r, 150);
                    r.x+=grid;
                    r.w-=grid;
                    r.y+=grid;
                    r.h-=grid;

                    return r;
                }
            }
        }
        this.h +=  defaultHeight + grid;
        return this.nextRect(random);
    }

    encodePoint(x: number, y: number): number {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h)
            return -1;
        return x * 1000000 + y;
    }

    hasPoint(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h)
            return true;
        return this._set.has(this.encodePoint(x, y));
    }

    addPoint(x: number, y: number) {
        this._set.add(this.encodePoint(x, y));
    }

    removePoint(x: number, y: number) {
        this.lastY = Math.min(this.lastY, y);
        this._set.delete(this.encodePoint(x,y));
    }

    addRect(r: Rect) {
        for (let x = r.x; x < r.x + r.w; x += grid) {
            for (let y = r.y; y < r.y + r.h; y += grid) {
                this.addPoint(x, y);
            }
        }
    }

    removeRect(r: Rect) {
        for (let x = r.x; x < r.x + r.w; x += grid) {
            for (let y = r.y; y < r.y + r.h; y += grid) {
                this.removePoint(x, y);
            }
        }
    }

    canAddRect(r: Rect) {
        for (let x = r.x; x < r.x + r.w; x += grid) {
            for (let y = r.y; y < r.y + r.h; y += grid) {
                if (this.hasPoint(x, y))
                    return false;
            }
        }
        return true;
    }

    area(r: Rect) {
        return r.h * r.w;
    }

    grow(r: Rect) {
        this.growLeft(r);
        this.growUp(r);
        this.growRight(r);
        this.growDown(r);
    }

    growToArea(r: Rect, area: number) {
        let lastArea = 0
        while(lastArea != this.area(r) && this.area(r) < area) {
            lastArea = this.area(r);
            this.growLeft1(r);
            this.growUp1(r);
            this.growRight1(r);
            this.growDown1(r);
        }
        return this.area(r) >= area;
    }


    growLeft(r: Rect) {
        while (this.canAddRect({
            x: r.x - 1,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.x--;
            r.w++;
        }
    }

    growRight(r: Rect) {
        while (this.canAddRect({
            x: r.x + r.w,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.w++;
        }
    }

    growUp(r: Rect) {
        while (this.canAddRect({
            x: r.x,
            y: r.y - 1,
            w: r.w,
            h: 1,
        })) {
            r.y--;
            r.h++;
        }
    }

    flowDown(r: Rect) {
        while (this.canAddRect({
            x: r.x,
            y: r.y + r.h,
            w: r.w,
            h: 1,
        })) {
            r.y++;
        }
    }


    flowLeft(r: Rect) {
        while (this.canAddRect({
            x: r.x - 1,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.x--;
        }
    }

    flowRight(r: Rect) {
        while (this.canAddRect({
            x: r.x + r.w,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.x++;
        }
    }

    flowUp(r: Rect) {
        while (this.canAddRect({
            x: r.x,
            y: r.y - 1,
            w: r.w,
            h: 1,
        })) {
            r.y--;
        }
    }

    growDown(r: Rect) {
        while (this.canAddRect({
            x: r.x,
            y: r.y + r.h,
            w: r.w,
            h: 1,
        })) {
            r.h++;
        }
    }


    growDown1(r: Rect) {
        if (this.canAddRect({
            x: r.x,
            y: r.y + r.h,
            w: r.w,
            h: 1,
        })) {
            r.h++;
        }
    }
    growLeft1(r: Rect) {
        if (this.canAddRect({
            x: r.x - 1,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.x--;
            r.w++;
        }
    }

    growRight1(r: Rect) {
        if (this.canAddRect({
            x: r.x + r.w,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.w++;
        }
    }

    growUp1(r: Rect) {
        if (this.canAddRect({
            x: r.x,
            y: r.y - 1,
            w: r.w,
            h: 1,
        })) {
            r.y--;
            r.h++;
        }
    }

    shrinkLeft(r: Rect) {
        while (this.area(r) > 0 && !this.canAddRect({
            x: r.x,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.x++;
            r.w--;
        }
    }

    shrinkRight(r: Rect) {
        while (this.area(r) > 0 && !this.canAddRect({
            x: r.x + r.w - 1,
            y: r.y,
            w: 1,
            h: r.h,
        })) {
            r.w--;
        }
    }

    shrinkUp(r: Rect) {
        while (this.area(r) > 0 && !this.canAddRect({
            x: r.x,
            y: r.y,
            w: r.w,
            h: 1,
        })) {
            r.y++;
            r.h--;
        }
    }

    shrinkDown(r: Rect) {
        while (this.area(r) > 0 && !this.canAddRect({
            x: r.x,
            y: r.y + r.h - 1,
            w: r.w,
            h: 1,
        })) {
            r.h--;
        }
    }

    shrink(r: Rect) {
        this.shrinkUp(r);
        this.shrinkLeft(r);
        this.shrinkRight(r);
        this.shrinkDown(r);
    }
}