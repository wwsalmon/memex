import {Editable, withReact, useSlate, Slate, ReactEditor} from "slate-react";
import {
    Editor,
    Transforms,
    createEditor,
    Descendant,
    Element as SlateElement,
    Range,
    Point,
} from "slate";
import {HistoryEditor, withHistory} from "slate-history";
import {useCallback, useEffect, useMemo, useState} from "react";
import isHotkey from "is-hotkey";
import Button from "./Button";

export default function SlateEditor({}: {}) {
    const [editor] = useState<ReactEditor & HistoryEditor>(withShortcuts(withHistory(withReact(createEditor()))));
    const renderElement = useCallback(props => <Element {...props} />, []);
    const renderLeaf = useCallback(props => <Leaf {...props} />, []);
    const [value, setValue] = useState<Descendant[]>([
        {
            type: "paragraph",
            children: [{text: ""}],
        },
    ]);

    return (
        <div className="prose" style={{fontSize: 20}}>
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
    "mod+alt+1": "heading-one",
    "mod+alt+2": "heading-two",
    "mod+alt+3": "heading-three",
    "mod+alt+4": "heading-four",
};

const mdShortcuts = {
    "*": "list-item",
    "-": "list-item",
    "+": "list-item",
    ">": "block-quote",
    "#": "heading-one",
    "##": "heading-two",
    "###": "heading-three",
    "####": "heading-four",
    "#####": "heading-five",
    "######": "heading-six",
    "1.": "numbered-list-item",
};

type BulletedListElement = {
    type: "bulleted-list",
    children: Descendant[],
}

type NumberedListElement = {
    type: "numbered-list",
    children: Descendant[],
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
                    type,
                };
                Transforms.setNodes(editor, newProperties, {
                    match: n => Editor.isBlock(editor, n),
                });

                if (type === "list-item") {
                    const list: BulletedListElement = {
                        type: "bulleted-list",
                        children: [],
                    };
                    Transforms.wrapNodes(editor, list, {
                        match: n =>
                            !Editor.isEditor(n) &&
                            SlateElement.isElement(n) &&
                            n.type === "list-item",
                    });
                }

                if (type === "numbered-list-item") {
                    const list: NumberedListElement = {
                        type: "numbered-list",
                        children: [],
                    };
                    Transforms.wrapNodes(editor, list, {
                        match: n =>
                            !Editor.isEditor(n) &&
                            SlateElement.isElement(n) &&
                            n.type === "numbered-list-item",
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
                    block.type !== "paragraph" &&
                    Point.equals(selection.anchor, start)
                ) {
                    const newProperties: Partial<SlateElement> = {
                        type: "paragraph",
                    };
                    Transforms.setNodes(editor, newProperties);

                    if (block.type === "list-item") {
                        Transforms.unwrapNodes(editor, {
                            match: n =>
                                !Editor.isEditor(n) &&
                                SlateElement.isElement(n) &&
                                n.type === "bulleted-list",
                            split: true,
                        });
                    }

                    if (block.type === "numbered-list-item") {
                        Transforms.unwrapNodes(editor, {
                            match: n =>
                                !Editor.isEditor(n) &&
                                SlateElement.isElement(n) &&
                                n.type === "numbered-list",
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
            "heading-one": "H1",
            "heading-two": "H2",
            "heading-three": "H3",
            "heading-four": "H4",
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
    const isList = ["bulleted-list", "numbered-list"].includes(format);

    Transforms.unwrapNodes(editor, {
        match: n =>
            ["bulleted-list", "numbered-list"].includes(
                !Editor.isEditor(n) && SlateElement.isElement(n) && n.type
            ),
        split: true,
    });
    const newProperties: Partial<SlateElement> = {
        type: isActive ? "paragraph" : isList ? "list-item" : format,
    };
    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
        const block = {type: format, children: []};
        Transforms.wrapNodes(editor, block);
    }
};

const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
        match: n =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    });

    return !!match;
};

const Element = ({attributes, children, element}) => {
    switch (element.type) {
        case "block-quote":
            return <blockquote {...attributes}>{children}</blockquote>;
        case "bulleted-list":
            return <ul {...attributes}>{children}</ul>;
        case "heading-one":
            return <h1 {...attributes}>{children}</h1>;
        case "heading-two":
            return <h2 {...attributes}>{children}</h2>;
        case "heading-three":
            return <h3 {...attributes}>{children}</h3>;
        case "heading-four":
            return <h4 {...attributes}>{children}</h4>;
        case "list-item":
            return <li {...attributes}>{children}</li>;
        case "numbered-list-item":
            return <li {...attributes}>{children}</li>;
        case "numbered-list":
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