import {Editable, ReactEditor, Slate, withReact} from "slate-react";
import {createEditor} from "slate";
import {HistoryEditor, withHistory} from "slate-history";
import {Dispatch, SetStateAction, useCallback, useState} from "react";
import {SlateNode} from "../utils/types";
import {SlateLinkBalloon, withLinks} from "../utils/slate/links";
import {withShortcuts} from "../utils/slate/shortcuts";
import {onKeyDown} from "../utils/slate/hotkeys";
import {withCodeblocks} from "../utils/slate/codeblocks";
import {checkForSoftBreak} from "../utils/slate/softbreak";

export default function SlateEditor({value, setValue}: {
    value: SlateNode[],
    setValue: Dispatch<SetStateAction<SlateNode[]>>
}) {
    const [editor] = useState<ReactEditor & HistoryEditor>(withCodeblocks(withLinks(withShortcuts(withHistory(withReact(createEditor() as ReactEditor))))));
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
                        onKeyDown(event, editor);
                        checkForSoftBreak(event, editor);
                    }}
                />
                <SlateLinkBalloon/>
            </Slate>
        </div>
    );
}

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
        case "a":
            return <a {...attributes} href={element.url}>{children}</a>;
        case "codeblock":
            return <pre {...attributes}><code>{children}</code></pre>;
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