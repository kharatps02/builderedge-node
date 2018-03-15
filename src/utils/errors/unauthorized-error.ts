import { AppError } from "./app-error";
import { Enums } from "../../config/enums";

export class UnauthorizedError extends AppError {
    public static code = 401;
    public readonly name: string = 'UnauthorizedError';
    protected readonly status = Enums.RESPONSE_STATUS.ERROR;
    constructor(public message: string, public innerError?: Error) {
        super(message, innerError);
    }
}
