import { ServerResponse } from "http";
import { ApiResponse } from "../models";

export function successResponse<T>(res: ServerResponse, message: string, data?: T) {
    const apiResponse: ApiResponse<T> = {
        statusCode: 200,
        message: message,
        data: data,
    }
    console.log("api", apiResponse);
    console.log("data", data);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(apiResponse));
}

export function errorResponse(
    res: ServerResponse,
    statusCode = 500,
    errors: string[],
    message: string = "Internal Server Error",
) {
    const apiResponse: ApiResponse<undefined> = {
        statusCode: statusCode,
        message: message,
        errors: errors,
    }
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(apiResponse));
}

export function notFoundResponse(
    res: ServerResponse,
    errors: string[],
    message: string = "Not Found",
) {
    errorResponse(res, 404, errors, message);
}

export function badRequestResponse(
    res: ServerResponse,
    errors: string[],
    message: string = "Bad Request",
) {
    errorResponse(res, 400, errors, message);
}

export function methodNotAllowedResponse(
    res: ServerResponse,
    errors: string[],
    message: string = "Method Not Allowed",
) {
    errorResponse(res, 405, errors, message);
}