import { LinkQuery, Literal, Perspective, type Ad4mClient, type Agent } from "@coasys/ad4m";

export class AgentLoaded {
    profile_base64: string;
    profile_mime_type: string;
    username: string;
    agent: Agent

    constructor(profile_base64: string, username: string, agent: Agent, profile_mime_type: string) {
        this.profile_base64 = profile_base64;
        this.username = username;
        this.agent = agent;
        this.profile_mime_type = profile_mime_type;
    }
}


export default class AgentCache {
    cache = new Map<string, AgentLoaded>();
    ad4m: Ad4mClient;
    
    constructor(ad4m: Ad4mClient) {
        this.ad4m = ad4m;
    }

    async getAgent(did: string): Promise<AgentLoaded> {
        if (this.cache.has(did)) {
            return this.cache.get(did)!;
        }

		const agent = await this.ad4m.agent.byDID(did)
		
		const p = new Perspective(agent.perspective?.links)
		const username = Literal.fromUrl(p.getSingleTarget(new LinkQuery({predicate: "sioc://has_username"}))).get()
		const profile_image_url = p.getSingleTarget(new LinkQuery({predicate: "sioc://has_profile_image"}))
		let profile_base64
		let mime_type
		if(profile_image_url) {
			const profile_image = await this.ad4m.expression.get(profile_image_url)
			if(profile_image) {
				const data = JSON.parse(profile_image.data)
				profile_base64 = data.data_base64
				mime_type = data.file_type
			}	
		}

        const agentLoaded = new AgentLoaded(profile_base64, username, agent, mime_type);
        this.cache.set(did, agentLoaded);
        return agentLoaded;
    }

}

