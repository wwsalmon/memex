import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Editor, Element as SlateElement, Transforms} from "slate";
import {BulletedListElement, NumberedListElement} from "./shortcuts";
import insertEmptyLine from "./insertEmptyLine";

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

export const onEnterEOLList = (editor: ReactEditor & HistoryEditor) => {
    const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
    });

    if (!block) return false;

    // @ts-ignore
    const type = block[0].type;

    console.log(block[0]);

    // if type is li then insert another li, if the li is empty then break out of the larger ul
    if (type === "li") {
        // if empty li
        // @ts-ignore
        if (block[0].children && block[0].children.length && block[0].children[0].text === "") {
            Transforms.unwrapNodes(editor, {
                match: n =>
                    !Editor.isEditor(n) &&
                    SlateElement.isElement(n) &&
                    // @ts-ignore
                    n.type === "ul",
                split: true,
            });

            // @ts-ignore
            Transforms.setNodes(editor, {type: "p"});

            return true;
        }

        insertEmptyLine(editor, "li");

        return true;
    } else {
        return false;
    }
}