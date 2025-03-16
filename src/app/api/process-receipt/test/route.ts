import { NextResponse } from 'next/server';
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default,
{ getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");
import { Receipt } from '@/types/receipt';

const receiptUrl = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/rest-api/receipt.png";

const endpoint = process.env.AZURE_FORM_RECOGNIZER_URL;
const key = process.env.AZURE_FORM_RECOGNIZER_KEY;

export async function GET(request: Request) {
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
          name: "Big Mac Meal",
          quantity: 2,
          totalPrice: 31.78
        },
        {
          name: "40 piece McNuggets",
          quantity: 1,
          totalPrice: 15.99
        },
        {
          name: "Apple Pie",
          quantity: 2,
          totalPrice: 4.98
        },
        {
          name: "McFlurry",
          quantity: 10,
          totalPrice: 49.98
        },
      ]
    }
  });
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
          name: "Big Mac Meal",
          quantity: 2,
          totalPrice: 31.78
        },
        {
          name: "40 piece McNuggets",
          quantity: 1,
          totalPrice: 15.99
        },
        {
          name: "Apple Pie",
          quantity: 2,
          totalPrice: 4.98
        },
        {
          name: "McFlurry",
          quantity: 10,
          totalPrice: 49.98
        },
      ]
    }
  });
}