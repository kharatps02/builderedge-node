
export interface ISFResponse<T> {
    done: boolean;
    totalSize: number;
    records: T[];
    nextRecordsUrl?: string;
}
export class SFResponse<T> implements ISFResponse<T> {
    public done: boolean = false;
    public totalSize!: number;
    public records!: T[];
    public nextRecordsUrl?: string;
}
