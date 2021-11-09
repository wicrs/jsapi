import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
//const fetch = (...args: any) => import('node-fetch').then(({default: fetch}) => fetch(args));

export type ID = string;
export type PermissionSetting = boolean | null;

export enum HubPermission {
    All = "ALL",
    ReadChannels = "READ_CHANNELS",
    WriteChannels = "WRITE_CHANNELS",
    Administrate = "ADMINISTRATE",
    ManageChannels = "MANAGE_CHANNELS",
    Mute = "MUTE",
    Unmute = "UNMUTE",
    Kick = "KICK",
    Ban = "BAN",
    Unban = "UNBAN",
}

export enum ChannelPermission {
    Write = "WRITE",
    Read = "READ",
    Manage = "MANAGE",
    ll = "ALL",
}

export class HubMember {
    user_id: ID;
    joined: Date;
    groups: ID[];
    hub_permissions: Map<HubPermission, PermissionSetting>;
    channel_permissions: Map<ID, Map<ChannelPermission, PermissionSetting>>;
    constructor(user_id: ID, joined: Date, groups: ID[], hub_permissions: Map<HubPermission, PermissionSetting>, channel_permissions: Map<ID, Map<ChannelPermission, PermissionSetting>>) {
        this.user_id = user_id;
        this.joined = joined;
        this.groups = groups;
        this.hub_permissions = hub_permissions;
        this.channel_permissions = channel_permissions;
    }
}

export class Channel {
    id: ID;
    name: string;
    description: string;
    hub_id: ID;
    created: Date;
    constructor(id: ID, name: string, description: string, hub_id: ID, created: Date) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.hub_id = hub_id;
        this.created = created;
    }
}

export class Message {
    id: ID;
    hub_id: ID;
    channel_id: ID;
    sender: ID;
    created: Date;
    content: string;
    constructor(id: ID, hub_id: ID, channel_id: ID, sender: ID, content: string) {
        this.id = id;
        this.hub_id = hub_id;
        this.channel_id = channel_id;
        this.sender = sender;
        this.created = new Date();
        this.content = content;
    }
}

export class PermissionGroup {
    id: ID;
    name: string;
    members: ID[];
    hub_permissions: Map<HubPermission, PermissionSetting>;
    channel_permissions: Map<ID, Map<ChannelPermission, PermissionSetting>>;
    created: Date;
    constructor(id: ID, name: string, members: ID[], hub_permissions: Map<HubPermission, PermissionSetting>, channel_permissions: Map<ID, Map<ChannelPermission, PermissionSetting>>, created: Date) {
        this.id = id;
        this.name = name;
        this.members = members;
        this.hub_permissions = hub_permissions;
        this.channel_permissions = channel_permissions;
        this.created = created;
    }
}

export class Hub {
    id: ID;
    name: string;
    description: string;
    created: Date;
    members: Map<ID, HubMember>;
    channels: Map<ID, Channel>;
    groups: Map<ID, PermissionGroup>;
    default_group: ID;
    owner: ID;
    banned: ID[];
    mutes: ID[];
    constructor(id: ID, name: string, description: string, owner: ID, created: Date, members: Map<ID, HubMember>, channels: Map<ID, Channel>, groups: Map<ID, PermissionGroup>, default_group: ID, banned: ID[], mutes: ID[]) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.created = created;
        this.members = members;
        this.channels = channels;
        this.groups = groups;
        this.default_group = default_group;
        this.owner = owner;
        this.banned = banned;
        this.mutes = mutes;
    }
}

export class Response {
    success?: any;
    error?: string;
}

export class HttpClient {
    base_url: string;
    auth: string;
    constructor(base_url: string, auth: string) {
        this.base_url = base_url;
        this.auth = auth;
    }

    public async getHub(id: ID): Promise<Hub> {
        console.log("Getting hub " + id);
        var response = await fetch(this.base_url + "/hub/" + id, {
            method: "GET",
            headers: {
                "Authorization": this.auth
            }
        });
        var text = await response.text();
        var result: Response = JSON.parse(text);
        if (result.success) {
            return result.success;
        } else {
            throw new Error(result.error);
        }
    }

    public async createHub(name: string): Promise<ID> {
        console.log("Creating hub " + name);
        var response = await fetch(this.base_url + "/hub", {
            method: "POST",
            headers: {
                "Authorization": this.auth
            },
            body: name
        });
        var text = await response.text();
        var result: Response = JSON.parse(text);
        if (result.success) {
            return result.success;
        } else {
            throw new Error(result.error);
        }
    }
}

const client = new HttpClient("http://127.0.0.1:8080/api", uuidv4());
client.createHub("test").then(id => {
    console.log(id);
    client.getHub(id).then(hub => {
        console.log(hub);
    });
});

