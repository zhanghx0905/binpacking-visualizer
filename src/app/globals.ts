export type Unit = 'mm' | 'cm' | 'dm' | 'm';
export function compare(a: number | string, b: number | string, isAsc: boolean = true) {
    if (!a) a = '';
    if (!b) b = '';
    if (typeof (a) === 'string') a = a.trim().toLocaleLowerCase();
    if (typeof (b) === 'string') b = b.trim().toLocaleLowerCase();
    let result = (a < b ? -1 : a > b ? 1 : 0) * (isAsc ? 1 : -1);
    return result;
}

export const nameOf = <T>(name: Extract<keyof T, string>): string => name;

export const nextUnitSize = [
    { unit: 'mm', next: 10, threshold: 100 },
    { unit: 'cm', next: 100, threshold: 100 },
    { unit: 'm', next: 1000, threshold: 1000 },
    { unit: 'km', next: null, threshold: null },
];

export const defaultGoodEdgeColor = '#2a2a2a';
export const selectedGoodEdgeColor = '#ff7e00';
export const keyboardControlMoveStep = 500;

export const infinityReplacement = 100;

export enum SolutionError {
    NoSolution, NoContainer, GoodBeforeContainerXCoord, GoodOutOfContainerXCoord, GoodBeforeContainerYCoord, GoodOutOfContainerYCoord, GoodBeforeContainerZCoord, GoodOutOfContainerZCoord, GoodOverlap
}
