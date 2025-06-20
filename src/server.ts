import http, { IncomingMessage, ServerResponse } from "http";
import {
    badRequestResponse,
    methodNotAllowedResponse,
    notFoundResponse,
    parseRequestBody,
    setCorsHeaders,
    successResponse
} from "./util";
import { getServerConfig } from "./config";
import { ALLOW_METHODS } from "./constants";
import { loggerMiddleware } from "./middlewares";
import { extractThaiIdByTesseractJs } from "./services";

try {
    const { hostname, port } = getServerConfig();
    const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        loggerMiddleware(req, res);
        const { url, method } = req;
        console.log("url", url);
        console.log("method", method);
        if (!method || !ALLOW_METHODS.includes(method)) {
            return methodNotAllowedResponse(res, [`${method} was Not Allowed`]);
        }

        if (method === "OPTIONS") {
            setCorsHeaders(req, res);
            res.writeHead(204); // No Content
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
                    return badRequestResponse(res, ["Invalid base64 image string: must start with data:image/...;base64,"]);
                }

                const response = await extractThaiIdByTesseractJs(parsedBody);

                return successResponse<any>(res, "Success", response);
            } catch (err: unknown) {
                console.error("Error parsing request body:", err);
                return badRequestResponse(res, [err instanceof Error ? err.message : String(err)]);
            }
        }

        return notFoundResponse(res, [`${method}:${url} was NOT Found`]);
    });

    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}/`);
    });
} catch (err: unknown) {
    console.error("Server configuration error:", err instanceof Error ? err.message : err);
    process.exit(1);
}
