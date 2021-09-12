import {NodeObjTypeOpts} from "./types";

export const getLetterFromType = (type: NodeObjTypeOpts) => ({
    user: "U",
    timeline: "T",
    blog: "L",
    note: "N",
    bucket: "B",
}[type]);

export const getBgClassFromType = (type: NodeObjTypeOpts) => ({
    user: "bg-black",
    timeline: "bg-blue-300",
    blog: "bg-pink-300",
    note: "bg-gray-400",
    bucket: "bg-purple-300",
}[type]);