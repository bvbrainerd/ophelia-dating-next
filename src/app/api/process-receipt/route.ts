import sharp from 'sharp';
import { NextResponse } from 'next/server';
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default,
{ getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");
import { Receipt } from '@/types/receipt';

// const receiptUrl = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/rest-api/receipt.png";

const endpoint = process.env.AZURE_FORM_RECOGNIZER_URL;
const key = process.env.AZURE_FORM_RECOGNIZER_KEY;

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    // Convert the file to a base64 string
    const buffer = Buffer.from(await file.arrayBuffer());

    const optimizedBuffer = await sharp(buffer)
    .resize({ width: 1000 }) // Resize width to 1000px
    .jpeg({ quality: 85 }) // WebP compression
    .toBuffer();

    const base64image = optimizedBuffer.toString("base64");

    // create client instance and run analysis
    const client = DocumentIntelligence(endpoint, {key:key});
    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-receipt")
      .post({
          contentType: "application/json",
          body: {
              base64Source: base64image,
          },
      });

      if (isUnexpected(initialResponse)) {
        throw initialResponse.body.error;
      }


      // start polling for results
      const poller = getLongRunningPoller(client, initialResponse);
      const analyzeResult = (await poller.pollUntilDone()).body.analyzeResult;

      const documents = analyzeResult?.documents;
      const result = documents && documents[0];
  
    if (result) {
      const receipt: Receipt = {
        merchant: result.fields.MerchantName?.valueString || "Unknown",
        date: result.fields.TransactionDate?.valueDate || new Date().toISOString(),
        subtotal: result.fields.Subtotal?.valueCurrency?.amount || 0,
        total: result.fields.Total?.valueCurrency?.amount || 0,
        tax: result.fields.Tax?.valueCurrency?.amount || 0,
        tip: result.fields.Tip?.valueCurrency?.amount,
        opheliaFee: result.fields.Subtotal?.valueCurrency?.amount * 0.15 || 0,
        currency: result.fields.Total?.valueCurrency?.currencyCode || "USD",
        items: (result.fields.Items?.valueArray || []).map(( item: any ) => {

          return {
            description: item.valueObject?.Description?.valueString ?? "Unknown Item",
            quantity: item.valueObject?.Quantity?.valueNumber ?? 1,
            totalPrice: item.valueObject?.TotalPrice?.valueCurrency?.amount ?? 0,
          };
        }),
      };
      
      // console.log('Receipt:', formattedReceipt);
      return NextResponse.json({ receipt: receipt });
    } else {
      return NextResponse.json(
        { error: 'Error processing receipt' },
        { status: 500 }
      );    
    }
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: 'Error processing receipt' },
      { status: 500 }
    );
  }
}