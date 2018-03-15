import { AppError } from "./app-error";

export class OrgError extends AppError {
    public readonly name: string = 'OrgError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
