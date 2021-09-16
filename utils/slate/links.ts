import isUrl from "is-url";
import {Editor, Element as SlateElement, Range, Transforms,} from "slate";
import {SlateNode} from "../types";

export const withLinks = editor => {
    const {insertData, insertText, isInline} = editor;

    editor.isInline = element => {
        return element.type === "a" ? true : isInline(element);
    };

    editor.insertText = text => {
        if (text && isUrl(text)) {
            wrapLink(editor, text);
        } else {
            insertText(text);
        }
    };

    editor.insertData = data => {
        const text = data.getData("text/plain");

        if (text && isUrl(text)) {
            wrapLink(editor, text);
        } else {
            insertData(data);
        }
    };

    return editor;
};

export const insertLink = (editor, url) => {
    if (editor.selection) {
        wrapLink(editor, url);
    }
};

const isLinkActive = editor => {
    // @ts-ignore
    const [link] = Editor.nodes(editor, {
        match: n =>
            // @ts-ignore
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "a",
    });
    return !!link;
};

const unwrapLink = editor => {
    Transforms.unwrapNodes(editor, {
        match: n =>
            // @ts-ignore
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "a",
    });
};

const wrapLink = (editor, url) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor);
    }

    const {selection} = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link: SlateNode & { url: string } = {
        type: "a",
        url,
        children: isCollapsed ? [{text: url}] : [],
    };

    if (isCollapsed) {
        Transforms.insertNodes(editor, link);
    } else {
        Transforms.wrapNodes(editor, link, {split: true});
        Transforms.collapse(editor, {edge: "end"});
    }
};