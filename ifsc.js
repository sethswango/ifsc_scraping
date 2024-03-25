const puppeteer = require('puppeteer');

var IFSCpage = 'https://www.ifsc-climbing.org/events/ifsc-asian-qualifier-jakarta-2023'

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function scrapeAndLogPostRequests() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('response', async response => {
        const url = response.request().url();
        if (response.request().method() === 'POST' && url.includes('result/index')) {
            // Determine the category and discipline from the URL
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const discipline = urlParams.get('discipline');
            const category = urlParams.get('category');
            const categoryName = category === 'men' ? 'Men' : 'Women';

            // Exclude speed climbing results
            if (discipline !== 'speed') {
                console.log(`POST request URL: ${url}`);
                try {
                    const textResponse = await response.text();
                    const parsedResponse = textResponse.substring(textResponse.indexOf("1:") + 2);
                    const jsonResponse = JSON.parse(parsedResponse);
                    if (jsonResponse.data && jsonResponse.data.ranking) {
                        // Preface each output with the category and discipline
                        jsonResponse.data.ranking.forEach(athlete => {
                            console.log(`${categoryName} ${discipline.charAt(0).toUpperCase() + discipline.slice(1)} - Rank: ${athlete.rank}, Name: ${athlete.firstname} ${athlete.lastname}, Athlete ID: ${athlete.athlete_id}`);
                        });
                    }
                } catch (error) {
                    console.error('Error processing the response:', error);
                }
            }
        }
    });

    await page.goto(IFSCpage, { waitUntil: 'networkidle2' });

    await page.evaluate(() => {
        const resultsButton = Array.from(document.querySelectorAll('.d3-secondary-nav__menu a'))
            .find(el => el.textContent.trim().toLowerCase().includes('results'));
        if (resultsButton) resultsButton.click();
    });

    await delay(1500);

    await page.evaluate(() => {
        const boulderLeadButton = Array.from(document.querySelectorAll('.d3-section__content a'))
            .find(el => el.textContent.trim().toLowerCase().includes('boulder & lead'));
        if (boulderLeadButton) boulderLeadButton.click();
    });

    await delay(1500); // Allow dynamic content to load


    await page.click('select[aria-label="category-select-label"]');
    await delay(500); // Wait a brief moment
    await page.keyboard.press('ArrowDown'); // Move to the "Women" option
    await delay(500); // Allow selection to register
    await page.keyboard.press('Enter');

    await delay(1000); // Wait for the change to take effect
    // Further actions or scraping can be performed here

    // Uncomment the next line if you want the browser to stay open for inspection
    // await browser.close();
}

scrapeAndLogPostRequests();
