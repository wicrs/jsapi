import { v4 as uuidv4 } from "uuid";
import fetch, { RequestInfo, RequestInit, Headers } from "node-fetch";
import { assert } from "console";

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

export interface HubMember {
    user_id: ID;
    joined: Date;
    groups: ID[];
    hub_permissions: Map<HubPermission, PermissionSetting>;
    channel_permissions: Map<ID, Map<ChannelPermission, PermissionSetting>>;
}

export interface Channel {
    id: ID;
    name: string;
    description: string;
    hub_id: ID;
    created: Date;
}

export interface Message {
    id: ID;
    hub_id: ID;
    channel_id: ID;
    sender: ID;
    created: Date;
    content: string;
}

export interface PermissionGroup {
    id: ID;
    name: string;
    members: ID[];
    hub_permissions: Map<HubPermission, PermissionSetting>;
    channel_permissions: Map<ID, Map<ChannelPermission, PermissionSetting>>;
    created: Date;
}

export interface Hub {
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
}

export type Result<T> = {
    success?: T;
    error?: string;
}

interface SetPermission {
    setting: PermissionSetting;
}

class MessagesAfterQuery {
    from: ID;
    max: number;
    constructor(from: ID, max: number) {
        this.from = from;
        this.max = max;
    }
}

class MessagesTimePeriodQuery {
    from: Date;
    to: Date;
    max: number;
    new_to_old: boolean;
    constructor(from: Date, to: Date, max: number, new_to_old: boolean) {
        this.from = from;
        this.to = to;
        this.max = max;
        this.new_to_old = new_to_old;
    }
}

export interface HubUpdate {
    name?: string;
    description?: string;
    default_group?: ID;
}

export interface ChannelUpdate {
    name?: string;
    description?: string;
}

export interface ServerInfo {
    version: string;
}

export class HttpClient {
    base_url: string;
    auth: string;
    constructor(base_url: string, auth: string) {
        this.base_url = base_url;
        this.auth = auth;
    }

    async http<T>(url: RequestInfo, init: RequestInit = {
        method: "GET", headers: {
            "Authorization": this.auth
        }
    }): Promise<T> {
        const response = await fetch(url, init);
        const json = await response.json();
        const result: Result<T> = json as Result<T>;
        if (result.success) {
            return result.success;
        } else {
            throw new Error(result.error);
        }
    }

    async post<T>(url: RequestInfo, body?: any): Promise<T> {
        let body_text = "";
        let content_type = "";
        if (body !== undefined) {
            body_text = JSON.stringify(body);
            content_type = "application/json";
        }
        return await this.http(url, {
            method: "POST",
            headers: {
                "Authorization": this.auth,
                "Content-type": content_type
            },
            body: body_text
        });
    }

    async put<T>(url: RequestInfo, body?: string): Promise<T> {
        return await this.http(url, {
            method: "PUT",
            headers: {
                "Authorization": this.auth,
                "Content-type": "application/json"
            },
            body: body
        });
    }

    async delete<T>(url: RequestInfo): Promise<T> {
        return await this.http(url, {
            method: "DELETE",
            headers: {
                "Authorization": this.auth
            }
        });
    }

    public async getHub(id: ID): Promise<Hub> {
        console.log("Getting hub " + id);
        return await this.http(this.base_url + "/hub/" + id);
    }

    public async createHub(name?: string, description?: string): Promise<ID> {
        console.log("Creating hub " + name);
        return await this.post(this.base_url + "/hub", {name: name, description: description});
    }

    public async deleteHub(id: ID): Promise<string> {
        console.log("Deleting hub " + id);
        return await this.http(this.base_url + "/hub/" + id);
    }

    public async updateHub(id: ID, update: HubUpdate): Promise<HubUpdate> {
        console.log("Updating hub " + id);
        return await this.put(this.base_url + "/hub/" + id, JSON.stringify(update));
    }

    public async joinHub(hub_id: ID): Promise<string> {
        console.log("Joining hub " + hub_id);
        return await this.post(this.base_url + "/hub/" + hub_id + "/join");
    }

    public async leaveHub(hub_id: ID): Promise<string> {
        console.log("Leaving hub " + hub_id);
        return await this.post(this.base_url + "/hub/" + hub_id + "/leave");
    }

    public async getChannel(hub_id: ID, channel_id: ID): Promise<Channel> {
        console.log("Getting channel " + channel_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/channel/" + hub_id + "/" + channel_id);
    }

    public async updateChannel(hub_id: ID, channel_id: ID, update: ChannelUpdate): Promise<ChannelUpdate> {
        console.log("Updating channel " + channel_id + " in hub " + hub_id);
        return await this.put(this.base_url + "/channel/" + hub_id + "/" + channel_id, JSON.stringify(update));
    }

    public async deleteChannel(hub_id: ID, channel_id: ID): Promise<string> {
        console.log("Deleting channel " + channel_id + " in hub " + hub_id);
        return await this.delete(this.base_url + "/channel/" + hub_id + "/" + channel_id);
    }

    public async createChannel(hub_id: ID, name?: string, description?: string): Promise<ID> {
        console.log("Creating channel " + name + " in hub " + hub_id);
        return await this.post(this.base_url + "/channel/" + hub_id, {name: name, description: description});
    }
}

async function test() {
    const user_id = uuidv4();
    console.log("User ID: " + user_id);
    const client = new HttpClient("http://127.0.0.1:8080/api", user_id);
    const hub_id = await client.createHub("test0");
    let hub = await client.getHub(hub_id);
    console.log("Hub name: " + hub.name + " description: " + hub.description);

    const hub_update = { name: "test1", description: "test2" };
    let hub_update_response = await client.updateHub(hub_id, hub_update);
    assert(hub_update_response.name === "test0");

    hub = await client.getHub(hub_id);
    console.log("Hub name: " + hub.name + " description: " + hub.description);

    await client.leaveHub(hub_id);
    try {
        hub = await client.getHub(hub_id);
    } catch (e) {
        console.log("Cannot get hub after leaving. (Good)");
    }

    await client.joinHub(hub_id);
    hub = await client.getHub(hub_id);

    const channel_id = Object.keys(hub.channels)[0];
    let channel = await client.getChannel(hub_id, channel_id);
    console.log("Channel name: " + channel.name + " description: " + channel.description);

    const channel_update = { name: "test3", description: "test4" };
    let channel_update_response = await client.updateChannel(hub_id, channel_id, channel_update);
    assert(channel_update_response.name === "chat");

    channel = await client.getChannel(hub_id, channel_id);
    console.log("Channel name: " + channel.name + " description: " + channel.description);

    await client.deleteChannel(hub_id, channel_id);
    try {
        channel = await client.getChannel(hub_id, channel_id);
    } catch (e) {
        console.log("Cannot get channel after deleting. (Good)");
    }

    await client.deleteHub(hub_id);
    try {
        hub = await client.getHub(hub_id);
    } catch (e) {
        console.log("Cannot get hub after deleting it. (Good)");
    }
}

test().then(() => { console.log("Done"); });

