import { IncomingMessage, ServerResponse } from "http";
import {
    badRequestResponse,
    methodNotAllowedResponse,
    notFoundResponse,
    parseRequestBody,
    setCorsHeaders,
    successResponse
} from "./util";
import { ALLOW_METHODS } from "./constants";
import { loggerMiddleware } from "./middlewares";
import { extractThaiIdByTesseractJs } from "./services";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    loggerMiddleware(req, res);
    const { url, method } = req;

    if (!method || !ALLOW_METHODS.includes(method)) {
        return methodNotAllowedResponse(res, [`${method} was Not Allowed`]);
    }

    if (method === "OPTIONS") {
        setCorsHeaders(req, res);
        res.writeHead(204);
        res.end();
        return;
    }

    setCorsHeaders(req, res);

    if (method === "GET" && url === "/health") {
        return successResponse<string>(res, "Success", "OK");
    }

    if (method === "POST" && url === "/api/tesseract-js/thai-id") {
        try {
            const body = await parseRequestBody(req);
            const parsedBody = body ? JSON.parse(body) : {};

            const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;

            if (!base64Regex.test(parsedBody.base64ImageStr)) {
                return badRequestResponse(res, ["Invalid base64 image string"]);
            }

            const response = await extractThaiIdByTesseractJs(parsedBody);
            return successResponse<any>(res, "Success", response);
        } catch (err: unknown) {
            console.error("Error:", err);
            return badRequestResponse(res, [err instanceof Error ? err.message : String(err)]);
        }
    }

    return notFoundResponse(res, [`${method}:${url} was NOT Found`]);
}