import { AppError } from "./app-error";

export class InvalidRequestError extends AppError {
    public static code = 400;
    public readonly name: string = 'InvalidRequestError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
