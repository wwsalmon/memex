import {NodeObjTypeOpts} from "./types";

const getLetterFromType = (type: NodeObjTypeOpts) => ({
    user: "U",
    timeline: "T",
    blog: "L",
    note: "N",
    bucket: "B",
}[type]);

export default getLetterFromType;