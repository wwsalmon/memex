import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Editor, Element as SlateElement, Transforms} from "slate";
import {BulletedListElement, NumberedListElement} from "./shortcuts";

export const onShortcutSpaceList = (editor: ReactEditor & HistoryEditor, type: string) => {
    if (type === "li") {
        const list: BulletedListElement = {
            type: "ul",
            children: [],
        };
        Transforms.wrapNodes(editor, list, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === "li",
        });
    }

    if (type === "numbered-li") {
        const list: NumberedListElement = {
            type: "ol",
            children: [],
        };
        Transforms.wrapNodes(editor, list, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === "numbered-li",
        });
    }
}

export const onShortcutDeleteBackwardsList = (editor: ReactEditor & HistoryEditor, type: string) => {
    // @ts-ignore
    if (type === "li") {
        Transforms.unwrapNodes(editor, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === "ul",
            split: true,
        });
    }

    // @ts-ignore
    if (type === "numbered-li") {
        Transforms.unwrapNodes(editor, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === "ol",
            split: true,
        });
    }
}