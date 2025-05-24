"use client";
import { useState } from "react";
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

    const getfirstMonths = (productHistory: ProductHistory[]) => {
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
    const getLastMonthFraction = new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const getIncludedMonths = () => {
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

                // If the month is the last month, add the fraction of the month that has passed
                if (monthIndex === Math.max(...monthIndexes)) {
                    totalSales += salesValue;
                    monthsCount += getLastMonthFraction;
                } else {
                    totalSales += salesValue;
                    monthsCount++;
                }
            }

            averageSales[history.productNo] = totalSales / monthsCount;
        }

        return averageSales;
    }

    const averageMonthlySales = getAverageMonthlySales();

    const handleAverageMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setMonthsforAverage(value ? parseInt(value) : 0);
    }

    const handleIncludeCurrentMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setIncludeCurrentMonth(value);
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
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">Product No</th>
                        <th className="border border-gray-300 p-2">Description</th>
                        <th className="border border-gray-300 p-2">Stock</th>
                        <th className="border border-gray-300 p-2">Avg Monthly Sales</th>
                        <th className="border border-gray-300 p-2">Restock</th>
                        {monthIndexes.map((index) => (
                            <th key={index} className="border border-gray-300 p-2">{months[index]}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {productHistory.map((history, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}>
                            <td className="border border-gray-300 p-2">{history.productNo}</td>
                            <td className="border border-gray-300 p-2">{history.description}</td>
                            <td className="border border-gray-300 p-2">{history.stock}</td>
                            <td className="border border-gray-300 p-2">{averageMonthlySales[history.productNo].toFixed(2) || 0}</td>
                            <td className="border border-gray-300 p-2">{((averageMonthlySales[history.productNo] || 0) - (history.stock || 0)) > 0 ? (((averageMonthlySales[history.productNo] || 0) - (history.stock || 0)).toFixed(2)) : 0}</td>
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