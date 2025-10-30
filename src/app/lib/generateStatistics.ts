import { ProductHistory, ProductInfo, ProductStatistics } from "@/app/lib/types";
import { getCurrentMonthIndex } from "@/app/lib/monthUtil";

// get the fraction of the last month that has passed (days elsapsed/ days in month)
const getLastMonthFraction = (currentDay: number) => {
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return currentDay / lastMonth.getDate();
}

const getMonthRange = (sales: { [monthId: number]: number }): { firstMonth: number, lastMonth: number } => {
    const keys = Object.keys(sales).map(Number);
    const firstMonth: number = Math.min(...keys);
    const lastMonth: number = Math.max(...keys);

    return { firstMonth, lastMonth };
}

// Get the months that are included in calculations
export const getIncludedMonths = (productHistory: ProductHistory[], monthsforAverage: number, includeCurrentMonth: boolean) => {
    const includedMonths: { [productNo: string]: number[] } = {};
    const currentMonth = getCurrentMonthIndex();

    for (let i = 0; i < productHistory.length; i++) {
        const history = productHistory[i];

        includedMonths[history.productNo] = [];

        const monthRange = getMonthRange(history.sales);

        for (let j = monthRange.lastMonth; j >= monthRange.firstMonth; j--) {
            if (!includeCurrentMonth && j === currentMonth) {
                continue; // Skip the current month if includeCurrentMonth is false
            }

            if (includedMonths[history.productNo].length >= monthsforAverage && monthsforAverage > 0) {
                break; // Stop if we have enough months
            }

            includedMonths[history.productNo].push(j);
        }
    }

    return includedMonths;
}

export const getAverageMonthlySales = (
    productHistory: ProductHistory[],
    includedMonths: { [productNo: string]: number[] },
    currentDay: number
) => {
    const averageSales: { [productNo: string]: number } = {};
    const lastMonthFraction = getLastMonthFraction(currentDay);
    const currentMonth = getCurrentMonthIndex();

    for (let i = 0; i < productHistory.length; i++) {
        const history = productHistory[i];
        const productNo = history.productNo;
        const sales = history.sales;

        let monthsCount = 0;
        let totalSales = 0;

        for (const month of includedMonths[productNo]) {
            const salesValue = sales[month] || 0;
            totalSales += salesValue;

            if (month === currentMonth) {
                monthsCount += lastMonthFraction;
            } else {
                monthsCount++;
            }
        }

        if (monthsCount === 0) {
            averageSales[productNo] = 0;
        } else {
            averageSales[productNo] = totalSales / monthsCount;
        }
    }

    return averageSales;
}

export const getRestockAmounts = (
    productHistory: ProductHistory[],
    weeksRestock: number,
    averageMonthlySales: { [productNo: string]: number },
    unitsPerPack: { [productNo: string]: number }
) => {

    const restockAmounts: { [productNo: string]: number } = {};
    let restockAmountsTotal: number = 0

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
        restockAmountsTotal += restockPacks;
    }

    return { restockAmounts, restockAmountsTotal };
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
        const { restockAmounts } = getRestockAmounts(productHistory, numWeeks, averageMonthlySales, unitsPerPack);
        // Filter out products that are disabled
        Object.keys(productDisabled).forEach(productNo => {
            if (productDisabled[productNo]) {
                delete restockAmounts[productNo];
            }
        });

        for (let i = 0; i < productHistory.length; i++) {
            const history = productHistory[i];
            const productNo = history.productNo;

            if (!restockAmounts[productNo]) { continue; }

            //If there is a max stock amount for the product clamp the restock amount to that
            if (maxStockPerProduct[productNo]) {
                const stockPacks = history.stock / unitsPerPack[productNo];
                const amountToMax = Math.max(maxStockPerProduct[productNo] - stockPacks, 0);
                restockAmounts[productNo] = Math.min(amountToMax, restockAmounts[productNo]);
            }

            if (!restockList[productNo]) { continue; }

            //Subtract amount already in restock list from the remaining required
            restockAmounts[productNo] = restockAmounts[productNo] - restockList[productNo];
        }

        while (restockTotal < maxPacks) {
            //Get the product that needs the most amount restocked
            const maxRestockProductNo = Object.keys(restockAmounts).reduce((a, b) => restockAmounts[a] > restockAmounts[b] ? a : b);

            if (restockAmounts[maxRestockProductNo] < minAmount) {
                break; // No more products to restock
            }

            if (!restockList[maxRestockProductNo]) {
                restockList[maxRestockProductNo] = 0;
            }

            restockList[maxRestockProductNo] += 1;
            restockAmounts[maxRestockProductNo] -= 1;
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

export const generateAllStatistics = (
    productHistory: ProductHistory[], ProductInfo: ProductInfo[], monthsforAverage: number, includeCurrentMonth: boolean,
    currentDay: number, unitsPerPack: { [productNo: string]: number }, weeksToRestock: number,
    productDisabled: { [productNo: string]: boolean }, maxStockPerProduct: { [productNo: string]: number }, maxPacks: number
) => {
    const includedMonths = getIncludedMonths(productHistory, monthsforAverage, includeCurrentMonth);
    const averageMonthlySales = getAverageMonthlySales(productHistory, includedMonths, currentDay);
    const averageMonthlySalesPerPack = convertToPerPack(averageMonthlySales, unitsPerPack);
    const { restockAmounts, restockAmountsTotal } = getRestockAmounts(productHistory, weeksToRestock, averageMonthlySales, unitsPerPack);
    const { restockList, restockTotal } = generatePriorityRestockList(productHistory, weeksToRestock, averageMonthlySales, unitsPerPack, productDisabled, maxStockPerProduct, maxPacks);
    const totalStock = calculateTotalStock(productHistory);
    const totalStockPerPack = calculateTotalStockPerPack(productHistory, unitsPerPack);
    const totalAverageSales = calculateTotalAverageSales(productHistory, averageMonthlySales);
    const totalAverageSalesPerPack = calculateTotalAverageSales(productHistory, averageMonthlySalesPerPack);

    const totalStatistics: ProductStatistics = {
        productNo: "0", description: "Total",
        stock: totalStock, stockPerPack: totalStockPerPack,
        restockRequired: restockAmountsTotal || 0, restockReccomended: restockTotal || 0,
        averageSales: totalAverageSales, averageSalesPerPack: totalAverageSalesPerPack,
        supplier: "", sales: {}, unitsPerPack: 0, LCBONumber: "", wholesalePrice: 0, includedMonths: [], productDisabled: false, maxStock: 0
    }

    const productStatistics: ProductStatistics[] = []

    for (const product of productHistory) {

        let info = ProductInfo.find((p) => p.UPC === product.productNo);

        if (!info) {
            info = { LCBONumber: "", unitsPerCase: 0, UPC: "", wholesalePrice: 0, supplier: "" };
        }

        const up = unitsPerPack[product.productNo] || 0;
        const stockPerPackVal = up > 0 ? (product.stock || 0) / up : 0;

        const productStatistic: ProductStatistics = {
            ...product,
            stockPerPack: stockPerPackVal,
            restockRequired: restockAmounts[product.productNo] || 0,
            restockReccomended: restockList[product.productNo] || 0,
            averageSales: averageMonthlySales[product.productNo] || 0,
            averageSalesPerPack: averageMonthlySalesPerPack[product.productNo] || 0,
            supplier: info.supplier || "",
            unitsPerPack: up,
            LCBONumber: info.LCBONumber || "",
            wholesalePrice: info.wholesalePrice || 0,
            includedMonths: includedMonths[product.productNo] || [],
            productDisabled: !!productDisabled[product.productNo],
            maxStock: maxStockPerProduct[product.productNo] || 0
        }

        productStatistics.push(productStatistic);
    }

    return { totalStatistics, productStatistics };
}