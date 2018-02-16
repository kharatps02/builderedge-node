import { IHasToken } from './../authentication/oauth-model';
import { utils } from '../../utils/utils';
export interface IOrgMaster extends IHasToken {
    vanity_id: string;
    api_base_url: string;
    access_token: string;
    user_id?: string;
    refresh_token: string;
    event_endpoint_url: string;
    org_id: string;
}
export class OrgMaster implements IOrgMaster {
    constructor(org?: IOrgMaster) {
        if (org) {
            this.vanity_id = org.vanity_id;
            this.api_base_url = org.api_base_url;
            this.access_token = org.access_token;
            this.user_id = org.user_id;
            this.refresh_token = org.refresh_token;
            this.event_endpoint_url = org.event_endpoint_url;
            this.org_id = org.org_id;
        }
    }
    public vanity_id: string;
    public api_base_url: string;
    public access_token: string;
    public user_id?: string;
    public refresh_token: string;
    public event_endpoint_url: string;
    public org_id: string;

    /**
     * getRefreshToken
     */
    public getRefreshToken() {
        return utils.decryptCipher(this.refresh_token, process.env.TOKEN_ENCRIPTION_KEY || '');
    }
}
