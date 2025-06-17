import * as dotenv from "dotenv";

dotenv.config();

export function getServerConfig(): { hostname: string; port: number } {
    const hostname = process.env.SERVER_HOST ?? "localhost";
    const portStr = process.env.SERVER_PORT ?? "5000";
    const port = parseInt(portStr, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid server port: ${portStr}. Port must be between 1 and 65535.`);
    }

    return { hostname, port };
}