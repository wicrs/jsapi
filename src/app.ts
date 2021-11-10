import { v4 as uuidv4 } from "uuid";
import fetch, { RequestInfo, RequestInit } from "node-fetch";
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
    All = "ALL",
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

export interface MemberStatus {
    member: ID;
    banned: boolean;
    muted: boolean;
}

export type Result<T> = {
    success?: T;
    error?: string;
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
        if (result.success !== undefined) {
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
        return await this.post(this.base_url + "/hub", { name: name, description: description });
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
        return await this.post(this.base_url + "/channel/" + hub_id, { name: name, description: description });
    }

    public async getMember(hub_id: ID, member_id: ID): Promise<HubMember> {
        console.log("Getting member " + member_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/member/" + hub_id + "/" + member_id);
    }

    public async getMemberStatus(hub_id: ID, member_id: ID): Promise<MemberStatus> {
        console.log("Getting member status " + member_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/member/" + hub_id + "/" + member_id + "/status");
    }

    public async setMemberHubPermission(hub_id: ID, member_id: ID, permission: HubPermission, setting?: boolean): Promise<MemberStatus> {
        console.log("Setting member permission " + permission + " for member " + member_id + " in hub " + hub_id);
        return await this.put(this.base_url + "/member/" + hub_id + "/" + member_id + "/hub_permission/" + permission, JSON.stringify({ setting: setting }));
    }

    public async setMemberChannelPermission(hub_id: ID, member_id: ID, channel_id: ID, permission: ChannelPermission, setting?: boolean): Promise<MemberStatus> {
        console.log("Setting member permission " + permission + " for member " + member_id + " in channel " + channel_id + " in hub " + hub_id);
        return await this.put(this.base_url + "/member/" + hub_id + "/" + member_id + "/channel_permission/" + channel_id + "/" + permission, JSON.stringify({ setting: setting }));
    }

    public async getMemberHubPermission(hub_id: ID, member_id: ID, permission: HubPermission): Promise<boolean | undefined> {
        console.log("Getting member permission " + permission + " for member " + member_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/member/" + hub_id + "/" + member_id + "/hub_permission/" + permission);
    }

    public async getMemberChannelPermission(hub_id: ID, member_id: ID, channel_id: ID, permission: ChannelPermission): Promise<boolean | undefined> {
        console.log("Getting member permission " + permission + " for member " + member_id + " in channel " + channel_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/member/" + hub_id + "/" + member_id + "/channel_permission/" + channel_id + "/" + permission);
    }

    public async banMember(hub_id: ID, member_id: ID): Promise<string> {
        console.log("Banning member " + member_id + " in hub " + hub_id);
        return await this.post(this.base_url + "/member/" + hub_id + "/" + member_id + "/ban");
    }

    public async unbanMember(hub_id: ID, member_id: ID): Promise<string> {
        console.log("Unbanning member " + member_id + " in hub " + hub_id);
        return await this.post(this.base_url + "/member/" + hub_id + "/" + member_id + "/unban");
    }

    public async muteMember(hub_id: ID, member_id: ID): Promise<string> {
        console.log("Muting member " + member_id + " in hub " + hub_id);
        return await this.post(this.base_url + "/member/" + hub_id + "/" + member_id + "/mute");
    }

    public async unmuteMember(hub_id: ID, member_id: ID): Promise<string> {
        console.log("Unmuting member " + member_id + " in hub " + hub_id);
        return await this.post(this.base_url + "/member/" + hub_id + "/" + member_id + "/unmute");
    }

    public async kickMember(hub_id: ID, member_id: ID): Promise<string> {
        console.log("Kicking member " + member_id + " in hub " + hub_id);
        return await this.post(this.base_url + "/member/" + hub_id + "/" + member_id + "/kick");
    }

    public async sendMessage(hub_id: ID, channel_id: ID, message: string): Promise<ID> {
        console.log("Sending message " + message + " in channel " + channel_id + " in hub " + hub_id);
        return await this.post(this.base_url + "/message/" + hub_id + "/" + channel_id, { message: message });
    }

    public async getMessage(hub_id: ID, channel_id: ID, message_id: ID): Promise<Message> {
        console.log("Getting message " + message_id + " in channel " + channel_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/message/" + hub_id + "/" + channel_id + "/" + message_id);
    }

    public async getMessagesAfter(hub_id: ID, channel_id: ID, from: ID, max: number): Promise<Message[]> {
        console.log("Getting messages after " + from + " in channel " + channel_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/message/" + hub_id + "/" + channel_id + "/after", {
            method: "GET",
            headers: {
                "Authorization": this.auth,
                "Content-type": "application/json"
            },
            body: JSON.stringify({ from: from, max: max })
        });
    }

    public async getMesssagesTimeRange(hub_id: ID, channel_id: ID, from: Date, to: Date, max: number, new_to_old: boolean): Promise<Message[]> {
        console.log("Getting messages in time range " + from + " to " + to + " in channel " + channel_id + " in hub " + hub_id);
        return await this.http(this.base_url + "/message/" + hub_id + "/" + channel_id + "/time_period", {
            method: "GET",
            headers: {
                "Authorization": this.auth,
                "Content-type": "application/json"
            },
            body: JSON.stringify({ from: from, to: to, max: max, new_to_old: new_to_old })
        });
    }

    public async graphQL(query: string, variables?: any): Promise<any> {
        console.log("Sending graphQL query.");
        const response = await fetch(this.base_url + "/graphql", {
            method: "POST",
            headers: {
                "Authorization": this.auth,
                "Content-type": "application/json"
            },
            body: JSON.stringify({ query: query, variables: variables })
        });

        return await response.json();
    }
}

async function test() {
    const user_id = uuidv4();
    const extra_user_id = uuidv4();
    console.log("User ID: " + user_id);
    const client = new HttpClient("http://127.0.0.1:8080/api", user_id);
    const extra_client = new HttpClient("http://127.0.0.1:8080/api", extra_user_id);

    const hub_id = await client.createHub("test0");
    let hub = await client.getHub(hub_id);
    console.log("Hub name: " + hub.name + " description: " + hub.description);

    const channel_id = Object.keys(hub.channels)[0];

    const hub_update = { name: "test1", description: "test2" };
    let hub_update_response = await client.updateHub(hub_id, hub_update);
    assert(hub_update_response.name === "test0");

    hub = await client.getHub(hub_id);
    console.log("Hub name: " + hub.name + " description: " + hub.description);

    const graphql_query = `query{\nhub(id:"` + hub_id + `"){\nname\ndescription\n}\n}`;
    let graphql_response = await client.graphQL(graphql_query);
    assert(graphql_response.data.hub.name === "test1");

    await extra_client.joinHub(hub_id);

    const read_channels_perm = await client.getMemberHubPermission(hub_id, extra_user_id, HubPermission.Administrate);
    const read_channel_perm = await client.getMemberChannelPermission(hub_id, extra_user_id, channel_id, ChannelPermission.Manage);
    await client.setMemberHubPermission(hub_id, extra_user_id, HubPermission.ReadChannels, !read_channels_perm);
    await client.setMemberChannelPermission(hub_id, extra_user_id, channel_id, ChannelPermission.Read, !read_channel_perm);
    assert(await client.getMemberHubPermission(hub_id, extra_user_id, HubPermission.ReadChannels) !== read_channels_perm);
    assert(await client.getMemberChannelPermission(hub_id, extra_user_id, channel_id, ChannelPermission.Read) !== read_channel_perm);
    await client.setMemberChannelPermission(hub_id, extra_user_id, channel_id, ChannelPermission.Write, true);

    const message_id = await extra_client.sendMessage(hub_id, channel_id, "test message");
    await client.getMessage(hub_id, channel_id, message_id);

    await client.muteMember(hub_id, extra_user_id);
    try {
        await extra_client.sendMessage(hub_id, channel_id, "test message");
    } catch (e) {
        console.log("Cannot send message when muted. (Good)");
    }

    await client.unmuteMember(hub_id, extra_user_id);
    await extra_client.sendMessage(hub_id, channel_id, "another test message");

    await client.kickMember(hub_id, extra_user_id);
    try {
        await extra_client.getHub(hub_id);
    } catch (e) {
        console.log("Cannot get hub after being kicked. (Good)");
    }

    await extra_client.joinHub(hub_id);
    await extra_client.getHub(hub_id);

    await client.banMember(hub_id, extra_user_id);
    try {
        await extra_client.getHub(hub_id);
    } catch (e) {
        console.log("Cannot get hub when banned. (Good)");
    }
    try {
        await extra_client.joinHub(hub_id);
    } catch (e) {
        console.log("Cannot join hub when banned. (Good)");
    }

    await client.leaveHub(hub_id);
    try {
        hub = await client.getHub(hub_id);
    } catch (e) {
        console.log("Cannot get hub after leaving. (Good)");
    }

    await client.joinHub(hub_id);
    hub = await client.getHub(hub_id);
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

