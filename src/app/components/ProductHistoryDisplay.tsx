"use client";
import { useState, useEffect } from "react";
export interface ProductHistory {
    productNo: string;
    supplier: string;
    description: string;
    stock: number;
    sales: { [id: number]: number };
}

interface ProductHistoryDisplayProps {
    productHistory: ProductHistory[];
    months: { [id: number]: string };
}

const ProductHistoryDisplay: React.FC<ProductHistoryDisplayProps> = ({ productHistory, months }) => {
    // Months ordered from latest to oldest
    const monthIndexes = Object.keys(months).map(Number).sort((a, b) => b - a);

    const [monthsforAverage, setMonthsforAverage] = useState<number>(0);
    const [includeCurrentMonth, setIncludeCurrentMonth] = useState<boolean>(true);
    const [currentDay, setCurrentDay] = useState<number>(new Date().getDate());
    const [weeksToRestock, setWeeksToRestock] = useState<number>(4);
    const [unitsPerPack, setUnitsPerPack] = useState<{ [productNo: string]: number }>({});

    useEffect(() => {
        const storedUnitsPerPack = localStorage.getItem("unitsPerPack");
        if (storedUnitsPerPack) {
            setUnitsPerPack(JSON.parse(storedUnitsPerPack));
        }
    }, []);

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

    const firstMonth = getfirstMonths(productHistory);

    // get the fraction of the last month that has passed (days elsapsed/ days in month)
    const getLastMonthFraction = currentDay / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const getIncludedMonths = () => {
        if (!productHistory || productHistory.length === 0) {
            return {};
        }
        const includedMonths: { [productNo: string]: number[] } = {};

        for (let i = 0; i < productHistory.length; i++) {
            const history = productHistory[i];

            includedMonths[history.productNo] = [];

            for (let j = 0; j < monthIndexes.length; j++) {
                const monthIndex = monthIndexes[j];

                if (firstMonth[history.productNo] >= monthIndex) {
                    continue; // Skip first month and any months before it
                }

                if (!includeCurrentMonth && (Math.max(...monthIndexes) === monthIndex)) {
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

    const includedMonths = getIncludedMonths();

    const getAverageMonthlySales = () => {
        if (!productHistory || productHistory.length === 0) {
            return {};
        }
        const averageSales: { [productNo: string]: number } = {};

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
                if (monthIndex === Math.max(...monthIndexes)) {
                    monthsCount += getLastMonthFraction;
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

    const averageMonthlySales = getAverageMonthlySales();

    const getRestockAmounts = () => {
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
            const monthsRestock = weeksToRestock / weeksInMonth;
            const restockUnits = Math.max(0, ((averageSales * monthsRestock) - stock));
            restockAmounts[productNo] = restockUnits / unitsPerPackValue;
        }

        return restockAmounts;
    }

    const restockAmounts = getRestockAmounts();

    const generatePriorityRestockList = () => {
        if (!productHistory || productHistory.length === 0) {
            return {};
        }
        const maxPacks = 45;
        const restockAmountsCopy = { ...restockAmounts };
        const restockList: { [productNo: string]: number } = {};

        for (let i = 0; i < maxPacks; i++) {
            const maxRestockProductNo = Object.keys(restockAmountsCopy).reduce((a, b) => restockAmountsCopy[a] > restockAmountsCopy[b] ? a : b);
            if (restockAmountsCopy[maxRestockProductNo] <= 0.5) {
                console.log(i + 1);
                break; // No more products to restock
            }

            if (!restockList[maxRestockProductNo]) {
                restockList[maxRestockProductNo] = 0;
            }

            restockList[maxRestockProductNo] += 1;
            restockAmountsCopy[maxRestockProductNo] -= 1;
        }

        for (let i = 0; i < Object.keys(restockList).length; i++) {
            const productNo = Object.keys(restockList)[i];
            console.log(`Product No: ${productNo}, Description: ${productHistory.find(history => history.productNo === productNo)?.description}, Restock Amount: ${restockList[productNo]}`);
        }
        return restockList;
    }

    const restockList = generatePriorityRestockList();


    const handleAverageMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setMonthsforAverage(value ? parseInt(value) : 0);
    }

    const handleIncludeCurrentMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setIncludeCurrentMonth(value);
    }

    const handleCurrentDayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setCurrentDay(value ? parseInt(value) : 0);
    }

    const handleWeeksToRestockChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setWeeksToRestock(value ? parseInt(value) : 0);
    }

    const handleUnitsPerPackChange = (event: React.ChangeEvent<HTMLInputElement>, productNo: string) => {
        const value = event.target.value;
        const newUnitsPerPack = { ...unitsPerPack, [productNo]: value ? parseInt(value) : 0 };
        setUnitsPerPack(newUnitsPerPack);
        localStorage.setItem("unitsPerPack", JSON.stringify(newUnitsPerPack));
    }

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center">
                <input
                    type="number"
                    className="border border-gray-300 p-2 w-1/8 mr-2"
                    placeholder="Enter number of months to average"
                    value={monthsforAverage}
                    onChange={handleAverageMonthChange}
                    min="0"
                />
                <p className="text-l font-bold">{"Number of Months to average sales over (0 means average over all available data)"}</p>
            </div>
            <div className="flex items-center">
                <input
                    type="checkbox"
                    className="border border-gray-300 p-2 mr-2"
                    checked={includeCurrentMonth}
                    onChange={handleIncludeCurrentMonthChange}
                />
                <p className="text-l font-bold">{"Include current month (current month is usually partial)"}</p>
            </div>
            <div className="flex items-center">
                <input
                    type="number"
                    className="border border-gray-300 p-2 w-1/8 mr-2"
                    placeholder="Enter day of month of report"
                    value={currentDay}
                    onChange={handleCurrentDayChange}
                    min="1"
                    max="31"
                />
                <p className="text-l font-bold">{"Day of month at time of report"}</p>
            </div>
            <div className="flex items-center">
                <input
                    type="number"
                    className="border border-gray-300 p-2 w-1/8 mr-2"
                    placeholder="Enter number of weeks to restock"
                    value={weeksToRestock}
                    onChange={handleWeeksToRestockChange}
                    min="1"
                />
                <p className="text-l font-bold">{"Weeks to restock"}</p>
            </div>
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">Product No</th>
                        <th className="border border-gray-300 p-2">Units per Pack</th>
                        <th className="border border-gray-300 p-2">Description</th>
                        <th className="border border-gray-300 p-2">Stock</th>
                        <th className="border border-gray-300 p-2">Avg Monthly Sales</th>
                        <th className="border border-gray-300 p-2">{`Restock (Packs)`}</th>
                        {monthIndexes.map((index) => (
                            <th key={index} className="border border-gray-300 p-2">{months[index]}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {productHistory.map((history, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}>
                            <td className="border border-gray-300 p-2">{history.productNo}</td>
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="number"
                                    className="border border-gray-300 p-2 w-[100%]"
                                    value={unitsPerPack[history.productNo] || ""}
                                    onChange={(event) => handleUnitsPerPackChange(event, history.productNo)}
                                    min="0"
                                />
                            </td>
                            <td className="border border-gray-300 p-2">{history.description}</td>
                            <td className="border border-gray-300 p-2">{history.stock}</td>
                            <td className="border border-gray-300 p-2">{averageMonthlySales[history.productNo].toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">{restockAmounts[history.productNo].toFixed(2)}</td>
                            {monthIndexes.map((monthIndex) => (
                                <td
                                    key={monthIndex}
                                    className={`border border-gray-300 p-2 ${includedMonths[history.productNo].includes(monthIndex) ? "text-green-500" : "text-red-500"}`}
                                >
                                    {history.sales[monthIndex] || 0}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProductHistoryDisplay;