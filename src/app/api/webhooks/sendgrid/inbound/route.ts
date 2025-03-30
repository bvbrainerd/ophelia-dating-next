import { NextResponse } from "next/server";
import { simpleParser } from "mailparser";
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

// http://lin=
// ks.opentable.com/ls/click?upn=3Du001.FTI3lR9zHv5grtCBELijzEIFHLhl0Dr2cnM-2F=
// 61IP7POR1jN055yBRYQM7JUryW1R9MTeHk0F9vEwq5pXgFqKcgDt2xlIt6vVfE9wRuonKxqMk0s=
// mCAXvn1hhXzkk01qAfTMAjUFJKjj-2FiGAC6Kq7q2h4kepfHUO6Z1QkaZnPY9E-2F-2FqoSQXgL=
// BGK23oQwPMaeDFvRDcPhkP3sVpW3rid2M6Fzbni2LKL710NC2f4Lzekjfpy5xijfas6qspN3N28=
// 2MXl9-2FWdyGWDRr6wvG7d68YRHOuY-2FnE0KEz6ru8QANSlV3KcOlUPF8C0nuFXHq-2Bntnxx6=
// 78Wa8ukujTTcn0MBX-2FeZdCPATH383Cdmv-2FaiUwhytXb4stkQmvr-2BeFvV2qaidIj-2FLHT=
// CKE9jpkBzZripTRG6wKltBEY8REeUBrGCgLI-3DfDNx_hHhu4oXhQslp0sAIT4Aa1d5gIk8RcRd=
// xBFXwaNg3v6ybQIwsz4mh46HVeelu-2FJPgG706chULIf9qxfxk5zslUEkoRBPIAbyIAbEthI26=
// jKRX7iMNW0Z92wXaQEHjJeycjNs0qsdubOwbKgjHa-2BtdJsz9gaUZ4MbonEJNTUWJI2jyJ67Fz=
// oMK2u5bdEFg2oPEpaamYp3y8-2FClJw-2BEVWsvap4rOyk9TcwJssFXIr-2FLc-2FxRYdM26L-2=
// BdsNUMCwJjsWEAHuynySiUSYVtwOQH3R-2BAulRa6EHXPxO1MPFNx1j2qHFeEo96Y5ViHZo4UC-=
// 2BKaSjatWZVoIInANkf6qLUXgT7YvxJMNPaMMAgPMtGm9g5tIK4Az9BXOs8tMksKojhbUvk6glX=
// ETzqO-2F7gG11QBGpJ2EM3sqWWGzeJhq-2Fcv6Tr6L5FrdRAKp-2BjQ1JpnKpXGHOgJzZD5A6KS=
// n6jPumH3nq6F-2Fd2peCdfIorMRLrOgRuhtyRe9lqUCM7CewZeBc9OtwMJ39KvHzjErnf2kaTgv=
// BnTqwf3V5Q702ssPdPSB16FAw-3D