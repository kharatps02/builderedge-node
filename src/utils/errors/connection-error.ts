import { AppError } from "./app-error";

export class ConnectionError extends AppError {
    public readonly name: string = 'ConnectionError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
