
import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';

/* Restaurants with seating options for reservations:
* - Buttermilk & Bourbon
* - Blue Ribbon Sushi
* - Moo Seaport
* - Krasi
* - Branch Line
* - Capital Grille
*/

/* Restaurants without OpenTable Reservations:
* - Capo
* - Lolita Back Bay
* - Kava
* - Carmelina's North End
* - Coquette
* - Boston Burger Company
* - Lola 42
* - Bartaco
* - 
*/

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function tryVerificationCode(uniqueId: string, reservationPage: any) {
  //
  let verificationCode = await getVerificationCode(uniqueId);    
  console.log(uniqueId);
  const verificationCodeInput = reservationPage.locator('iframe[title="Sign in"]').contentFrame().locator('[data-test="verification-code-input"]');
  await reservationPage.waitForTimeout(1000);
  await verificationCodeInput.fill(verificationCode);

  // wait to make sure verification was successful, if not, then click resend code and wait for the code again
  await reservationPage.waitForTimeout(1000);
  
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    const verificationCodeError = reservationPage
      .locator('iframe[title="Sign in"]')
      .contentFrame()
      .getByText('Something went wrong. Request a new code.');

      await reservationPage.waitForTimeout(5000);

    if (await verificationCodeError.count() > 0) {
      console.log('Verification code error visible, clicking resend code');
      const resendCodeButton = reservationPage
        .locator('iframe[title="Sign in"]')
        .contentFrame()
        .getByRole('button', { name: 'Resend code' });

      await resendCodeButton.click();

      await reservationPage.waitForTimeout(5000);
      // Check if the code was resent successfully
      const codeResentNotif = reservationPage
        .locator('iframe[title="Sign in"]')
        .contentFrame()
        .getByText('A code has been successfully resent.');

      if (await codeResentNotif.count() > 0) {
        verificationCode = await getVerificationCode(uniqueId);
        const verificationCodeInput = reservationPage
          .locator('iframe[title="Sign in"]')
          .contentFrame()
          .locator('[data-test="verification-code-input"]');
        await verificationCodeInput.fill(verificationCode);
        console.log('Verification code entered successfully');
        break; // Exit the loop if the code is entered successfully
      }
    }
    else {
      break;
    }

    retries++;
    if (retries >= maxRetries) {
      console.error('Max retries reached. Could not verify the code.');
      break;
    }

    console.log(`Retrying... (${retries}/${maxRetries})`);
    await reservationPage.waitForTimeout(2000); // Wait before retrying
  }
}

async function getVerificationCode(uniqueId: string) {
  // poll for redis code
  try {
    const redisClient = createClient();
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    const verificationCode: string = await new Promise((resolve) => {
      let timeWaited = 0;
      const interval = setInterval(async () => {
        const code = await redisClient.get(`verification_code_${uniqueId}`);
        console.log('polling for verification code. time waited:', timeWaited);
        if (code) {
          clearInterval(interval);
          resolve(code);
        }
        timeWaited += 1000;
      }, 1000);
    });
    await redisClient.del(`verification_code_${uniqueId}`);
    await redisClient.quit();
    return verificationCode;
  } catch (err) {
    console.error('Error getting verification code:', err);
    return 'null';
  }
}

function randPhonenumber(): string {
  const areaCode = 860;
  const centralOfficeCode = 555;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}${centralOfficeCode}${lineNumber}`;
}

export async function POST(request: Request) {
  const userAgent = getRandomUserAgent();
  console.log('Using user agent:', userAgent);
  const browser = await chromium.launch(
    {
      headless: false,
      // proxy: { server: proxy },
    }); // Change to true for production
  const context = await browser.newContext({ userAgent: userAgent, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
    

  try {
    // Go to OpenTable
    await page.goto('https://www.opentable.com/');
    const body = await request.json();
    console.log('Request body:', body);
    const restaurantName = body.restaurantName;
    // const reservationTimes = body.reservationTimes;
    const reservationTime = body.reservationTime;
    const date = body.reservationDate;
    
    await page.pause();
    // sign in
    const phoneNumber = randPhonenumber();
    const uniqueId = uuidv4();
    await page.locator('[data-test="header-sign-in-button"]').click();
    const headerSignInModal = page.locator('iframe[title="Sign in"]').contentFrame();
    const signInEmailInputButton = headerSignInModal.locator('[data-test="continue-with-email-button"]');
    await signInEmailInputButton.click();
    
    await headerSignInModal.getByRole('textbox', { name: 'Email' }).fill(`reserve+${uniqueId}@parse.opheliadating.com`);
    await headerSignInModal.getByRole('button', { name: 'Continue' }).click();
    await tryVerificationCode(uniqueId, page);
    
    await headerSignInModal.getByRole('textbox', { name: 'First name' }).fill('Ophelia');
    await headerSignInModal.getByRole('textbox', { name: 'Last name' }).fill('Dating');
    const phoneNumberInput = headerSignInModal.getByRole('textbox', { name: 'Phone number' });
    console.log('phoneNumber', phoneNumber);
    for (const digit of phoneNumber) {
      await phoneNumberInput.press(digit);
    }
    await headerSignInModal.getByRole('button', { name: 'Continue' }).click();
    
    await headerSignInModal.getByText('I am an administrative').click();
    await headerSignInModal.getByRole('button').getByText('Create an account').click();
    await page.waitForTimeout(5000);
    
    await page.waitForLoadState('networkidle');
    // await page.pause();
    await page.goto('https://www.opentable.com/');

    // select date
    const dateSelector = page.getByTestId('day-picker-overlay');
    console.log(dateSelector);
    await dateSelector.click();
    const calendar = page.locator('#search-autocomplete-day-picker-wrapper');
    await calendar.waitFor({ state: 'visible' });
    // await calendar.highlight();
    const dateButton = calendar.locator(`button[aria-label*="${date}"]`).nth(0);
    await dateButton.click();

    // select time
    const timeSelector = page.getByLabel('Time Selector');
    await timeSelector.selectOption(reservationTime);

    // Search for a restaurant
    const searchInput = page.getByLabel('Please input a Location, Restaurant or Cuisine');
    await searchInput.fill(`"${restaurantName}" Boston`);
    await page.keyboard.press('Enter');
    
    // Click the first restaurant from the search results
    const restaurantLink = page.getByTestId('restaurant-cards').getByRole('link').first();
    const [reservationPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await restaurantLink.click()
    ]);

    await reservationPage.waitForLoadState();
    const reservationLink = reservationPage.getByRole('link', { name: reservationTime });
    await reservationLink.click();

    const seatingOptionDefault = reservationPage.locator('button[data-test="seatingOption-default-button"]');
    await reservationPage.waitForTimeout(1000);
    if (await seatingOptionDefault.count() > 0) {
      await seatingOptionDefault.click();
    }
    // for(let i = 0; i < reservationTimes.length; i++) {
    //   const time = reservationTimes[i];
    //   try {
    //     const reservationLink = reservationPage.getByRole('link', { name: time });
    //     await reservationLink.click();
    //     break;
    //   }
    //   catch (error) {
    //     console.error(`Error selecting reservation time at ${time}:`, error);
    //   }
    // }

    // reservationPage.pause();
    
    // await reservationPage.waitForLoadState();
    // const emailInputButton = reservationPage.locator('button[data-test="continue-with-phone-button"]');
    // await emailInputButton.click();
    
    // const uniqueId = uuidv4();
    // await reservationPage.getByRole('textbox', { name: 'Email' }).fill(`reserve+${uniqueId}@parse.opheliadating.com`);
    
    // await reservationPage.getByText('Sign me up to receive dining').uncheck();
    
    // const completeReservationButton = reservationPage.locator('button[aria-label="Complete reservation"]');
    // await completeReservationButton.click();
    
    // await reservationPage.pause();
    
    // await tryVerificationCode(uniqueId, reservationPage);
    
    // const signInModal = reservationPage.locator('iframe[title="Sign in"]').contentFrame();
    // await signInModal.getByRole('textbox', { name: 'First name' }).fill('Ophelia');
    // await signInModal.getByRole('textbox', { name: 'Last name' }).fill('Dating');
    // const phoneNumber = randPhonenumber();
    // console.log('phoneNumber', phoneNumber);
    // const phoneNumberInput = signInModal.getByRole('textbox', { name: 'Phone number' });
    // for (const digit of phoneNumber) {
    //   await phoneNumberInput.press(digit);
    // }
    // await reservationPage.pause();
    // await signInModal.getByRole('button', { name: 'Complete reservation' }).click();
    
    
    // await reservationPage.waitForLoadState();
    
    // const passwordInput = reservationPage.locator('[data-test="password"]');
    // for (const char of uniqueId) {
    //   await passwordInput.press(char);
    // }
    // await passwordInput.fill(uniqueId);
    
    // await reservationPage.getByText('I am an administrative').check();
    // await reservationPage.locator('[data-test="submit-button"]').click();
    // await reservationPage.locator('[data-test="submit-button"]').click();
    // await reservationPage.locator('[data-test="submit-button"]').click();
    // await reservationPage.locator('[data-test="submit-button"]').click();
    // await reservationPage.locator('[data-test="submit-button"]').click();
    // await reservationPage.locator('[data-test="submit-button"]').click();
    // await reservationPage.waitForTimeout(3000);

    // await reservationPage.locator('[data-test="modal-close"]').click();
    
    // await reservationPage.reload();
    
    // await reservationPage.locator('[data-test="modal-close"]').click();
    

    // // sign in again
    // await reservationPage.locator('[data-test="header-sign-in-button"]').click();
    // const headerSignInModal = reservationPage.locator('iframe[title="Sign in"]').contentFrame();
    // const signInEmailInputButton = headerSignInModal.locator('[data-test="continue-with-email-button"]');
    // await signInEmailInputButton.click();
    
    // await headerSignInModal.getByRole('textbox', { name: 'Email' }).fill(`reserve+${uniqueId}@parse.opheliadating.com`);
    // await headerSignInModal.getByRole('button', { name: 'Continue' }).click();
    // await tryVerificationCode(uniqueId, reservationPage);
    
    // await headerSignInModal.getByRole('textbox', { name: 'First name' }).fill('Ophelia');
    // await headerSignInModal.getByRole('textbox', { name: 'Last name' }).fill('Dating');
    // console.log('phoneNumber', phoneNumber);
    // for (const digit of phoneNumber) {
    //   await phoneNumberInput.press(digit);
    // }
    // await headerSignInModal.getByRole('button', { name: 'Continue' }).click();
    
    // await reservationPage.pause();
    // await headerSignInModal.getByText('I am an administrative').click();
    // await headerSignInModal.getByRole('button').getByText('Create an account').click();
    // await headerSignInModal.getByRole('button').getByText('Create an account').click();
    // await headerSignInModal.getByRole('button').getByText('Create an account').click();
    // await headerSignInModal.getByRole('button').getByText('Create an account').click();
    // await headerSignInModal.getByRole('button').getByText('Create an account').click();
    // await headerSignInModal.getByRole('button').getByText('Create an account').click();
    // await reservationPage.waitForTimeout(10000);
    // await reservationPage.reload();

    // confirm reservation
    await reservationPage.getByText('Sign me up to receive dining').uncheck();
    await reservationPage.waitForTimeout(4000);
    await reservationPage.getByRole('button', { name: 'Complete reservation' }).click();
    
    const inviteButton = reservationPage.locator('button[data-test="invite-your-friends"]');
    await inviteButton.waitFor({ state: 'visible' });
    await inviteButton.click();
    // await reservationPage.pause();
    const inviteModal = reservationPage.locator('div[data-testid="invite-guest-modal"]');
    await inviteModal.waitFor({ state: 'visible' });
    const shareableLinkButton = inviteModal.locator('button[data-test="shareable-link-button"]');
    await shareableLinkButton.click();
    const copiedLink = await page.evaluate('navigator.clipboard.readText()');
    console.log('copiedLink: ', copiedLink);

    console.log('Reservation attempt completed.');
    await reservationPage.pause();

    await browser.close();

    return NextResponse.json({ success: true, message: 'Reservation attempt completed.', url: copiedLink }, { status: 200 });
  } catch (error) {
    console.error('Error during automation:', error);
    await browser.close();

    return NextResponse.json({ success: false, message: 'Could not book a reservation.' }, { status: 500 });
  }
}


const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.159 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.200 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.70 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]