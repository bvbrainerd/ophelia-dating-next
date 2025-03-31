import { NextResponse } from 'next/server';
// import DocumentIntelligence from '@azure-rest/ai-document-intelligence';
// import { getLongRunningPoller, isUnexpected } from '@azure-rest/ai-document-intelligence';
import { Receipt } from '@/types/receipt';

const receiptUrl = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/rest-api/receipt.png";

const endpoint = process.env.AZURE_FORM_RECOGNIZER_URL;
const key = process.env.AZURE_FORM_RECOGNIZER_KEY;

export async function GET(request: Request) {
  try {
    // Return mock response
    return NextResponse.json({ 
      success: true, 
      message: 'Receipt processing test endpoint is temporarily disabled' 
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Test endpoint error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return NextResponse.json({
    receipt: {
      merchant: "Maccas",
      date: "2025-03-10",
      subtotal: 102.73,
      total: 109.15,
      opheliaFee: 15.41,
      tax: 6.42,
      currency: "USD",
      items: [
        {
          description: "Big Mac Meal",
          quantity: 2,
          totalPrice: 31.78
        },
        {
          description: "40 piece McNuggets",
          quantity: 1,
          totalPrice: 15.99
        },
        {
          description: "Apple Pie",
          quantity: 2,
          totalPrice: 4.98
        },
        {
          description: "McFlurry",
          quantity: 10,
          totalPrice: 49.98
        },
      ]
    }
  });
}