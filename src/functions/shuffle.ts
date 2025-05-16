export function shuffle<T>(list: T[]): T[] {
    let i = list.length;
    while (i != 0) {
        const j = Math.floor(Math.random() * i);
        i--;
        const tmp = list[i];
        list[i] = list[j];
        list[j] = tmp;
    }
    return list;
}
