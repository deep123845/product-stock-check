const StartYear = 2024;
const StartMonth = 1; //January 2024

export const getMonthIndex = (monthString: string): number => {
    const regex = /^(\d{2})-(\d{4})$/;
    const match = monthString.match(regex);

    if (!match) { return -1; }

    const month = Number.parseInt(match[1]);
    const year = Number.parseInt(match[2]);

    const id = (year - StartYear) * 12 + (month - StartMonth);

    return id;
}

export const getMonthString = (monthIndex: number): string => {
    const year = StartYear + Math.floor((monthIndex + StartMonth - 1) / 12);
    const month = ((monthIndex + StartMonth - 1) % 12) + 1;
    return month < 10 ? `0${month}-${year}` : `${month}-${year}`;
}

export const getCurrentMonthString = (): string => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    return currentMonth < 10 ? `0${currentMonth}-${currentYear}` : `${currentMonth}-${currentYear}`
}

export const getCurrentMonthIndex = (): number => {
    return getMonthIndex(getCurrentMonthString());
}

export const getLastXMonthIndices = (x: number): number[] => {
    const currentMonthId = getCurrentMonthIndex();
    const lastXIndices = [];

    for (let i = 0; i < x; i++) {
        if (i > currentMonthId) { break; }
        lastXIndices.push(currentMonthId - i);
    }

    return lastXIndices;
}