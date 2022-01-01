import {Editor, Element as SlateElement, Point, Range, Transforms} from "slate";
import {SlateNode} from "../types";
import {onShortcutDeleteBackwardsList, onShortcutSpaceList} from "./list";

export type BulletedListElement = {
    type: "ul",
    children: SlateNode[],
}

export type NumberedListElement = {
    type: "ol",
    children: SlateNode[],
}

const mdShortcuts = {
    "*": "li",
    "-": "li",
    "+": "li",
    ">": "blockquote",
    "#": "h1",
    "##": "h2",
    "###": "h3",
    "####": "h4",
    "#####": "heading-five",
    "######": "heading-six",
    "1.": "numbered-li",
    "```": "codeblock",
};

export const withShortcuts = editor => {
    const {deleteBackward, insertText} = editor;

    editor.insertText = text => {
        const {selection} = editor;

        // if inserting space and cursor is collapsed
        if (text === " " && selection && Range.isCollapsed(selection)) {
            const {anchor} = selection;
            const block = Editor.above(editor, {
                match: n => Editor.isBlock(editor, n),
            });
            const path = block ? block[1] : [];
            const start = Editor.start(editor, path);
            const range = {anchor, focus: start};
            const beforeText = Editor.string(editor, range);
            const type = mdShortcuts[beforeText];

            if (type) {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                const newProperties: Partial<SlateElement> = {
                    // @ts-ignore
                    type,
                };
                Transforms.setNodes(editor, newProperties, {
                    match: n => Editor.isBlock(editor, n),
                });

                onShortcutSpaceList(editor, type);

                return;
            }
        }

        insertText(text);
    };

    editor.deleteBackward = (...args) => {
        const {selection} = editor;

        if (selection && Range.isCollapsed(selection)) {
            const match = Editor.above(editor, {
                match: n => Editor.isBlock(editor, n),
            });

            if (match) {
                const [block, path] = match;
                const start = Editor.start(editor, path);

                if (
                    !Editor.isEditor(block) &&
                    SlateElement.isElement(block) &&
                    // @ts-ignore
                    block.type !== "p" &&
                    Point.equals(selection.anchor, start)
                ) {
                    const newProperties: Partial<SlateElement> = {
                        // @ts-ignore
                        type: "p",
                    };
                    Transforms.setNodes(editor, newProperties);

                    // @ts-ignore
                    onShortcutDeleteBackwardsList(editor, block.type);

                    return;
                }
            }

            deleteBackward(...args);
        }
    };

    return editor;
};