
export function consoleLog(value: any) {
    const consoleDiv = document.querySelector('#console') as HTMLDivElement;
    const line = document.createElement('pre');
    line.innerHTML = JSON.stringify(value);
    consoleDiv.appendChild(line)
}