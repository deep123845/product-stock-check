"use client";
import { useState, useEffect } from "react";
import { ProductInfo, ProductHistory } from "@/app/lib/types";
import {
    calculateTotalAverageSales, calculateTotalStock, convertToPerPack,
    generatePriorityRestockList, getAverageMonthlySales, getIncludedMonths,
    getRestockAmounts, calculateTotalStockPerPack
} from "@/app/lib/generateStatistics";

interface ProductHistoryDisplayProps {
    productHistory: ProductHistory[];
    productInfo?: ProductInfo[];
    months: { [id: number]: string };
}

const ProductHistoryDisplay: React.FC<ProductHistoryDisplayProps> = ({ productHistory, productInfo, months }) => {
    // Months ordered from latest to oldest
    const monthIndices = Object.keys(months).map(Number).sort((a, b) => b - a);

    const [monthsforAverage, setMonthsforAverage] = useState<number>(0);
    const [includeCurrentMonth, setIncludeCurrentMonth] = useState<boolean>(true);
    const [currentDay, setCurrentDay] = useState<number>(new Date().getDate());
    const [weeksToRestock, setWeeksToRestock] = useState<number>(4);
    const [unitsPerPackOverride, setUnitsPerPackOverride] = useState<{ [productNo: string]: number }>({});
    const [productDisabled, setProductDisabled] = useState<{ [productNo: string]: boolean }>({});
    const [maxPacks, setMaxPacks] = useState<number>(45);
    const [maxStockPerProduct, setMaxStockPerProduct] = useState<{ [productNo: string]: number }>({});
    const [tableVisible, setTableVisible] = useState<boolean>(true);
    const [showInPacks, setShowInPacks] = useState<boolean>(true);

    useEffect(() => {
        const storedUnitsPerPack = localStorage.getItem("unitsPerPack");
        if (storedUnitsPerPack) {
            setUnitsPerPackOverride(JSON.parse(storedUnitsPerPack));
        }
        const storedProductDisabled = localStorage.getItem("productDisabled");
        if (storedProductDisabled) {
            setProductDisabled(JSON.parse(storedProductDisabled));
        }
        const storedMaxStock = localStorage.getItem("maxStockPerProduct");
        if (storedMaxStock) {
            setMaxStockPerProduct(JSON.parse(storedMaxStock));
        }
    }, []);

    const consolidateUnitsPerPack = () => {
        const newUnitsPerPack: { [productNo: string]: number } = { ...unitsPerPackOverride };

        if (productInfo) {
            for (const product of productInfo) {
                if (newUnitsPerPack[product.UPC] === undefined) {
                    newUnitsPerPack[product.UPC] = product.unitsPerCase;
                }
            }
        }

        return newUnitsPerPack;
    }

    const unitsPerPack = consolidateUnitsPerPack();

    const includedMonths = getIncludedMonths(productHistory, monthIndices, monthsforAverage, includeCurrentMonth);
    const averageMonthlySales = getAverageMonthlySales(productHistory, monthIndices, includedMonths, currentDay);
    const averageMonthlySalesPerPack = convertToPerPack(averageMonthlySales, unitsPerPack);
    const restockAmounts = getRestockAmounts(productHistory, weeksToRestock, averageMonthlySales, unitsPerPack);
    const { restockList, restockTotal } = generatePriorityRestockList(productHistory, weeksToRestock, averageMonthlySales, unitsPerPack, productDisabled, maxStockPerProduct, maxPacks);;
    const totalStock = calculateTotalStock(productHistory);
    const totalStockPerPack = calculateTotalStockPerPack(productHistory, unitsPerPack);
    const totalAverageSales = calculateTotalAverageSales(productHistory, averageMonthlySales);
    const totalAverageSalesPerPack = calculateTotalAverageSales(productHistory, averageMonthlySalesPerPack);

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
        const newUnitsPerPack = { ...unitsPerPackOverride, [productNo]: value ? parseInt(value) : -1 };
        setUnitsPerPackOverride(newUnitsPerPack);
        localStorage.setItem("unitsPerPack", JSON.stringify(newUnitsPerPack));
    }

    const handleMaxStockPerProductChange = (event: React.ChangeEvent<HTMLInputElement>, productNo: string) => {
        const value = event.target.value;
        const newMaxStockPerProduct = { ...maxStockPerProduct, [productNo]: value ? parseInt(value) : -1 };
        setMaxStockPerProduct(newMaxStockPerProduct);
        localStorage.setItem("maxStockPerProduct", JSON.stringify(newMaxStockPerProduct));
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
                <h2 className="text-xl font-bold mb-2">Total Average Monthly Sales: {showInPacks ? totalAverageSalesPerPack.toFixed(2) : totalAverageSales.toFixed(2)} packs</h2>
                <h2 className="text-xl font-bold mb-2">Total Stock: {showInPacks ? totalStockPerPack.toFixed(2) : totalStock.toFixed(2)} packs</h2>
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
                            <th className="border border-gray-300 p-2">Max Stock</th>
                            {monthIndices.map((index) => (
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
                                <td className="border border-gray-300 p-2">{showInPacks ? averageMonthlySalesPerPack[history.productNo].toFixed(2) : averageMonthlySales[history.productNo].toFixed(2)}</td>
                                <td className="border border-gray-300 p-2">{restockAmounts[history.productNo].toFixed(2)}</td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="number"
                                        className="border border-gray-300 p-2 w-[100%]"
                                        value={maxStockPerProduct[history.productNo] || ""}
                                        onChange={(event) => handleMaxStockPerProductChange(event, history.productNo)}
                                        min="0"
                                    />
                                </td>
                                {monthIndices.map((monthIndex) => (
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
                            <th className="border border-gray-300 p-2">LCBO Number</th>
                            <th className="border border-gray-300 p-2">Description</th>
                            <th className="border border-gray-300 p-2">Restock Amount (Packs)</th>
                            <th className="border border-gray-300 p-2">Stock</th>
                            <th className="border border-gray-300 p-2">Avg Monthly Sales</th>
                            {monthIndices.map((index) => (
                                index < monthIndices.length - 2 ? null :
                                    <th key={index} className="border border-gray-300 p-2">{months[index]}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(restockList).map((productNo, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}>
                                <td className="border border-gray-300 p-2">{productNo}</td>
                                <td className="border border-gray-300 p-2">
                                    {productInfo?.find(info => info.UPC === productNo)?.LCBONumber || "N/A"}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    {productHistory.find(history => history.productNo === productNo)?.description || "N/A"}
                                </td>
                                <td className="border border-gray-300 p-2">{restockList[productNo]}</td>
                                <td className="border border-gray-300 p-2">
                                    {productHistory.find(history => history.productNo === productNo)?.stock || 0}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    {showInPacks ? averageMonthlySalesPerPack[productNo].toFixed(2) : averageMonthlySales[productNo].toFixed(2)}
                                </td>
                                {monthIndices.map((monthIndex) => (
                                    monthIndex < monthIndices.length - 2 ? null :
                                        <td key={monthIndex} className={`border border-gray-300 p-2 ${includedMonths[productNo].includes(monthIndex) ? "text-green-500" : "text-red-500"}`}>
                                            {productHistory.find(history => history.productNo === productNo)?.sales[monthIndex] || 0}
                                        </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProductHistoryDisplay;