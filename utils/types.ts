export interface NodeObj {
    urlName: string,
    body: string,
    type: NoteObjTypeOpts,
    title?: string,
    image?: string,
}

type NoteObjTypeOpts = "note" | "bucket" | "timeline" | "blog" | "comment" | "user";

export interface ParentLinkObj {
    parentId: string,
    childId: string,
    primary: boolean,
}

// generic / type alias from https://stackoverflow.com/questions/26652179/extending-interface-with-generic-in-typescript
export type DatedObj<T extends {}> = T & {
    _id: string,
    createdAt: string, // ISO date
    updatedAt: string, // ISO date
}

export type IdObj<T extends {}> = T & {
    _id: string,
}