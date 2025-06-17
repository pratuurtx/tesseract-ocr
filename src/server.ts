import http, { IncomingMessage, ServerResponse } from "http";
import { getServerConfig } from "./config";
import { badRequestResponse, methodNotAllowedResponse, notFoundResponse, parseRequestBody, sendResponse, setCorsHeaders, successResponse } from "./util";
import { ALLOW_METHODS } from "./constants";
import { loggerMiddleware } from "./middlewares";

try {
    const { hostname, port } = getServerConfig();

    const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        loggerMiddleware(req, res);
        const { url, method } = req;

        if (!method || !ALLOW_METHODS.includes(method)) {
            return methodNotAllowedResponse(res, [`${method} was Not Allowed`]);
        }

        setCorsHeaders(req, res);

        if (method === "GET" && url === "/health") {
            return successResponse<string>(res, "Success", "OK");
        }

        if (method === "POST" && url === "/api/tesseract-ocr/thai-id") {
            try {
                const body = await parseRequestBody(req);
                const parsedBody = body ? JSON.parse(body) : {};

                console.log("Received Body:", parsedBody);

                return successResponse<any>(res, "Success", parsedBody);
            } catch (err: unknown) {
                console.error("Error parsing request body:", err);
                return badRequestResponse(res, [err instanceof Error ? err.message : String(err)]);
            }
        }

        return notFoundResponse(res, [`${method}:${url} was NOT Found`]);
    });

    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
} catch (err: unknown) {
    console.error("Server configuration error:", err instanceof Error ? err.message : err);
    process.exit(1);
}
