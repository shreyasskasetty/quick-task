import { LangGraphToolSet } from "composio-core";

const composioToolset = new LangGraphToolSet({apiKey:"3objhchznifezy3mxd2d46"});

export async function getCalendarTools(){
    const calendarTools = await composioToolset.getTools({
      actions: ["GOOGLECALENDAR_CREATE_EVENT", "GOOGLECALENDAR_REMOVE_ATTENDEE", "GOOGLECALENDAR_DELETE_EVENT", "GOOGLECALENDAR_FIND_FREE_SLOTS", "GOOGLECALENDAR_QUICK_ADD", "GOOGLECALENDAR_FIND_EVENT", "GOOGLECALENDAR_DELETE_EVENT"],
    })
    return calendarTools;
}