import { Enums } from "../../config/enums";

export class AppError implements Error {
    public static code = 500;
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
