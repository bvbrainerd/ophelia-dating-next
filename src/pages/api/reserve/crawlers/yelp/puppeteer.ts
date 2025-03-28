// pages/api/reserve/crawlers/yelp/puppeteer.ts

import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth'; // ⛑ Helps disguise the browser as a real human session
import { createCursor } from 'ghost-cursor'; // 👻 Simulates natural human-like mouse movements

// 🧙 Enable stealth mode to avoid bot detection (spoofs WebGL, languages, etc.)
puppeteer.use(StealthPlugin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔒 Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 🔧 Extract user input and define hardcoded selections
  const { restaurantName } = req.body;
  const desiredDate = "Thu Mar 27, 2025";
  const desiredTime = "6:30 pm";
  const desiredCovers = "2 people";

  // 🧪 Launch browser in non-headless mode (for debug) and disable sandbox (needed on some environments)
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // 👤 Create a ghost cursor instance for realistic interactions
  const cursor = createCursor(page);

  try {
    // ----------------------------------------------------------------------
    // Step 1: Search for the Restaurant on Yelp
    // ----------------------------------------------------------------------

    // 🧭 Navigate to Yelp and wait for minimal DOM readiness
    await page.goto('https://www.yelp.com/', { waitUntil: 'domcontentloaded' });

    // 🧼 Wait for the search form to be visible
    await page.waitForSelector('form#header_find_form');

    // 🔎 Type the restaurant name slowly to mimic human input
    const restaurantInput = await page.$('input[name="find_desc"]');
    await restaurantInput?.click();
    await page.keyboard.type(restaurantName, { delay: 100 });

    // 🖱️ Use ghost cursor to click the search button
    const searchButton = await page.$('form#header_find_form button[aria-label="Search"]');
    if (searchButton) await cursor.click(searchButton);

    // 📡 Wait until the network is idle to confirm search results loaded
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 📋 Find all h3s and match the one that includes the restaurant name
    const restaurantHandles = await page.$$('h3');
    let restaurantLink = null;
    for (const handle of restaurantHandles) {
      const text = await handle.evaluate(el => el.textContent?.trim());
      if (text?.includes(restaurantName)) {
        restaurantLink = await handle.$('a'); // 🎯 Extract the <a> from that matching h3
        break;
      }
    }

    if (!restaurantLink) throw new Error("Could not find restaurant in results");

    // 👆 Click on the matching restaurant's link
    await cursor.click(restaurantLink);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // ----------------------------------------------------------------------
    // Step 2: Select Reservation Date
    // ----------------------------------------------------------------------

    // 📅 Click the date input to open the date picker
    const dateInput = await page.$('input[aria-label="Select a date"]');
    if (dateInput) await cursor.click(dateInput);

    // 🕵️ Wait for and select the desired date
    await page.waitForSelector(`div[aria-label="${desiredDate}"]`, { timeout: 5000 });
    const dateButton = await page.$(`div[aria-label="${desiredDate}"]`);
    if (dateButton) await cursor.click(dateButton);

    // ----------------------------------------------------------------------
    // Step 3: Select Reservation Time
    // ----------------------------------------------------------------------

    // ⏰ Click to open the time dropdown
    const timeDropdown = await page.$('div.select-wrapper__09f24__sMbIC');
    if (timeDropdown) await cursor.click(timeDropdown);

    // ⌛ Wait for time options and select the correct one or fallback to first
    await page.waitForSelector('button[data-testid="menu-item-tag"]');
    const timeButtons = await page.$$('button[data-testid="menu-item-tag"]');
    let foundTime = false;
    for (const button of timeButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text?.trim() === desiredTime) {
        await cursor.click(button);
        foundTime = true;
        break;
      }
    }
    if (!foundTime && timeButtons.length > 0) await cursor.click(timeButtons[0]);

    // ----------------------------------------------------------------------
    // Step 4: Select Covers (People Count)
    // ----------------------------------------------------------------------

    // 🙋 Open the people count dropdown
    const coversDropdown = await page.$('div.select-wrapper--with-menu__09f24__LOIsl');
    if (coversDropdown) await cursor.click(coversDropdown);

    // 👥 Select the desired number of people
    await page.waitForSelector('button[data-testid="menu-item-tag"]');
    const coversButtons = await page.$$('button[data-testid="menu-item-tag"]');
    for (const button of coversButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text?.trim() === desiredCovers) {
        await cursor.click(button);
        break;
      }
    }

    // ----------------------------------------------------------------------
    // Step 5: Click "Find a Table"
    // ----------------------------------------------------------------------

    // 🪑 Proceed to view reservation slots
    const findTableLink = await page.$('a:has-text("Find a Table")');
    if (findTableLink) await cursor.click(findTableLink);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // ----------------------------------------------------------------------
    // Step 6: Select Available Reservation Slot
    // ----------------------------------------------------------------------

    // 🟢 Select available time (or fallback)
    await page.waitForSelector('div.y-css-m8zazt');
    const availableButtons = await page.$$('div.y-css-m8zazt button');
    let confirmedTime = false;
    for (const btn of availableButtons) {
      const text = await btn.evaluate(el => el.textContent);
      if (text?.trim() === desiredTime) {
        await cursor.click(btn);
        confirmedTime = true;
        break;
      }
    }
    if (!confirmedTime && availableButtons.length > 0) await cursor.click(availableButtons[0]);

    // 🎉 Final confirmation page reached
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    return res.status(200).json({
      success: true,
      message: 'Yelp reservation flow completed successfully.',
      url: page.url(),
    });

  } catch (error: any) {
    console.error('Error during Yelp automation:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await browser.close(); // 🧹 Always close the browser to free resources
  }
}

