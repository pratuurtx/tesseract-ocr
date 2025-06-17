import { ServerResponse } from "http";

export function sendResponse(
    res: ServerResponse,
    statusCode: number,
    data: any,
    headers: Record<string, string> = {}
) {
    const defaultHeaders = {
        "Content-Type": "application/json",
        ...headers
    };

    res.writeHead(statusCode, defaultHeaders);
    res.end(JSON.stringify(data));
};