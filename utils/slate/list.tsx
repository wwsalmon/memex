import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Editor, Node, Transforms} from "slate";
import insertEmptyLine from "./insertEmptyLine";
import {KeyboardEvent} from "react";

export const onShortcutSpaceList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    if (isList) {
        // get current block
        const block = Editor.above(editor, {
            // @ts-ignore
            match: n => isListNode(Editor.isBlock(editor, n) && n.type),
        });

        if (block) {
            // @ts-ignore
            const currType = block[0].type;

            // if already in the correct block, don't double-nest
            if (currType === (isNumbered ? "ol" : "ul")) return false;

            // if in the opposite type of list, unwrap first
            if (currType === (isNumbered ? "ul" : "ol")) {
                Transforms.unwrapNodes(editor, {
                    match: n =>
                        
                        
                        // @ts-ignore
                        n.type === (isNumbered ? "ul" : "ol"),
                    split: true,
                });
            }
        }

        const list = {
            type: (isNumbered ? "ol" : "ul"),
            children: [],
        };

        Transforms.wrapNodes(editor, list, {
            match: n =>
                
                
                // @ts-ignore
                n.type === (isNumbered ? "numbered-li" : "li"),
        });
    }
}

export const onDeleteBackwardsList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    // @ts-ignore
    if (isList) {
        Transforms.unwrapNodes(editor, {
            // @ts-ignore
            match: n => n.type === (isNumbered ? "ol" : "ul"),
            split: true,
        });
    }

    // @ts-ignore
    const thisLevels = Editor.levels(editor, {match: n => isListNode(n.type), reverse: true});
    const level1 = thisLevels.next();

    // @ts-ignore
    return level1.value && level1.value.length && isListNode(level1.value[0].type);
}

export const onEnterList = (editor: ReactEditor & HistoryEditor) => {
    const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
    });

    if (!block) return false;

    // @ts-ignore
    const type = block[0].type;

    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);

    if (!isList) return false;

    // @ts-ignore
    if (selectedLeaf.text.length === editor.selection.anchor.offset) {
        // if empty li
        // @ts-ignore
        if (block[0].children && block[0].children.length && block[0].children[0].text === "") {
            Transforms.unwrapNodes(editor, {
                match: n =>
                    
                    
                    // @ts-ignore
                    n.type === (isNumbered ? "ol" : "ul"),
                split: true,
            });

            // @ts-ignore
            Transforms.setNodes(editor, {type: "p"});

            return true;
        }

        insertEmptyLine(editor, isNumbered ? "numbered-li" : "li");
    } else {
        Transforms.splitNodes(editor);
    }

    return true;
}

export const onTabList = (e: KeyboardEvent<HTMLDivElement>, editor: ReactEditor & HistoryEditor) => {
    if (e.key !== "Tab") return false;

    const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
    });

    if (!block) return false;

    // @ts-ignore
    const type = block[0].type;

    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    if (!isList) return false;

    e.preventDefault();

    // @ts-ignore
    const thisLevels = Editor.levels(editor, {match: n => isListNode(n.type), reverse: true});
    const level1 = thisLevels.next();
    const level2 = thisLevels.next();

    if (e.shiftKey) {
        // @ts-ignore
        const isLevel2List = level2.value && level2.value.length && isListNode(level2.value[0].type);

        // if no ul two levels up then you can't unwrap
        if (!isLevel2List) {
            return false;
        }

        Transforms.unwrapNodes(editor, {
            match: n =>
                
                
                // @ts-ignore
                n.type === (isNumbered ? "ol" : "ul"),
            split: true,
        })
    } else {
        // @ts-ignore
        const level1Children = level1.value && level1.value.length && level1.value[0].children;

        // if parent has only one list item child then can't wrap
        if (level1Children.filter(d => ["li", "numbered-li"].includes(d.type)).length === 1) {
            return false;
        }

        // merge with adjacent lists if they exist
        const thisPath = editor.selection.anchor.path;
        const thisIndex = thisPath[thisPath.length - 2];
        const parentNode = Editor.node(editor, thisPath.slice(0, thisPath.length - 2))[0];
        const prevNode = thisIndex === 0 ? null : Editor.node(editor, [...thisPath.slice(0, thisPath.length - 2), thisIndex - 1]);
        // @ts-ignore
        const isPrevList = prevNode && isListNode(prevNode[0].type);
        // @ts-ignore
        const nextNode = (parentNode.children.length > thisIndex + 1) && Editor.node(editor, [...thisPath.slice(0, thisPath.length - 2), thisIndex + 1]);
        // @ts-ignore
        const isNextList = nextNode && isListNode(nextNode[0].type);

        if (isPrevList) {
            const thisNodePath = thisPath.slice(0, thisPath.length - 1);
            // @ts-ignore
            const toPath = [...thisPath.slice(0, thisPath.length - 2), thisIndex - 1, prevNode[0].children.length];

            Transforms.moveNodes(editor, {match: (node, path) => JSON.stringify(path) === JSON.stringify(thisNodePath), to: toPath});

            if (isNextList) {
                const nextNodePath = [...thisPath.slice(0, thisPath.length - 2), thisIndex];

                // mergeNodes seems like a more direct way to do what I'm trying to but for now we'll go with the jank solution below
                // Transforms.mergeNodes(editor, {
                //     at: nextNodePath,
                //     match: (node, path) => JSON.stringify(path) === JSON.stringify(nextNodePath),
                // });

                Transforms.moveNodes(editor, {
                    at: nextNodePath,
                    match: (node, path) => JSON.stringify(path.slice(0, path.length - 1)) === JSON.stringify(nextNodePath),
                    to: [...toPath.slice(0, toPath.length - 1), toPath[toPath.length - 1] + 1],
                });

                Transforms.removeNodes(editor, {
                    at: nextNodePath,
                    match: (node, path) => JSON.stringify(path) === JSON.stringify(nextNodePath),
                });
            }
        } else if (isNextList) {
            const thisNodePath = thisPath.slice(0, thisPath.length - 1);
            // @ts-ignore
            const toPath = [...thisPath.slice(0, thisPath.length - 2), thisIndex + 1, 0];

            Transforms.moveNodes(editor, {match: (node, path) => JSON.stringify(path) === JSON.stringify(thisNodePath), to: toPath});
        } else {
            const list = {
                type: (isNumbered ? "ol" : "ul"),
                children: [],
            };

            // @ts-ignore
            Transforms.wrapNodes(editor, list, {
                // @ts-ignore
                match: n => n.type === (isNumbered ? "numbered-li" : "li"),
            });
        }

    }

    return true;
}

export const isListNode = (type: string) => ["ul", "ol"].includes(type);