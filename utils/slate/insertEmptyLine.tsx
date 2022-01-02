import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Transforms} from "slate";

export default function insertEmptyLine(editor: ReactEditor & HistoryEditor, type?: string) {
    const newLine = {
        type: type || "p",
        children: [{text: ""}],
    };

    Transforms.insertNodes(editor, newLine);
}