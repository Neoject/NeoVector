import fs from "fs";
import path from "path";

export function writeLog(label: string, value: unknown) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const date = `[${hours}.${minutes}]${day}.${month} `;
    const line = `[${new Date().toISOString()}] ${label}: ${JSON.stringify(value)}\n`;
    fs.appendFileSync(path.join(process.cwd(), date + '.log'), line);
}