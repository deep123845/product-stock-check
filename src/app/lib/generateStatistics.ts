import { ProductHistory } from "@/app/lib/types";

const getfirstMonths = (productHistory: ProductHistory[]) => {
    if (!productHistory || productHistory.length === 0) {
        return {};
    }
    const firstMonths: { [productNo: string]: number } = {};

    for (let i = 0; i < productHistory.length; i++) {
        const history = productHistory[i];
        const sales = history.sales;
        const firstMonth = Math.min(...Object.keys(sales).map(Number));

        firstMonths[history.productNo] = firstMonth;
    }

    return firstMonths;
}

// get the fraction of the last month that has passed (days elsapsed/ days in month)
const getLastMonthFraction = (currentDay: number) => {
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return currentDay / lastMonth.getDate();
}

// Get the months that are included in calculations
export const getIncludedMonths = (productHistory: ProductHistory[], monthIndices: number[], monthsforAverage: number, includeCurrentMonth: boolean) => {
    if (!productHistory || productHistory.length === 0) {
        return {};
    }
    const includedMonths: { [productNo: string]: number[] } = {};
    const firstMonth = getfirstMonths(productHistory);

    for (let i = 0; i < productHistory.length; i++) {
        const history = productHistory[i];

        includedMonths[history.productNo] = [];

        for (let j = 0; j < monthIndices.length; j++) {
            const monthIndex = monthIndices[j];

            if (firstMonth[history.productNo] >= monthIndex) {
                continue; // Skip first month and any months before it
            }

            if (!includeCurrentMonth && (Math.max(...monthIndices) === monthIndex)) {
                continue; // Skip the current month if includeCurrentMonth is false
            }

            if (includedMonths[history.productNo].length >= monthsforAverage && monthsforAverage > 0) {
                break; // Stop if we have enough months
            }

            includedMonths[history.productNo].push(monthIndex);
        }
    }

    return includedMonths;
}

export const getAverageMonthlySales = (
    productHistory: ProductHistory[],
    monthIndices: number[],
    includedMonths: { [productNo: string]: number[] },
    currentDay: number
) => {
    if (!productHistory || productHistory.length === 0) {
        return {};
    }
    const averageSales: { [productNo: string]: number } = {};
    const lastMonthFraction = getLastMonthFraction(currentDay);

    for (let i = 0; i < productHistory.length; i++) {
        const history = productHistory[i];
        const productNo = history.productNo;
        const sales = history.sales;

        let monthsCount = 0;
        let totalSales = 0;

        for (let j = 0; j < includedMonths[productNo].length; j++) {
            const monthIndex = includedMonths[productNo][j];
            const salesValue = sales[monthIndex] || 0;

            totalSales += salesValue;

            // If the month is the last month, add the fraction of the month that has passed
            if (monthIndex === Math.max(...monthIndices)) {
                monthsCount += lastMonthFraction;
            } else {
                monthsCount++;
            }
        }

        if (monthsCount === 0) {
            averageSales[productNo] = 0;
            continue;
        }

        averageSales[history.productNo] = totalSales / monthsCount;
    }

    return averageSales;
}

export const getRestockAmounts = (
    productHistory: ProductHistory[],
    weeksRestock: number,
    averageMonthlySales: { [productNo: string]: number },
    unitsPerPack: { [productNo: string]: number }
) => {
    if (!productHistory || productHistory.length === 0) {
        return {};
    }
    const restockAmounts: { [productNo: string]: number } = {};

    for (let i = 0; i < productHistory.length; i++) {
        const history = productHistory[i];
        const productNo = history.productNo;
        const stock = history.stock || 0;
        const averageSales = averageMonthlySales[productNo];
        const unitsPerPackValue = unitsPerPack[productNo] || 1;

        const weeksInMonth = 4;
        const monthsRestock = weeksRestock / weeksInMonth;
        const restockPacks = Math.max(0, ((averageSales * monthsRestock) - stock)) / unitsPerPackValue;

        restockAmounts[productNo] = restockPacks;
    }

    return restockAmounts;
}

export const generatePriorityRestockList = (
    productHistory: ProductHistory[],
    weeksToRestock: number,
    averageMonthlySales: { [productNo: string]: number },
    unitsPerPack: { [productNo: string]: number },
    productDisabled: { [productNo: string]: boolean },
    maxStockPerProduct: { [productNo: string]: number },
    maxPacks: number
): { restockList: { [productNo: string]: number }, restockTotal: number } => {
    if (!productHistory || productHistory.length === 0) {
        return { restockList: {}, restockTotal: 0 };
    }

    const minAmount = 0.01;
    const restockList: { [productNo: string]: number } = {};
    let restockTotal = 0;

    for (let numWeeks = 1; numWeeks <= weeksToRestock; numWeeks++) {
        const restockAmountsCopy = getRestockAmounts(productHistory, numWeeks, averageMonthlySales, unitsPerPack);
        // Filter out products that are disabled
        Object.keys(productDisabled).forEach(productNo => {
            if (productDisabled[productNo]) {
                delete restockAmountsCopy[productNo];
            }
        });

        for (let i = 0; i < productHistory.length; i++) {
            const history = productHistory[i];
            const productNo = history.productNo;

            if (!restockAmountsCopy[productNo]) { continue; }

            //If there is a max stock amount for the product clamp the restock amount to that
            if (maxStockPerProduct[productNo]) {
                const amountToMax = Math.max(maxStockPerProduct[productNo] - history.stock, 0);
                restockAmountsCopy[productNo] = Math.min(amountToMax, restockAmountsCopy[productNo]);
            }

            if (!restockList[productNo]) { continue; }

            //Subtract amount already in restock list from the remaining required
            restockAmountsCopy[productNo] = restockAmountsCopy[productNo] - restockList[productNo];
        }

        while (restockTotal < maxPacks) {
            //Get the product that needs the most amount restocked
            const maxRestockProductNo = Object.keys(restockAmountsCopy).reduce((a, b) => restockAmountsCopy[a] > restockAmountsCopy[b] ? a : b);

            if (restockAmountsCopy[maxRestockProductNo] < minAmount) {
                break; // No more products to restock
            }

            if (!restockList[maxRestockProductNo]) {
                restockList[maxRestockProductNo] = 0;
            }

            restockList[maxRestockProductNo] += 1;
            restockAmountsCopy[maxRestockProductNo] -= 1;
            restockTotal += 1;
        }
    }
    // Order the restock list by amount
    const orderedRestockList: { [productNo: string]: number } = {};
    const sortedProductNos = Object.keys(restockList).sort((a, b) => restockList[b] - restockList[a]);
    for (const productNo of sortedProductNos) {
        orderedRestockList[productNo] = restockList[productNo];
    }
    const output = { restockList: orderedRestockList, restockTotal };
    return output;
}

export const convertToPerPack = (averageMonthlySales: { [productNo: string]: number }, unitsPerPack: { [productNo: string]: number }) => {
    const averageMonthlySalesPerPack: { [productNo: string]: number } = {};

    for (const productNo in averageMonthlySales) {
        if (!unitsPerPack[productNo]) {
            averageMonthlySalesPerPack[productNo] = 0;
            continue;
        }
        averageMonthlySalesPerPack[productNo] = averageMonthlySales[productNo] / unitsPerPack[productNo];
    }

    return averageMonthlySalesPerPack;
}

export const calculateTotalAverageSales = (
    productHistory: ProductHistory[],
    averageMonthlySales: { [productNo: string]: number },
) => {
    if (!productHistory || productHistory.length === 0) {
        return 0;
    }

    const totalSales = Object.keys(averageMonthlySales).reduce((sum, productNo) => {
        const sales = averageMonthlySales[productNo];
        return sum + (sales || 0);
    }, 0);

    return totalSales;
}

export const calculateTotalStockPerPack = (productHistory: ProductHistory[], unitsPerPack: { [productNo: string]: number }) => {
    if (!productHistory || productHistory.length === 0) {
        return 0;
    }

    let totalStockPerPack = 0;

    for (const history of productHistory) {
        if (!history.stock || !unitsPerPack[history.productNo]) {
            continue; // Skip products with no stock or units per pack
        }
        totalStockPerPack += history.stock / unitsPerPack[history.productNo];
    }

    return totalStockPerPack;
}

export const calculateTotalStock = (productHistory: ProductHistory[]) => {
    if (!productHistory || productHistory.length === 0) {
        return 0;
    }

    const totalStock = productHistory.reduce((sum, history) => {
        return sum + (history.stock || 0);
    }, 0);

    return totalStock;
}