import { chromium } from 'playwright';
import { expect } from 'chai';
import { aboutValveUrl, basePageUrl, downloadsPath, testData, uploadedMssg } from '../constants.js';
import fs from 'fs';
import path from 'path';

describe("Steam Store test", function () {
    let browser;
    let page;
    let context;

    this.timeout(45000);

    before(async () => {

        if (fs.existsSync(downloadsPath)) {
            fs.rmSync(downloadsPath, {recursive:true, force:true});
        }
        fs.mkdirSync(downloadsPath, {recursive:true});

        browser = await chromium.launch({headless: false});

        context = await browser.newContext({
            acceptDownloads:true,
            downloadsPath: downloadsPath
        });

        page = await context.newPage();
        await page.goto(basePageUrl);
        await page.waitForLoadState('domcontentloaded');
    });

    after(async () => {
        await browser.close();
        if (fs.existsSync(downloadsPath)) {
            fs.rmSync(downloadsPath, {recursive:true, force:true});
        }
    });

    it('Steam Logo is visible', async () => {
        const steamLogo = await page.locator("//img[@alt='Link to the Steam Homepage']");
        
        await steamLogo.waitFor({state: 'visible'});
        const logoIsVisible = await steamLogo.isVisible();
        expect(logoIsVisible, "Steam logo is not displayed in main page").to.be.true;

    });

    it("Verify navigation to another window", async () => {
        const btnaAboutValve = await page.getByRole("link", {name:'About Valve'});
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page', {timeout: 10000}),
            btnaAboutValve.click()
        ]);
        await newPage.waitForLoadState('load');
        const newPageUrl = newPage.url();
        expect(newPageUrl, `new page url does not match.expected: ${aboutValveUrl}, obtained: ${newPageUrl}`).to.include(aboutValveUrl);
        await newPage.close();

        const currentPageUrl = page.url();
        expect(currentPageUrl, `Error returning to steam main page, this is the actual url ${currentPageUrl}`).to.include(basePageUrl);
    });

    it.only("Download steam installer and verify downloaded file", async () => {
        const btnInstallSteamInHeader = await page.locator("//a[contains(@class,'header_installsteam_btn')]");
        const btnInstallProgram = await page.locator("//a[@class='about_install_steam_link']").first();
        const lblGamerStats = await page.locator("//div[@class='online_stats']");

        await btnInstallSteamInHeader.click();
        await page.waitForLoadState('load');
        await lblGamerStats.waitFor({state: 'visible'});
        expect(await lblGamerStats.isVisible(), "Gamer stats not displayed, download page is not open").to.be.true;
        
        const [download] = await Promise.all([
            page.waitForEvent('download', {timeout: 30000}),
            btnInstallProgram.click()
        ]);

        await download.path();
        const fileName = download.suggestedFilename();
        const finalFilePath = path.join(downloadsPath, fileName);
        await download.saveAs(finalFilePath);

        expect(fs.existsSync(finalFilePath), `File downloaded '${fileName}' wasn't found`).to.be.true;
    });

    testData.forEach(({a, b, expected}) => {
        it(`Should return ${expected} for ${a} + ${b}`, function () {
            const result = a+b;
            expect(result).to.equal(expected);
        });
    });

    it("Uploads a file from a directory", async () => {
        await page.goto("https://practice-automation.com/file-upload/");
        const btnChooseFile = await page.locator("//input[@id='file-upload']");
        const btnUpload = await page.locator("//input[@id='upload-btn']");
        const lblUploadedMssg = await page.locator("//div[@class='wpcf7-response-output']");
        const fileName = 'document.txt';
        const fullPathToFile = path.resolve(`./uploads/${fileName}`);

        await btnChooseFile.setInputFiles(fullPathToFile);
        await btnUpload.click();
        await lblUploadedMssg.waitFor({state: 'visible'});

        const fileUploadedMssg = await lblUploadedMssg.textContent();

        expect(fileUploadedMssg, "Message not present, error to upload file").to.equal(uploadedMssg);
    });
});