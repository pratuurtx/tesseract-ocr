import { IncomingMessage, ServerResponse } from "http";
import { ALLOW_HEADERS, ALLOW_METHODS } from "../constants";

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    const allowedOrigins = (() => process.env.ALLOWED_ORIGINS?.split(",") || ["*"])();
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS.join(", "));
    res.setHeader("Access-Control-Allow-Headers", ALLOW_HEADERS.join(", "));
}