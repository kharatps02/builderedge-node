export interface IHasToken {
    refresh_token?: string;
    access_token?: string;
}
export interface IOAuthToken {
    refresh_token?: string;
    access_token?: string;
    instance_url: string;
    id: string;
    token_type: string;
    issued_at: string;
    signature: string;
}
