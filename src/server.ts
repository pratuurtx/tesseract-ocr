import http, { IncomingMessage, ServerResponse } from "http";
import {
    badRequestResponse,
    forbiddenResponse,
    internalServerErrorResponse,
    methodNotAllowedResponse,
    notFoundResponse,
    parseRequestBody,
    setCorsHeaders,
    successResponse
} from "./util";
import { ALLOW_METHODS } from "./constants";
import { loggerMiddleware } from "./middlewares";
import { extractThaiIdByTesseractJs } from "./services";
import { getServerConfig } from "./config";

try {
    const { hostname, port } = getServerConfig();
    const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        loggerMiddleware(req, res);
        const { url, method } = req;

        if (method === "OPTIONS") {
            setCorsHeaders(req, res);
            res.writeHead(204);
            res.end();
            return;
        }

        if (!method || !ALLOW_METHODS.includes(method)) {
            return methodNotAllowedResponse(res, [`${method} was Not Allowed`]);
        }

        setCorsHeaders(req, res);

        const xApiKey = (() => process.env.X_API_KEY)();
        if (!xApiKey) {
            return internalServerErrorResponse(res, []);
        }

        const xApiKeyReq = req.headers["x-api-key"];
        if (xApiKeyReq !== xApiKey) {
            return forbiddenResponse(res, [`Some header is required`]);
        }

        if (method === "GET" && url === "/health") {
            return successResponse<string>(res, "Success", "OK");
        }

        if (method === "POST" && url === "/api/ocr/thai-id") {
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
    })
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}/`);
    });
} catch (err: unknown) {
    console.error("Server configuration error:", err instanceof Error ? err.message : err);
    process.exit(1);
}

