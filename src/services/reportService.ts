import puppeteer from "puppeteer";
import { reportTemplate } from "../utils/templates/reportsTemplate";

export async function generateReportPDF(report: any) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage", 
            ],
        });

        const page = await browser.newPage();
        const html = reportTemplate(report);

        await page.setContent(html, {
            waitUntil: "load", 
            timeout: 20000     
        });

        const pdf = await page.pdf({ 
            format: "A4", 
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } 
        });

        return pdf;

    } catch (error) {
        console.error("Erro na geração do PDF SafeTemp:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};