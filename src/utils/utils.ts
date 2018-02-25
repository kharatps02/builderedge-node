import { ConnectionError } from './errors';
import { Client } from "pg";

export namespace utils {
    export function encryptCipher(data: any, encryptionKey: string): string {
        // TODO: write encryption logic here
        return data;
    }
    export function decryptCipher(data: any, encryptionKey: string): string {
        // TODO: write decryption logic here
        return data;
    }
    export async function endClient(pgClient: Client) {
        return await pgClient.end((err) => console.error(`At End pgClient `, err));
    }
    export async function connectClient(pgClient: Client) {
        return await pgClient.connect((err) => { throw new ConnectionError('Could not connect to database ', err); });
    }
}
