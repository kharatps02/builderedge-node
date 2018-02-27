import { Enums } from "../config/enums";

export class AppError implements Error {
    public readonly name: string = 'AppError';
    protected readonly status = Enums.RESPONSE_STATUS.ERROR;
    constructor(public message: string, public innerError?: Error) {
    }
}
export class ConnectionError extends AppError {
    public readonly name: string = 'AppError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
export class OrgError extends AppError {
    public readonly name: string = 'AppError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
// TODO: define error codes here
export enum ERROR_CODES {
    ORG_NOT_FOUND
}