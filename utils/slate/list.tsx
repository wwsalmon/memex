import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Editor, Element as SlateElement, Transforms} from "slate";
import insertEmptyLine from "./insertEmptyLine";

export const onShortcutSpaceList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    if (isList) {
        const list = {
            type: (isNumbered ? "ol" : "ul"),
            children: [],
        };

        Transforms.wrapNodes(editor, list, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === (isNumbered ? "numbered-li" : "li"),
        });
    }
}

export const onShortcutDeleteBackwardsList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    // @ts-ignore
    if (isList) {
        Transforms.unwrapNodes(editor, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === (isNumbered ? "ol" : "ul"),
            split: true,
        });
    }
}

export const onEnterEOLList = (editor: ReactEditor & HistoryEditor) => {
    const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
    });

    if (!block) return false;

    // @ts-ignore
    const type = block[0].type;

    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    // if type is li then insert another li, if the li is empty then break out of the larger ul
    if (isList) {
        // if empty li
        // @ts-ignore
        if (block[0].children && block[0].children.length && block[0].children[0].text === "") {
            Transforms.unwrapNodes(editor, {
                match: n =>
                    !Editor.isEditor(n) &&
                    SlateElement.isElement(n) &&
                    // @ts-ignore
                    n.type === (isNumbered ? "ol" : "ul"),
                split: true,
            });

            // @ts-ignore
            Transforms.setNodes(editor, {type: "p"});

            return true;
        }

        insertEmptyLine(editor, isNumbered ? "numbered-li" : "li");

        return true;
    } else {
        return false;
    }
}