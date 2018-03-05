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
}
