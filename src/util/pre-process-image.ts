import sharp from "sharp";

export async function preprocessImage(base64ImageStr: string): Promise<Buffer> {
    const base64 = base64ImageStr.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64, "base64");

    const preprocessed = await sharp(imageBuffer)
        .grayscale()
        .resize({ width: 1024 })
        .toFormat("jpg")
        .toBuffer();

    return preprocessed;
}