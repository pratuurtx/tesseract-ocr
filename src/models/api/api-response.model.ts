export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    errors?: string[];
    data?: T;
}