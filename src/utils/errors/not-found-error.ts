import { AppError } from "./app-error";
import { Enums } from "../../config/enums";

export class NotFoundError extends AppError {
    public static code = 404;
    public readonly name: string = 'NotFoundError';
    protected readonly status = Enums.RESPONSE_STATUS.ERROR;
    constructor(public message: string = '404 - The file or resource not found!', public innerError?: Error) {
        super(message, innerError);
    }
}
