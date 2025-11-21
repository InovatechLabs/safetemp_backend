import puppeteer from "puppeteer";
import { reportTemplate } from "../utils/templates/reportsTemplate";

export async function generateReportPDF(report: any) {

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage", 
            "--single-process", 
            "--no-zygote",
        ],
    });

    try {
        const page = await browser.newPage();
        const html = reportTemplate(report);

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true
        });

        return pdf;

    } catch (error) {
        console.error("Erro no Puppeteer:", error);
        throw error;
    } finally {
        if (browser) await browser.close(); 
    }
}