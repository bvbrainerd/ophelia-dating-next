import { chromium } from 'playwright';
import { NextResponse } from 'next/server';

interface Slot {
  timeOffsetMinutes?: number;
  isAvailable: boolean;
}

function monthToNumber(month: string): number {
  switch (month) {
    case 'January':
      return 1;
    case 'February':
      return 2;
    case 'March':
      return 3;
    case 'April':
      return 4;
    case 'May':
      return 5;
    case 'June':
      return 6;
    case 'July':
      return 7;
    case 'August':
      return 8;
    case 'September':
      return 9;
    case 'October':
      return 10;
    case 'November':
      return 11;
    case 'December':
      return 12;
    default:
      return 0;
  }
}

function getMonthDay(date: string): [number, number] {
  const dateParts = date.split(' ');
  const month = dateParts[0];
  return [monthToNumber(month), parseInt(dateParts[1])];
}

function convertTo24HourNumber(timeStr: string): number {
  // Create a new Date object using the time string
  const date = new Date("1970-01-01 " + timeStr);
  
  // Get the hours and minutes in 24-hour format
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // Combine hours and minutes into a single number
  return parseInt(hours + minutes);
}

function convertToDateString(time: number): string {
  // Extract hours and minutes from the input time number
  let hours = Math.floor(time / 100);
  const minutes = time % 100;

  // Determine AM/PM period
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  hours = hours % 12 || 12;

  // Format minutes to always be two digits
  const minutesStr = minutes.toString().padStart(2, '0');

  // Combine hours, minutes, and period into the final string
  return `${hours}:${minutesStr} ${period}`;
}

function calculateOffset(timeNum: number, offset: number): number | null {
  // Extract hours and minutes from the input time number
  const hours = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;

  // Convert to minutes since midnight
  let totalMinutes = hours * 60 + minutes;

  // Add or subtract the offset in minutes
  if (totalMinutes + offset < 0) {
    return null;
  }
  const newTotalMinutes = (totalMinutes + offset) % (24 * 60);

  // Calculate new hours and minutes
  const newHours = Math.floor(newTotalMinutes / 60) % 24;
  const newMinutes = newTotalMinutes % 60;

  // Combine the new hours and minutes into a number in hhmm format
  return newHours * 100 + newMinutes;
}

export async function GET(request: Request) {
  const availableTimes: number[] = [];
  const responsePromises: Promise<void>[] = [];
  // const requestData = await request.json();
  // const requestDate = requestData.date;
  // const requestRestaurantURL = requestData.restaurantURL;

  try {

    const browser = await chromium.launch({ headless: false, });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1024 },
      timezoneId: 'America/New_York',
    });
    const page = await context.newPage();
    await page.goto('https://www.opentable.com/r/joes-on-newbury-boston');
    const dateVar = "April 3";
    const [month, day] = getMonthDay(dateVar);
    const scraped = new Map();
    // await page.pause();
    // select date
    const dateSelector = page.locator('div[aria-label="Date selector"]').nth(1);
    await dateSelector.click();
    const calendar = page.locator('table[aria-labelledby="react-day-picker-2"]');
    await calendar.waitFor({ state: 'visible' });

    const calendarHeader = page.locator('div[id="react-day-picker-2"]');
    let calendarTitle = await calendarHeader.textContent();
    let monthYear = calendarTitle!.split(' ');
    console.log("monthYear: ", monthYear);
    let monthNum = monthToNumber(monthYear[0]);
    let year = parseInt(monthYear[1]);

    while (monthNum > month) {
      console.log(monthNum, month);
      const prevButton = page.locator('button[aria-label="Previous month"]').nth(1);
      await prevButton.click();
      calendarTitle = await calendarHeader.textContent();
      monthYear = calendarTitle!.split(' ');
      monthNum = monthToNumber(monthYear[0]);
      console.log('month year: ', calendarTitle)
    }
    while (monthNum < month) {
      console.log(monthNum, month);
      const nextButton = page.locator('button[aria-label="Next month"]').nth(1);
      await nextButton.click();
      calendarTitle = await calendarHeader.textContent();
      monthYear = calendarTitle!.split(' ');
      monthNum = monthToNumber(monthYear[0]);
      console.log('month year: ', calendarTitle)
    }
    


    // Select the day
    await calendar.waitFor({ state: 'visible' });
    const dateButton = calendar.locator(`button[aria-label*="${dateVar}"]`).nth(0);

    // const dateButton = await calendar.locator(`button[aria-label="${dateVar}"]`);
    await dateButton.click();
  
    const date = await page.locator('div[id="restaurantProfileDtpDayPicker-label"]').nth(0).textContent();
    const timePicker = page.locator('select[id="restaurantProfiletimePickerDtpPicker"]').nth(1);
    // console.log('📅 Selected Date:', date);
    const times = await timePicker.locator('option').evaluateAll((options) => options.map((option) => option.textContent));
    // console.log('🕒 Available Times:', times);
    // await page.pause();
    await page.waitForLoadState('networkidle');
    
    let count = 0;
    console.log("times.length: ", times.length);
    console.log("times: ", times);
    
    // Intercept responses
    page.on('response', async (response) => {
      const url = response.url();
      // Identify the time slot availability request
      if (url.includes('opname=RestaurantsAvailability')) {
        const request = response.request();
        const postData = await request.postDataJSON();
        const requestTime = postData.variables.time;
        console.log(`Request Time: ${postData.variables.time}`);
        const requestHourMin = requestTime.split(':');
        const time = parseInt(requestHourMin[0]) * 100 + parseInt(requestHourMin[1]);
        console.log(`Time: ${time} || times[count]: ${times[count]}`);
        if (scraped.has(requestTime) || time != convertTo24HourNumber(times[count]!)) {
          console.log('Duplicate request:', time);
          if (time > convertTo24HourNumber(times[count]!)) {
            console.log('Time is greater than current time');
            count++;
          }
          if (count < times.length) {
            await timePicker.waitFor({ state: 'attached', timeout: 100});
            await timePicker.selectOption(times[count]);
            console.log("time clicked: ", times[count]);
          }
          return;
        }
        scraped.set(requestTime, true);
        const responsePromise = (async () => {
          console.log('🕒 Selected Time:', time);
          
          try {
            // Get JSON response data
            
            const json = await response.json();
            // console.log('Response data:', json);
            console.log(`AvailabilityDays.length: ${Object.keys(json.data?.availability?.[0]?.availabilityDays).length}`);
            const slots = json.data?.availability?.[0]?.availabilityDays?.[0]?.slots;
            // console.log('response.availability', slots);
            if (!slots) {
              console.log('No slots found within 2.5 hours of ', time);
            }
            else {
              const availability = slots.map((slot: Slot) => {
                if (slot.isAvailable === true) {
                  // console.log(`time${time} + offset${slot.timeOffsetMinutes}: `, calculateOffset(time, slot.timeOffsetMinutes!));
                  const slotTime = calculateOffset(time, slot.timeOffsetMinutes!);
                  return slotTime ? slotTime : null;
                }
                else
                  return null;
              });
              // console.log("Available (request): ", availability);

              for (let i = 0; i < availability.length; i++) {
                if (availability[i] === null) {
                  console.log('null time: skipped');
                  continue;
                }
                if (!availableTimes.includes(availability[i])) {

                  availableTimes.push(availability[i]);
                  console.log('🟢 Available Time:', convertToDateString(availability[i]));
                }
                else {
                  console.log('🔴 Duplicate Time:', convertToDateString(availability[i]));
                }
              }
            }
          } catch (err) {
            console.error('Error parsing response:', err);
          } finally {
            count++;
            if (count < times.length) {
              await timePicker.waitFor({ state: 'attached', timeout: 100});
              await timePicker.selectOption(times[count]);
              console.log("time clicked: ", times[count]);
            }
          }
        })();
        responsePromises.push(responsePromise);
      }
    });
    let timeWaited = 0;
    await timePicker.selectOption(times[0]);
    while(count < times.length) {
      // console.log("waiting for responses");
      await page.waitForTimeout(500);
      timeWaited += 500;
      if (timeWaited > 20000) {
        console.log("timed out");
        break;
      }
    }
    await Promise.all(responsePromises);
    // await page.pause();
    await browser.close();
    const sortedTimes = availableTimes.sort();
    console.log('Sorted TIMES ARRAY: ', sortedTimes);
    const formattedTimes = sortedTimes.map((time) => convertToDateString(time));
    console.log('FORMATTED TIMES ARRAY: ', formattedTimes);
    return NextResponse.json({ success: true, date: dateVar, availableTimes: formattedTimes });

  } catch (error) {
    return NextResponse.json({ success: false, availableTimes: [] });
  }
}