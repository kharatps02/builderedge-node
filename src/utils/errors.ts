import { Enums } from "../config/enums";

export class AppError implements Error {
    static code = 500;
    public readonly name: string = 'AppError';
    protected readonly status = Enums.RESPONSE_STATUS.ERROR;
    /**
     * getCode
     */
    public getCode() {
        return Object.getPrototypeOf(this).constructor.code;
    }
    constructor(public message: string, public innerError?: Error) {
    }
}
export class NotFoundError extends AppError {
    static code = 404;
    public readonly name: string = 'NotFoundError';
    protected readonly status = Enums.RESPONSE_STATUS.ERROR;
    constructor(public message: string = '404 - The file or resource not found!', public innerError?: Error) {
        super(message, innerError);
    }
}
export class UnauthorizedError extends AppError {
    static code = 401;
    public readonly name: string = 'UnauthorizedError';
    protected readonly status = Enums.RESPONSE_STATUS.ERROR;
    constructor(public message: string, public innerError?: Error) {
        super(message, innerError);
    }
}
export class ConnectionError extends AppError {
    public readonly name: string = 'ConnectionError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
export class OrgError extends AppError {
    public readonly name: string = 'OrgError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
export class InvalidRequestError extends AppError {
    static code = 400;
    public readonly name: string = 'InvalidRequestError';
    constructor(message: string, innerError?: Error) {
        super(message, innerError);
    }
}
// TODO: define error codes here
export enum ERROR_CODES {
    ORG_NOT_FOUND
}