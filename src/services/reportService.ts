import puppeteer, { Browser } from "puppeteer";
import { reportTemplate } from "../utils/templates/reportsTemplate";

let globalBrowser: Browser | null = null;

const getBrowser = async (): Promise<Browser> => {
    if (!globalBrowser || !globalBrowser.connected) {
        console.log("[Puppeteer] A iniciar nova instância global do Chromium...");
        globalBrowser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        });
    }
    return globalBrowser;
};

export async function generateReportPDF(report: any) {
    let page = null;
    try {
        const browser = await getBrowser();
        
        page = await browser.newPage();
        
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
        if (page) await page.close();
    }
}