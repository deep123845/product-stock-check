"use client";

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
    const monthIndexes = Object.keys(months).map(Number).sort((a, b) => b - a);

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

    const getAverageMonthlySales = (productHistory: ProductHistory[], numMonth?: number) => {
        const averageSales: { [productNo: string]: number } = {};
        const averageLength = numMonth || monthIndexes.length;

        for (let i = 0; i < productHistory.length; i++) {
            const history = productHistory[i];
            const sales = history.sales;

            let monthsCount = 0;
            let totalSales = 0;
            for (let j = 0; j < averageLength; j++) {
                const monthIndex = monthIndexes[j];
                const salesValue = sales[monthIndex] || 0;

                if (firstMonth[history.productNo] > monthIndex) {
                    continue; // Skip months before the first month of sales
                }

                // If the month is the last month, add the fraction of the month that has passed
                if (monthIndex === Math.max(...monthIndexes)) {
                    totalSales += salesValue * getLastMonthFraction;
                    monthsCount += getLastMonthFraction;
                } else {
                    totalSales += salesValue;
                    monthsCount++;
                }
            }

            averageSales[history.productNo] = totalSales / monthsCount;
        }

        console.log("Average Sales:", averageSales);
        return averageSales;
    }

    const averageMonthlySales = getAverageMonthlySales(productHistory);
    const average1Month = getAverageMonthlySales(productHistory, 1);
    const average3Month = getAverageMonthlySales(productHistory, 3);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">Product No</th>
                        <th className="border border-gray-300 p-2">Description</th>
                        <th className="border border-gray-300 p-2">Stock</th>
                        <th className="border border-gray-300 p-2">Avg Monthly Sales</th>
                        <th className="border border-gray-300 p-2">Avg 1 Month</th>
                        <th className="border border-gray-300 p-2">Avg 3 Month</th>
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
                            <td className="border border-gray-300 p-2">{average1Month[history.productNo].toFixed(2) || 0}</td>
                            <td className="border border-gray-300 p-2">{average3Month[history.productNo].toFixed(2) || 0}</td>
                            <td className="border border-gray-300 p-2">{((averageMonthlySales[history.productNo] || 0) - (history.stock || 0)) > 0 ? (((averageMonthlySales[history.productNo] || 0) - (history.stock || 0)).toFixed(2)) : 0}</td>
                            {monthIndexes.map((monthIndex) => (
                                <td key={monthIndex} className={`border border-gray-300 p-2 ${firstMonth[history.productNo] < monthIndex ? "text-green-500" : "text-red-500"}`}>
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