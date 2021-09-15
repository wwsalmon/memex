import {DatedObj, ParentLinkObj} from "./types";

export function getLinkChain(startId: string, nodeLinks: DatedObj<ParentLinkObj>[]) {
    const thisLink = nodeLinks.find(d => d.childId === startId && d.primary === true);
    if (!thisLink) return [];
    return [thisLink, ...getLinkChain(thisLink.parentId, nodeLinks)];
}