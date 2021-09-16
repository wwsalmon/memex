import {DatedObj, ParentLinkObj} from "./types";

export function getLinkChain(startId: string, nodeLinks: DatedObj<ParentLinkObj>[]) {
    const thisLink = nodeLinks.find(d => d.childId === startId && d.primary === true && d.parentId !== process.env.NEXT_PUBLIC_GENESIS_ID);
    if (!thisLink) return [];
    return [thisLink, ...getLinkChain(thisLink.parentId, nodeLinks)];
}   