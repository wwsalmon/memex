import {KeyboardEvent} from "react";
import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";

export const checkForSoftBreak = (e: KeyboardEvent<HTMLDivElement>, editor: ReactEditor & HistoryEditor) => {
    if (e.key !== "Enter" || !e.shiftKey) return false;
    e.preventDefault();
    editor.insertText("\n");
    return true;
};