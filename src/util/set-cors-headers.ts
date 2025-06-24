import { IncomingMessage, ServerResponse } from "http";
import { ALLOW_METHODS } from "../constants";

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    const allowedOrigins = (() => process.env.ALLOWED_ORIGINS?.split(",") || ["*"])();
    const allowedHeaders = (() => process.env.ALLOWED_HEADERS?.split(",") || ["Content-Type", "Authorization", "x-api-key"])();
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS.join(", "));
    res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(", "));
}