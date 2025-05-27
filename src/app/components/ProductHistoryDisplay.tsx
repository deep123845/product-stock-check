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
    const [productDisabled, setProductDisabled] = useState<{ [productNo: string]: boolean }>({});
    const [maxPacks, setMaxPacks] = useState<number>(45);
    const [tableVisible, setTableVisible] = useState<boolean>(true);
    const [showInPacks, setShowInPacks] = useState<boolean>(true);

    useEffect(() => {
        const storedUnitsPerPack = localStorage.getItem("unitsPerPack");
        if (storedUnitsPerPack) {
            setUnitsPerPack(JSON.parse(storedUnitsPerPack));
        }
        const storedProductDisabled = localStorage.getItem("productDisabled");
        if (storedProductDisabled) {
            setProductDisabled(JSON.parse(storedProductDisabled));
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

    const getRestockAmounts = (weeksRestock: number) => {
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
            const restockUnits = Math.max(0, ((averageSales * monthsRestock) - stock));
            restockAmounts[productNo] = restockUnits / unitsPerPackValue;
        }

        return restockAmounts;
    }

    const restockAmounts = getRestockAmounts(weeksToRestock);

    const generatePriorityRestockList = (): { restockList: { [productNo: string]: number }, restockTotal: number } => {
        if (!productHistory || productHistory.length === 0) {
            return { restockList: {}, restockTotal: 0 };
        }

        const minAmount = 0.5;
        const restockList: { [productNo: string]: number } = {};
        let restockTotal = 0;

        for (let j = 1; j <= weeksToRestock; j++) {
            const restockAmountsCopy = getRestockAmounts(j);
            // Filter out products that are disabled
            Object.keys(productDisabled).forEach(productNo => {
                if (productDisabled[productNo]) {
                    delete restockAmountsCopy[productNo];
                }
            });

            for (const productNo in restockAmountsCopy) {
                if (restockList[productNo]) {
                    restockAmountsCopy[productNo] = restockAmountsCopy[productNo] - restockList[productNo];
                }
            }

            while (restockTotal < maxPacks) {
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
        const output = { restockList, restockTotal };
        return output;
    }

    const { restockList, restockTotal } = generatePriorityRestockList();

    const calculateTotalAverageSales = () => {
        if (!productHistory || productHistory.length === 0) {
            return 0;
        }

        let totalSales = 0;

        for (const productNo in averageMonthlySales) {
            totalSales += averageMonthlySales[productNo] / unitsPerPack[productNo];
        }

        return totalSales;
    }

    const totalAverageSales = calculateTotalAverageSales();

    const calculateTotalStock = () => {
        if (!productHistory || productHistory.length === 0) {
            return 0;
        }

        let totalStock = 0;

        for (const history of productHistory) {
            totalStock += history.stock / unitsPerPack[history.productNo];
        }

        return totalStock;
    }

    const totalStock = calculateTotalStock();

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

    const handleProductDisabledChange = (productNo: string) => {
        const newProductDisabled = { ...productDisabled, [productNo]: !productDisabled[productNo] };
        setProductDisabled(newProductDisabled);
        localStorage.setItem("productDisabled", JSON.stringify(newProductDisabled));
    }

    const handleMaxPacksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setMaxPacks(value ? parseInt(value) : 45);
    }

    const handleTableVisible = () => {
        setTableVisible(!tableVisible);
    }

    const handleShowInPacksChange = () => {
        setShowInPacks(!showInPacks);
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
            <div className="flex items-center">
                <input
                    type="number"
                    className="border border-gray-300 p-2 w-1/8 mr-2"
                    placeholder="Enter max packs to restock"
                    value={maxPacks}
                    onChange={handleMaxPacksChange}
                    min="1"
                />
                <p className="text-l font-bold">{"Max packs to restock"}</p>
            </div>
            <div className="flex items-center">
                <input
                    type="checkbox"
                    className="border border-gray-300 p-2 mr-2"
                    checked={showInPacks}
                    onChange={handleShowInPacksChange}
                />
                <p className="text-l font-bold">{"Show average monthly sales in packs"}</p>
            </div>
            <div className="my-2">
                <h2 className="text-xl font-bold mb-2">Total Average Monthly Sales: {totalAverageSales.toFixed(2)} packs</h2>
                <h2 className="text-xl font-bold mb-2">Total Stock: {totalStock.toFixed(2)} packs</h2>
            </div>
            <div className="flex items-center mb-4">
                <button
                    className="bg-gray-500 text-white p-2 rounded mr-2"
                    onClick={handleTableVisible}
                >
                    {tableVisible ? "Hide Table" : "Show Table"}
                </button>
            </div>
            {tableVisible && <div>
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Product No</th>
                            <th className="border border-gray-300 p-2">Disable</th>
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
                                        type="checkbox"
                                        className="border border-gray-300 p-2"
                                        checked={productDisabled[history.productNo] || false}
                                        onChange={() => handleProductDisabledChange(history.productNo)}
                                    />
                                </td>
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
                                <td className="border border-gray-300 p-2">{(averageMonthlySales[history.productNo] / (showInPacks ? unitsPerPack[history.productNo] : 1)).toFixed(2)}</td>
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
            </div>}
            <div className="mt-4">
                <h2 className="text-xl font-bold mb-2">Restock List: {restockTotal}</h2>
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Product No</th>
                            <th className="border border-gray-300 p-2">Description</th>
                            <th className="border border-gray-300 p-2">Restock Amount (Packs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(restockList).map((productNo, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}>
                                <td className="border border-gray-300 p-2">{productNo}</td>
                                <td className="border border-gray-300 p-2">
                                    {productHistory.find(history => history.productNo === productNo)?.description || "N/A"}
                                </td>
                                <td className="border border-gray-300 p-2">{restockList[productNo]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProductHistoryDisplay;