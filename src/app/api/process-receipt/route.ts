import { NextResponse } from 'next/server';
// import sharp from 'sharp';
// import DocumentIntelligence from '@azure-rest/ai-document-intelligence';
// import { getLongRunningPoller, isUnexpected } from '@azure-rest/ai-document-intelligence';
import { Receipt } from '@/types/receipt';

export async function POST(request: Request) {
  try {
    // Return mock response
    const mockReceipt: Receipt = {
      merchant: "Test Restaurant",
      date: new Date().toISOString(),
      subtotal: 50.00,
      total: 57.50,
      tax: 5.00,
      tip: 2.50,
      opheliaFee: 7.50,
      currency: "USD",
      items: [
        {
          description: "Test Item",
          quantity: 1,
          totalPrice: 50.00,
        }
      ],
    };

    return NextResponse.json({ receipt: mockReceipt });
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: 'Error processing receipt' },
      { status: 500 }
    );
  }
}