import puppeteer from "puppeteer";
import { reportTemplate } from "../utils/templates/reportsTemplate";

export async function generateReportPDF(report: any) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const html = reportTemplate(report);

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
        format: "A4",
        printBackground: true
    });

    await browser.close();

    return pdf;
}