"use client";
import { useState, useEffect } from "react";
import { ProductInfo, ProductHistory } from "@/app/lib/types";
import { generateAllStatistics } from "@/app/lib/generateStatistics";
import { getLastXMonthIndices, getMonthString } from "@/app/lib/monthUtil";

interface ProductHistoryDisplayProps {
    productHistory: ProductHistory[];
    productInfo: ProductInfo[];
}

const ProductHistoryDisplay: React.FC<ProductHistoryDisplayProps> = ({ productHistory, productInfo }) => {
    // Months ordered from latest to oldest
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

    const lastXMonthIndices = getLastXMonthIndices(24);
    const lastXMonthIndicesRestock = getLastXMonthIndices(2);

    const { totalStatistics, productStatistics } = generateAllStatistics(productHistory, productInfo, monthsforAverage, includeCurrentMonth, currentDay, unitsPerPack, weeksToRestock, productDisabled, maxStockPerProduct, maxPacks);

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
                <h2 className="text-xl font-bold mb-2">Total Average Monthly Sales: {showInPacks ? totalStatistics.averageSalesPerPack.toFixed(2) : totalStatistics.averageSales.toFixed(2)} packs</h2>
                <h2 className="text-xl font-bold mb-2">Total Stock: {showInPacks ? totalStatistics.stockPerPack.toFixed(2) : totalStatistics.stock.toFixed(2)} packs</h2>
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
                            <th className="border border-gray-300 p-2">LCBO Number</th>
                            <th className="border border-gray-300 p-2">Disable</th>
                            <th className="border border-gray-300 p-2">Units/Pack</th>
                            <th className="border border-gray-300 p-2">Description</th>
                            <th className="border border-gray-300 p-2">Stock</th>
                            <th className="border border-gray-300 p-2">Avg Monthly Sales</th>
                            <th className="border border-gray-300 p-2">{`Restock (Packs)`}</th>
                            <th className="border border-gray-300 p-2">Maximum Stock</th>
                            {lastXMonthIndices.map((index) => (
                                <th key={index} className="border border-gray-300 p-2">{getMonthString(index)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {productStatistics.map((statistics, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}>
                                <td className="border border-gray-300 p-2">{statistics.LCBONumber}</td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="checkbox"
                                        className="border border-gray-300 p-2"
                                        checked={productDisabled[statistics.productNo] || false}
                                        onChange={() => handleProductDisabledChange(statistics.productNo)}
                                    />
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="number"
                                        className="border border-gray-300 p-2 w-[100%]"
                                        value={unitsPerPack[statistics.productNo] || ""}
                                        onChange={(event) => handleUnitsPerPackChange(event, statistics.productNo)}
                                        min="0"
                                    />
                                </td>
                                <td className="border border-gray-300 p-2">{statistics.description}</td>
                                <td className="border border-gray-300 p-2">{statistics.stock}</td>
                                <td className="border border-gray-300 p-2">{showInPacks ? statistics.averageSalesPerPack.toFixed(2) : statistics.averageSales.toFixed(2)}</td>
                                <td className="border border-gray-300 p-2">{statistics.restockRequired.toFixed(2)}</td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="number"
                                        className="border border-gray-300 p-2 w-[100%]"
                                        value={statistics.maxStock || ""}
                                        onChange={(event) => handleMaxStockPerProductChange(event, statistics.productNo)}
                                        min="0"
                                    />
                                </td>
                                {lastXMonthIndices.map((monthIndex) => (
                                    <td
                                        key={monthIndex}
                                        className={`border border-gray-300 p-2 ${statistics.includedMonths.includes(monthIndex) ? "text-green-500" : "text-red-500"}`}
                                    >
                                        {statistics.sales[monthIndex] || 0}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
            <div className="mt-4">
                <h2 className="text-xl font-bold mb-2">Restock List: {totalStatistics.restockReccomended}</h2>
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">LCBO Number</th>
                            <th className="border border-gray-300 p-2">Description</th>
                            <th className="border border-gray-300 p-2">Restock Amount (Packs)</th>
                            <th className="border border-gray-300 p-2">Stock</th>
                            <th className="border border-gray-300 p-2">Avg Monthly Sales</th>
                            {lastXMonthIndicesRestock.map((index) => (
                                <th key={index} className="border border-gray-300 p-2">{getMonthString(index)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(productStatistics.filter((s) => s.restockReccomended > 0).sort((a, b) => b.restockReccomended - a.restockReccomended)).map((statistics, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}>
                                <td className="border border-gray-300 p-2">
                                    {statistics.LCBONumber || "N/A"}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    {statistics.description || "N/A"}
                                </td>
                                <td className="border border-gray-300 p-2">{statistics.restockReccomended}</td>
                                <td className="border border-gray-300 p-2">
                                    {statistics.stock || 0}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    {showInPacks ? statistics.averageSalesPerPack.toFixed(2) : statistics.averageSales.toFixed(2)}
                                </td>
                                {lastXMonthIndicesRestock.map((monthIndex) => (
                                    <td key={monthIndex} className={`border border-gray-300 p-2 ${statistics.includedMonths.includes(monthIndex) ? "text-green-500" : "text-red-500"}`}>
                                        {statistics.sales[monthIndex] || 0}
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