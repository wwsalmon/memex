import {Descendant} from "slate";

export default function slateWordCount(body: Descendant[]) {
    let length = 0;
    if (!body || !body.length) return 0;
    for (let node of body) {
        if (node.text) length += node.text.split(/\b\W+\b/).length;
        else length += slateWordCount(node.children);
    }
    return length;
}