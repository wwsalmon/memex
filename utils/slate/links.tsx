import isUrl from "is-url";
import {Editor, Element as SlateElement, Range, Transforms,} from "slate";
import {SlateNode} from "../types";
import {useEffect, useRef, useState} from "react";
import {ReactEditor, useSlate} from "slate-react";
import ReactDOM from "react-dom";

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

const getActiveLink = editor => {
    // @ts-ignore
    const [link] = Editor.nodes(editor, {
        match: n =>
            // @ts-ignore
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "a",
    });
    return link;
};

const unwrapLink = editor => {
    Transforms.unwrapNodes(editor, {
        match: n =>
            // @ts-ignore
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "a",
    });
};

const wrapLink = (editor, url) => {
    const activeLink = getActiveLink(editor);

    if (!!activeLink) {
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

export const SlateLinkBalloon = () => {
    const ref = useRef<HTMLDivElement | null>();
    const editor = useSlate();

    const [link, setLink] = useState<string>("");

    useEffect(() => {
        const el = ref.current;
        const {selection} = editor;
        const activeLink = getActiveLink(editor);

        if (!el) {
            return;
        }

        if (
            !selection ||
            !ReactEditor.isFocused(editor as ReactEditor) ||
            !activeLink
        ) {
            el.removeAttribute("style");
            return;
        }

        setLink(activeLink[0].url);
        const domSelection = window.getSelection();
        const domRange = domSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();
        el.style.opacity = "1";
        el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 8}px`;
        el.style.left = `${rect.left +
        window.pageXOffset -
        el.offsetWidth / 2 +
        rect.width / 2}px`;
    }, [ref.current, editor.selection]);

    return (
        <Portal>
            <div ref={ref} className="absolute transition-all bg-gray-100 p-2 rounded shadow-md">
                <a href={link}>{link}</a>
            </div>
        </Portal>
    );
}

const Portal = ({ children }) => {
    return typeof document === 'object'
        ? ReactDOM.createPortal(children, document.body)
        : null
}