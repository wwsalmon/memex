import {NodeObjTypeOpts} from "./types";

const getLetterFromType = (type: NodeObjTypeOpts) => ({
    timeline: "T",
    blog: "L",
    note: "N",
    bucket: "B",
}[type]);

export default getLetterFromType;