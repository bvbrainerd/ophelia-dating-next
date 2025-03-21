import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export async function GET(request: Request) {
  const userAgent = getRandomUserAgent();
  console.log('Using user agent:', userAgent);
  const browser = await chromium.launch(
    {
      headless: false,
      // proxy: { server: proxy },
    }); // Change to true for production
  const context = await browser.newContext({ userAgent: userAgent });
  const page = await context.newPage();
    

  try {
    // Go to OpenTable
    await page.goto('https://www.opentable.com/');
    // const body = await request.json();
    // console.log('Request body:', body);
    // const restaurantName = body.restaurantName;
    // const reservationTimes = body.reservationTimes;
    // const date = body.date;

    // select date
    const date = 'Monday, March 24';
    const dateSelector = await page.getByTestId('day-picker-overlay');
    console.log(dateSelector);
    dateSelector.click();
    const calendar = await page.locator('#search-autocomplete-day-picker-wrapper');
    calendar.waitFor();
    await calendar.highlight();
    const dateButton = await calendar.locator(`button[aria-label="${date}"]`);
    dateButton.highlight();
    page.pause();
    await dateButton.click();

    // select time
    const reservationTime = '6:30 PM';
    const timeSelector = await page.getByLabel('Time Selector');
    timeSelector.selectOption(reservationTime);

    // Search for a restaurant
    const searchInput = await page.getByLabel('Please input a Location, Restaurant or Cuisine');
    searchInput.highlight();
    searchInput.fill('Happy Lamb Hot Pot Boston');
    await page.waitForTimeout(5000);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); // Adjust if necessary
    
    // Click the first restaurant from the search results
    const restaurantLink = await page.getByTestId('restaurant-cards').getByRole('link').first();
    const [reservationPage] = await Promise.all([
      page.context().waitForEvent('page'),
      restaurantLink.click(),
    ]);

    await reservationPage.waitForLoadState();
    console.log('Page URL:', reservationPage.url());
    await reservationPage.waitForTimeout(2000);




    // set the time

    const reservationLink = await reservationPage.getByRole('link', { name: reservationTime });
    await reservationLink.click();

    await reservationPage.waitForTimeout(10000);

    // TODO: Enter user details and complete reservation

    console.log('Reservation attempt completed.');

    return NextResponse.json({ success: true, message: 'Reservation attempt completed.', url: reservationPage.url() });
  } catch (error) {
    console.error('Error during automation:', error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  } finally {
    await browser.close();
  }
}


export async function POST(request: Request) {
  const userAgent = getRandomUserAgent();
  console.log('Using user agent:', userAgent);
  const browser = await chromium.launch(
    {
      headless: false,
      // proxy: { server: proxy },
    }); // Change to true for production
  const context = await browser.newContext({ userAgent: userAgent });
  const page = await context.newPage();
    

  try {
    // Go to OpenTable
    await page.goto('https://www.opentable.com/');
    const body = await request.json();
    console.log('Request body:', body);
    const restaurantName = body.restaurantName;
    // const reservationTimes = body.reservationTimes;
    const reservationTime = body.reservationTime;
    const date = body.date;

    // select date
    const dateSelector = await page.getByTestId('day-picker-overlay');
    console.log(dateSelector);
    dateSelector.click();
    const calendar = await page.locator('#search-autocomplete-day-picker-wrapper');
    calendar.waitFor();
    await calendar.highlight();
    const dateButton = await calendar.locator(`button[aria-label="${date}"]`);
    dateButton.highlight();
    page.pause();
    await dateButton.click();

    // select time
    const timeSelector = await page.getByLabel('Time Selector');
    timeSelector.selectOption(reservationTime);

    // Search for a restaurant
    const searchInput = await page.getByLabel('Please input a Location, Restaurant or Cuisine');
    searchInput.highlight();
    searchInput.fill(restaurantName);
    await page.waitForTimeout(5000);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); // Adjust if necessary
    
    // Click the first restaurant from the search results
    const restaurantLink = await page.getByTestId('restaurant-cards').getByRole('link').first();
    const [reservationPage] = await Promise.all([
      page.context().waitForEvent('page'),
      restaurantLink.click(),
    ]);

    await reservationPage.waitForLoadState();
    console.log('Page URL:', reservationPage.url());
    await reservationPage.waitForTimeout(2000);

    // select a reservation time
    const reservationLink = await reservationPage.getByRole('link', { name: reservationTime });
    await reservationLink.click();

    await reservationPage.waitForTimeout(10000);

    console.log('Reservation attempt completed.');

    return NextResponse.json({ success: true, message: 'Reservation attempt completed.', url: reservationPage.url() });
  } catch (error) {
    console.error('Error during automation:', error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  } finally {
    await browser.close();
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