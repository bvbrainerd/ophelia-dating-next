import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function POST(request: Request) {
  try {
    const client = createClient();
    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect();

    const rawBody = await request.formData(); // SendGrid sends raw text or form data
    // console.log('rawBody', rawBody);
    const envelope = JSON.parse(rawBody.get("envelope") as string);
    const emailAddress = envelope.to[0];
    const uniqueId = emailAddress.split("+")[1].split("@")[0];
    const emailBody = rawBody.get('email')?.toString();

    const verificationCodeRegex = /Your verification code is (\w+)/i;

    const match = emailBody?.match(verificationCodeRegex);
    const verificationCode = match ? match[1] : null;

    
    // console.log("verification code", verificationCode);
    if (uniqueId === undefined) {
      console.log("uniqueId is undefined");
    }
    else if (verificationCode === null) {
      console.log("verificationCode is null");
    }
    else {
      await client.set('verification_code_' + uniqueId, verificationCode, {
        EX: 60 * 5, // Set expiration time to 5 minutes
      });
      await client.get('verification_code_' + uniqueId);
      console.log("verification code set in redis", verificationCode);
    }

    await client.quit();


    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}