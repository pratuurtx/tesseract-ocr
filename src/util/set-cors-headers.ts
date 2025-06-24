import { IncomingMessage, ServerResponse } from "http";
import { ALLOW_METHODS } from "../constants";

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    const allowedOrigins = (() => process.env.ALLOWED_ORIGINS ?? "*")();
    const allowedHeaders = (() => process.env.ALLOWED_HEADERS ?? "Content-Type, Authorization, x-api-key")();
    console.log("origin", origin);
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS);
    res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
}