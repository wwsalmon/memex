import {KeyboardEvent} from "react";
import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Transforms, Node} from "slate";
import {onEnterList} from "./list";
import insertEmptyLine from "./insertEmptyLine";

export const onEnter = (e: KeyboardEvent<HTMLDivElement>, editor: ReactEditor & HistoryEditor) => {
    if (e.key !== "Enter") return false;
    e.preventDefault();
    if (e.shiftKey) {
        editor.insertText("\n");
    } else {
        if (onEnterList(editor)) return true;

        const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);

        // @ts-ignore
        if (selectedLeaf.text.length === editor.selection.anchor.offset) {
            insertEmptyLine(editor);
        } else {
            Transforms.splitNodes(editor);
            // @ts-ignore
            Transforms.setNodes(editor, {type: "p"});
        }
    }
    return true;
};