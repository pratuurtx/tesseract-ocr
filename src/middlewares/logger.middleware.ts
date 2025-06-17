import { IncomingMessage, ServerResponse } from "http";

export function loggerMiddleware(req: IncomingMessage, res: ServerResponse) {
    const start = Date.now();
    const { method, url } = req;

    res.on("finish", () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusType = status >= 200 && status < 400 ? "SUCCESS" : "FAIL";

        console.log(
            `[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms - ${statusType}`
        );
    });
}
