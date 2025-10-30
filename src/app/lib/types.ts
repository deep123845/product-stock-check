export interface ProductHistory {
    productNo: string;
    description: string;
    stock: number;
    sales: { [monthId: number]: number };
}

export interface ProductInfo {
    LCBONumber: string;
    unitsPerCase: number;
    UPC: string;
    wholesalePrice: number;
    supplier: string;
}

export interface ProductStatistics {
    productNo: string;
    supplier: string;
    description: string;
    stock: number;
    stockPerPack: number;
    sales: { [monthId: number]: number };
    unitsPerPack: number;
    LCBONumber: string;
    wholesalePrice: number;
    averageSales: number;
    averageSalesPerPack: number;
    restockRequired: number;
    restockReccomended: number;
    includedMonths: number[];
    productDisabled: boolean;
    maxStock: number;
}