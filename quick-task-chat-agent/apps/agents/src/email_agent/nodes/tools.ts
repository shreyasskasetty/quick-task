import { LangGraphToolSet } from "composio-core";

const composioToolset = new LangGraphToolSet({apiKey:"3objhchznifezy3mxd2d46"});

export async function getEmailTools(){
    const emailTools = await composioToolset.getTools({
      actions: ["OUTLOOK_OUTLOOK_SEND_EMAIL"],
    })
    return emailTools;
}