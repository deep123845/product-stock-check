export interface ProductHistory {
    productNo: string;
    supplier: string;
    description: string;
    stock: number;
    sales: { [id: number]: number };
}

export interface ProductInfo {
    LCBONumber: string;
    unitsPerCase: number;
    UPC: string;
    wholesalePrice: number;
    supplier: string;
}