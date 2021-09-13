import {Editable, ReactEditor, Slate, withReact} from "slate-react";
import {createEditor, Editor, Element as SlateElement, Point, Range, Transforms,} from "slate";
import {HistoryEditor, withHistory} from "slate-history";
import {Dispatch, SetStateAction, useCallback, useState} from "react";
import isHotkey from "is-hotkey";
import Button from "./Button";
import {SlateNode} from "../utils/types";

export default function SlateEditor({value, setValue}: {
    value: SlateNode[],
    setValue: Dispatch<SetStateAction<SlateNode[]>>
}) {
    const [editor] = useState<ReactEditor & HistoryEditor>(withShortcuts(withHistory(withReact(createEditor() as ReactEditor))));
    const renderElement = useCallback(props => <Element {...props} />, []);
    const renderLeaf = useCallback(props => <Leaf {...props} />, []);

    return (
        <div className="prose" style={{fontSize: 20}}>
            {/* @ts-ignore */}
            <Slate editor={editor} value={value} onChange={value => setValue(value)}>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="Capture your thoughts"
                    spellCheck
                    autoFocus
                    onKeyDown={event => {
                        for (const hotkey in markHotkeys) {
                            if (isHotkey(hotkey, event as any)) {
                                event.preventDefault();
                                const mark = markHotkeys[hotkey];
                                toggleMark(editor, mark);
                            }
                        }

                        for (const hotkey in blockHotkeys) {
                            if (isHotkey(hotkey, event as any)) {
                                event.preventDefault();
                                const block = blockHotkeys[hotkey];
                                toggleBlock(editor, block);
                            }
                        }
                    }}
                />
            </Slate>
        </div>
    );
}

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
};

type BulletedListElement = {
    type: "ul",
    children: SlateNode[],
}

type NumberedListElement = {
    type: "ol",
    children: SlateNode[],
}

const withShortcuts = editor => {
    const {deleteBackward, insertText} = editor;

    editor.insertText = text => {
        const {selection} = editor;

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
                    if (block.type === "li") {
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
                    if (block.type === "numbered-li") {
                        Transforms.unwrapNodes(editor, {
                            match: n =>
                                !Editor.isEditor(n) &&
                                SlateElement.isElement(n) &&
                                // @ts-ignore
                                n.type === "ol",
                            split: true,
                        });
                    }

                    return;
                }
            }

            deleteBackward(...args);
        }
    };

    return editor;
};

const BlockButton = ({editor, format}: { editor: ReactEditor & HistoryEditor, format: string }) => (
    <Button
        className={`p-1 mx-1 rounded text-base ${isBlockActive(editor, format) ? "bg-gray-100 border" : ""}`}
        onMouseDown={e => {
            e.preventDefault();
            toggleBlock(editor, format);
        }}
    >
        {{
            "h1": "H1",
            "h2": "H2",
            "h3": "H3",
            "h4": "H4",
        }[format]}
    </Button>
);

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
        type: isActive ? "p" : isList ? "li" : format,
    };
    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
        const block = {type: format, children: []};
        Transforms.wrapNodes(editor, block);
    }
};

const isBlockActive = (editor, format) => {
    // @ts-ignore
    const [match] = Editor.nodes(editor, {
        match: n =>
            // @ts-ignore
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    });

    return !!match;
};

const Element = ({attributes, children, element}) => {
    switch (element.type) {
        case "blockquote":
            return <blockquote {...attributes}>{children}</blockquote>;
        case "ul":
            return <ul {...attributes}>{children}</ul>;
        case "h1":
            return <h1 {...attributes}>{children}</h1>;
        case "h2":
            return <h2 {...attributes}>{children}</h2>;
        case "h3":
            return <h3 {...attributes}>{children}</h3>;
        case "h4":
            return <h4 {...attributes}>{children}</h4>;
        case "li":
            return <li {...attributes}>{children}</li>;
        case "numbered-li":
            return <li {...attributes}>{children}</li>;
        case "ol":
            return <ol {...attributes}>{children}</ol>;
        default:
            return <p {...attributes}>{children}</p>;
    }
};

const Leaf = ({attributes, children, leaf}) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.code) {
        children = <code>{children}</code>;
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
};