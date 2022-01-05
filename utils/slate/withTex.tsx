import {CustomEditor} from "./slate-types";
import {Editor, Element, Node, Point, Range, Transforms} from "slate";

const withTex = (editor: CustomEditor) => {
    const {insertText, isInline, normalizeNode} = editor;

    editor.isInline = (element) => {
        return element.type === "inlineTex" || isInline(element);
    }

    editor.insertText = (text) => {
        const {selection} = editor;
        const {anchor} = selection;
        const {path, offset} = anchor;

        if (offset > 0 && text === " " && selection && Range.isCollapsed(selection)) {
            const range = {anchor, focus: {path: path, offset: offset - 1}};
            const beforeText = Editor.string(editor, range);

            if (beforeText === "$") {
                const block = Editor.above(editor, {
                    match: n => Editor.isBlock(editor, n),
                });

                if (Element.isElement(block[0]) && block[0].type !== "inlineTex") {
                    Transforms.select(editor, range);
                    Transforms.delete(editor);
                    Transforms.insertNodes(editor, [{type: "inlineTex", children: [{text: "  "}]}]);
                    const thisPoint = {path: editor.selection.anchor.path, offset: 1};
                    Transforms.select(editor, {anchor: thisPoint, focus: thisPoint});

                    return;
                }
            }
        }

        insertText(text);
    }

    editor.normalizeNode = (entry) => {
        if (Element.isElement(entry[0]) && entry[0].type === "inlineTex") {
            const thisLeaf = Editor.leaf(editor, editor.selection.anchor.path);
            const thisText = thisLeaf[0].text;

            if (thisText.charAt(0) !== " ") {
                Transforms.insertText(editor, " ", {at: {path: thisLeaf[1], offset: 0}});
                const thisPoint = {path: thisLeaf[1], offset: 1};
                Transforms.select(editor, thisPoint);
                return;
            }

            if (thisText.charAt(Math.max(thisText.length - 1, 1)) !== " ") {
                Transforms.insertText(editor, " ", {at: {path: thisLeaf[1], offset: thisText.length}});
                const thisPoint = {path: thisLeaf[1], offset: thisText.length};
                Transforms.select(editor, thisPoint);
                return;
            }
        }

        normalizeNode(entry);
    }

    return editor;
};

export default withTex;