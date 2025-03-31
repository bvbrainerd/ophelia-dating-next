export interface Receipt {
  merchant: string;
  date: string;
  subtotal: number;
  total: number;
  tax: number;
  tip?: number;
  opheliaFee: number;
  currency: string;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  totalPrice: number;
}