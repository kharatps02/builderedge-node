export class ConnectionError extends Error {
    constructor(message: string, public innerError: Error) {
        super(message);
    }
}
