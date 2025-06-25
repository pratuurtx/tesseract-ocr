import { createWorker, PSM } from "tesseract.js";
import { ExtractThaiIdDataReqDTO, ExtractThaiIdDataResDTO } from "../models";
import { preprocessImage } from "../util";

export async function extractThaiIdByTesseractJs(body: ExtractThaiIdDataReqDTO): Promise<any> {
    const { base64ImageStr } = body;

    const buffer = await preprocessImage(base64ImageStr);

    const oem = (() => {
        if (body.oem && typeof body.oem === "number" && (body.oem >= 0 && body.oem <= 3)) {
            return body.oem;
        } else return 1;
    })();

    const psm = (() => {
        if (body.psm && typeof body.psm === "number" && (body.psm >= 0 && body.psm <= 13)) {
            return body.psm;
        } else return 3;
    })();

    const lang = (() => {
        if (body.lang && typeof body.lang === "string" && (body.lang === "tha" || body.lang === "eng" || body.lang === "tha+eng")) {
            return body.lang
        } else return "tha+eng";
    })();

    const dpi = (() => {
        if (body.lang && typeof body.dpi === "number" && body.dpi === 300) {
            return 300;
        } else return undefined;
    })();

    const worker = await createWorker(lang, oem,);

    const psmEnumValue = PSM[Object.keys(PSM).find(key => PSM[key as keyof typeof PSM] === psm.toString()) as keyof typeof PSM];
    await worker.setParameters({
        tessedit_pageseg_mode: psmEnumValue,
        user_defined_dpi: dpi?.toString(),
    });

    const { data: { text } } = await worker.recognize(buffer);

    console.log("OCR Result", text);

    const { prefixTh, nameTh, lastNameTh, prefixEn, nameEn, lastNameEn } = extractNameInfo(text);

    const extractData: ExtractThaiIdDataResDTO = {
        idCardNo: extractThaiIdNumberFromOCR(text),
        prefixTh: prefixTh,
        nameTh: nameTh,
        lastNameTh: lastNameTh,
        prefixEn: prefixEn,
        nameEn: nameEn,
        lastNameEn: lastNameEn,
        dob: extractDob(text),
        dateOfExpiry: null,
    }
    return extractData;
}


function extractThaiIdNumberFromOCR(ocrText: string): string | null {
    const lines = ocrText.split(/\r?\n/);

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (
            /[ลร]เ[ชขค]บั[ตรต]/.test(lowerLine) ||
            /บั[ตรต][รน]ประ[จฉ]ำ/.test(lowerLine) ||
            /ประชาชน/.test(lowerLine)
        ) {
            const match = line.match(/[0-9\s]{13,20}/);
            if (match) {
                const raw = match[0].replace(/\s+/g, "");
                if (raw.length === 13) return raw;
            }
        }
    }

    const fallbackMatch = ocrText.match(/\b\d[\d\s]{11,18}\d\b/g);
    if (fallbackMatch) {
        for (const raw of fallbackMatch) {
            const digits = raw.replace(/\s+/g, "");
            if (digits.length === 13) return digits;
        }
    }

    return null;
}
const thaiMonthsMap: Record<string, number> = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
    "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
};

const thaiMonthCorrections: Record<string, string> = {
    "พ.ุย.": "พ.ย.",
    "พ.ย": "พ.ย.",     // missing dot
    "พ.ญ.": "พ.ย.",    // common typo
    "พ.ยู.": "พ.ย.",
    "พ.ุย": "พ.ย.",

    "มี.ีค.": "มี.ค.",
    "มีค.": "มี.ค.",
    "มี.ค": "มี.ค.",

    "ม.ย.": "เม.ย.",
    "เม.ฤ.": "เม.ย.",
    "เมย.": "เม.ย.",

    "ก.พ.": "ก.พ.",
    "กพ.": "ก.พ.",
    "ก.ฟ.": "ก.พ.",

    "มิ.ย.": "มิ.ย.",
    "มิย.": "มิ.ย.",

    "ก.ค.": "ก.ค.",
    "กค.": "ก.ค.",

    "ส.ค.": "ส.ค.",
    "สค.": "ส.ค.",

    "ก.ย.": "ก.ย.",
    "กย.": "ก.ย.",

    "ต.ค.": "ต.ค.",
    "ตค.": "ต.ค.",

    "ธ.ค.": "ธ.ค.",
    "ธค.": "ธ.ค.",
};


function parseThaiDate(thaiDateStr: string): Date | null {
    const m = thaiDateStr.match(/(\d{1,2})\s+([ก-ฮ\.]+)\s+(\d{4})/);
    console.log("m", m);
    if (!m) return null;

    const day = parseInt(m[1], 10);
    console.log("day", day);
    let monthStr = m[2];
    console.log("monthStr", monthStr);

    if (thaiMonthCorrections[monthStr]) {
        monthStr = thaiMonthCorrections[monthStr];
    }

    const month = thaiMonthsMap[monthStr];
    console.log("month", month);
    if (!month) return null;

    const yearBE = parseInt(m[3], 10);
    const year = yearBE - 543;
    console.log("yearBE", yearBE);
    console.log("year", year);
    return new Date(year, month - 1, day);
}


function parseEnglishDate(engDateStr: string): Date | null {
    const cleaned = engDateStr.replace(/\./g, "");
    const m = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const monthStr = m[2].toLowerCase();

    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = monthNames.indexOf(monthStr) + 1;
    if (month === 0) return null;

    const year = parseInt(m[3], 10);
    return new Date(year, month - 1, day);
}

function extractDob(ocrText: string): string | null {
    const normalizedText = ocrText.replace(/\s+/g, " ");

    const thaiDobMatch = normalizedText.match(/เกิดวันที่\s+(\d{1,2}\s+[ก-ฮ\.]+\s+\d{4})/);
    console.log("thai dob match", thaiDobMatch);
    if (thaiDobMatch) {
        const dateObj = parseThaiDate(thaiDobMatch[1]);
        if (dateObj) return dateObj.toISOString().slice(0, 10);
    }

    const engDobMatch = normalizedText.match(/Date of Birth\s+(\d{1,2}\s+[A-Za-z\.]+\s+\d{4})/i);
    if (engDobMatch) {
        const dateObj = parseEnglishDate(engDobMatch[1]);
        if (dateObj) return dateObj.toISOString().slice(0, 10);
    }

    return null;
}

const prefixMap: Record<string, string> = {
    "นาย": "Mr.",
    "นาง": "Mrs.",
    "นางสาว": "Miss",
    "Mr.": "นาย",
    "Mrs.": "นาง",
    "Miss": "นางสาว",
};

function extractThaiTextOnly(text: string): string {
    return text.replace(/[^\u0E00-\u0E7F\s]+/g, "").trim();
}

function extractEnglishTextOnly(text: string): string {
    return text.replace(/[^A-Za-z.\s]+/g, "").trim();
}

interface ExtractedName {
    prefixTh: string | null;
    nameTh: string | null;
    lastNameTh: string | null;
    prefixEn: string | null;
    nameEn: string | null;
    lastNameEn: string | null;
}

function extractNameInfo(ocrText: string): ExtractedName {
    const lines = ocrText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    let prefixTh: string | null = null;
    let nameTh: string | null = null;
    let lastNameTh: string | null = null;

    let prefixEn: string | null = null;
    let nameEn: string | null = null;
    let lastNameEn: string | null = null;

    const TH_NAME_PATTERN = /[ชซ]([ืีิ]?)[อื่]ตัว(และ)?[ชซ][ืีิ]?[อื่]ส[ลก]ุล\s+(.+)/;

    for (const line of lines) {
        if (line.includes("WIE")) {
            // Split the line at "WIE" and take the part after it
            const partsAfterWie = line.split("WIE")[1];
            const thaiOnly = extractThaiTextOnly(partsAfterWie).trim();
            const nameParts = thaiOnly.split(/\s+/).filter(Boolean);

            if (nameParts.length >= 2) {
                prefixTh = "นาย"; // "WIE" = นาย (Mr.)
                nameTh = nameParts[0]; // เฟอบี้ (first name)
                lastNameTh = nameParts[1]; // แกสลิ่ง (last name)
            } else if (nameParts.length === 1) {
                prefixTh = "นาย";
                nameTh = nameParts[0]; // Only a first name (no last name)
                lastNameTh = null;
            }
            break;
        }

        // Original Thai pattern matching (unchanged)
        const match = line.match(TH_NAME_PATTERN);
        if (match) {
            const nameParts = extractThaiTextOnly(match[3]).split(/\s+/).filter(Boolean);
            if (nameParts.length === 3 && prefixMap[nameParts[0]]) {
                prefixTh = nameParts[0];
                nameTh = nameParts[1];
                lastNameTh = nameParts[2];
            } else if (nameParts.length >= 2) {
                prefixTh = null;
                nameTh = nameParts[nameParts.length - 2];
                lastNameTh = nameParts[nameParts.length - 1];
            }
            break;
        }

        // Fallback if "และ" is found (unchanged)
        if (line.includes("และ")) {
            const thaiOnly = extractThaiTextOnly(line);
            const parts = thaiOnly.split(/\s+/).filter(Boolean);
            if (parts.length === 3 && prefixMap[parts[0]]) {
                prefixTh = parts[0];
                nameTh = parts[1];
                lastNameTh = parts[2];
            } else if (parts.length >= 2) {
                prefixTh = null;
                nameTh = parts[parts.length - 2];
                lastNameTh = parts[parts.length - 1];
            }
            break;
        }
    }

    for (const line of lines) {
        if (!nameEn && /name/i.test(line)) {
            const match = line.match(/name\s*(Mr\.|Mrs\.|Ms\.)?\s*([a-zA-Z]+)/i);
            if (match) {
                prefixEn = match[1] || null;
                nameEn = match[2];
            }
        }

        if (!lastNameEn && /last[\s-]*name/i.test(line)) {
            const match = line.match(/last[\s-]*name\s*([a-zA-Z]+)/i);
            if (match) {
                lastNameEn = match[1];
            }
        }
    }


    if (prefixTh && prefixEn) {
        if (prefixMap[prefixTh] !== prefixEn) {
            prefixEn = prefixMap[prefixTh] ?? null;
        }
    } else if (prefixTh && !prefixEn) {
        prefixEn = prefixMap[prefixTh] ?? null;
    } else if (!prefixTh && prefixEn) {
        prefixTh = prefixMap[prefixEn] ?? null;
    }

    return {
        prefixTh,
        nameTh,
        lastNameTh,
        prefixEn,
        nameEn,
        lastNameEn,
    };
}