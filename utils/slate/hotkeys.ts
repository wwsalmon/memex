import {Editor, Element as SlateElement, Transforms} from "slate";
import isHotkey from "is-hotkey";
import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {KeyboardEvent} from "react";
import {insertLink} from "./link";

const markHotkeys = {
    "mod+b": "bold",
    "mod+i": "italic",
    "mod+u": "underline",
    "mod+`": "code",
};

const blockHotkeys = {
    "mod+alt+1": "h1",
    "mod+alt+2": "h2",
    "mod+alt+3": "h3",
    "mod+alt+4": "h4",
};

const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format);
    const isList = ["ul", "ol"].includes(format);

    Transforms.unwrapNodes(editor, {
        match: n =>
            ["ul", "ol"].includes(
                // @ts-ignore
                !Editor.isEditor(n) && SlateElement.isElement(n) && n.type
            ),
        split: true,
    });
    const newProperties: Partial<SlateElement> = {
        // @ts-ignore
        type: isActive ? "" : isList ? "li" : format,
    };
    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
        const block = {type: format, children: []};
        Transforms.wrapNodes(editor, block);
    }
};

export const isBlockActive = (editor, format) => {
    // @ts-ignore
    const [match] = Editor.nodes(editor, {
        match: n =>
            // @ts-ignore
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    });

    return !!match;
};

export const onHotkey = (e: KeyboardEvent<HTMLDivElement>, editor: ReactEditor & HistoryEditor) => {
    for (const hotkey in markHotkeys) {
        if (isHotkey(hotkey, e)) {
            event.preventDefault();
            const mark = markHotkeys[hotkey];
            toggleMark(editor, mark);
        }
    }

    for (const hotkey in blockHotkeys) {
        if (isHotkey(hotkey, e)) {
            event.preventDefault();
            const block = blockHotkeys[hotkey];
            toggleBlock(editor, block);
        }
    }

    if (isHotkey("mod+k", e)) {
        e.preventDefault();
        const url = window.prompt("Enter the URL of the link:");
        if (!url) return;
        insertLink(editor, url);
    }
}