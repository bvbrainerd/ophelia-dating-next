// lib/reservationCrawler.ts
import { chromium, Browser, Page } from 'playwright'; // Need to install playwright and add it to dependencies

export async function bookReservation(
    restaurantQuery: string,
    reservationTime: string
) : Promise<{ confirmationUrl: string }> {
    let browser: Browser | null = null;
    try {
        // Launch browser in headless mode for production
        browser = await chromium.launch({ headless: true });
        const page: Page = await browser.newPage();

        // Go to OpenTable
        await page.goto("https://www.opentable.com");

        // Fill in the restaurant search field
        await page.fill('input[aria-label="Find a Table, Location, Restaurant or Cuisine"]', restaurantQuery);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000); // Wait for search results to load

        // Click on the first restaurant card from the results
        const restaurantLink = page.locator('restaurant-card').getByRole('link').first();
        const [reservationPage] = await Promise.all([
            restaurantLink.click(),
            page.waitForEvent('page')
        ]);

        // Wait for the reservation page to load
        await reservationPage.waitForLoadState();
        await reservationPage.waitForTimeout(2000); // Additional wait for full load

        // Select the desired date and time
        await reservationPage.fill('input[aria-label="Select a date"]', reservationTime);
        await reservationPage.click('button[aria-label="Select a time"]');

        // Click the reservation time (ensure the text exactly matches the button)
        await reservationPage.click(`text="${reservationTime}"`);
        await reservationPage.waitForTimeout(10000); // Wait for the reservation flow to complete

        // Capture some detail from the reservation page (e.g. the URL as a placeholder)
        const confirmationUrl = reservationPage.url();
        return { confirmationUrl };

    } catch (error) {
        console.error('Error in bookReservation:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
        

    }
}