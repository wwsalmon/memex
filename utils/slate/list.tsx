import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Editor, Node, Path, Point, Transforms} from "slate";
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
                    // @ts-ignore
                    match: n => n.type === (isNumbered ? "ul" : "ol"),
                    split: true,
                });
            }
        }

        indentListItem(editor);
    }
}

export const onDeleteBackwardsList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    if (!isList) return false;

    const thisPath = editor.selection.anchor.path;
    const thisIndex = thisPath[thisPath.length - 2];

    // if first item in list, unwrap and handle normally; else merge with item above
    if (thisIndex === 0) {
        // @ts-ignore
        const thisLevels = Editor.levels(editor, {match: n => isListNode(n.type), reverse: true});
        const level1 = thisLevels.next();
        const level2 = thisLevels.next();
        // @ts-ignore
        const level1Islist = level1.value && level1.value.length && isListNode(level1.value[0].type);
        // @ts-ignore
        const level2IsList = level2.value && level2.value.length && isListNode(level2.value[0].type);

        // attempt to un-indent the item
        // @ts-ignore
        unIndentListItem(editor);

        // if not nested item, unwrap the item
        if (!level2IsList) {
            // @ts-ignore
            Transforms.unwrapNodes(editor, {match: n => isListNode(n.type), split: true});
        }

        return level2IsList;
    } else {
        const thisNodePath = thisPath.slice(0, thisPath.length - 1);
        const thisLeaf = Editor.leaf(editor, thisPath);

        // if empty list item in middle of list delete the block
        if (thisLeaf[0].text === "") {
            Transforms.removeNodes(editor, {at: thisNodePath});
            return true;
        }

        const prevNode = thisIndex === 0 ? null : Editor.node(editor, [...thisPath.slice(0, thisPath.length - 2), thisIndex - 1]);
        // @ts-ignore
        const isPrevList = prevNode && isListNode(prevNode[0].type);

        // if prevNode is list, merge with it; otherwise just return false
        if (isPrevList) {
            // @ts-ignore
            const toPath = [...thisPath.slice(0, thisPath.length - 2), thisIndex - 1, prevNode[0].children.length];

            Transforms.moveNodes(editor, {at: thisNodePath, to: toPath});
        } else {
            Transforms.mergeNodes(editor, {at: thisNodePath});
        }

        return true;
    }
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
                // @ts-ignore
                match: n => n.type === (isNumbered ? "ol" : "ul"),
                split: true,
            });

            // @ts-ignore
            const thisLevels = Editor.levels(editor, {match: n => isListNode(n.type), reverse: true});
            const level1 = thisLevels.next();

            // if parent after unwrapping is not list, turn the node into a p, otherwise keep it a list item
            // @ts-ignore
            if (!(level1.value && level1.value.length && isListNode(level1.value[0].type))) {
                // @ts-ignore
                Transforms.setNodes(editor, {type: "p"});
            }

            return true;
        }

        insertEmptyLine(editor, isNumbered ? "numbered-li" : "li");
    } else {
        // if at start of block
        if (Point.equals(editor.selection.anchor, Editor.start(editor, block[1]))) {
            insertEmptyLine(editor, isNumbered ? "numbered-li" : "li", block[1]);
        } else {
            Transforms.splitNodes(editor);
        }
    }

    return true;
}

export const onTabList = (e: KeyboardEvent<HTMLDivElement>, editor: ReactEditor & HistoryEditor) => {
    if (e.key !== "Tab") return false;

    const listType = getListItemType(editor);
    if (listType === false) return false;
    const isNumbered = listType.isNumbered;

    e.preventDefault();

    if (e.shiftKey) {
        return unIndentListItem(editor);
    } else {
        return indentListItem(editor);
    }
}

export const isListNode = (type: string) => ["ul", "ol"].includes(type);

const indentListItem = (editor: ReactEditor & HistoryEditor) => {
    const listType = getListItemType(editor);
    if (listType === false) return false;
    const isNumbered = listType.isNumbered;

    const thisPath = editor.selection.anchor.path;
    const thisIndex = thisPath[thisPath.length - 2];

    if (thisIndex === 0) return true;

    const list = {
        type: (isNumbered ? "ol" : "ul"),
        children: [],
    };

    // @ts-ignore
    Transforms.wrapNodes(editor, list, {
        // @ts-ignore
        match: n => n.type === (isNumbered ? "numbered-li" : "li"),
    });

    return true;
}

const unIndentListItem = (editor: ReactEditor & HistoryEditor, at?: Path) => {
    const listType = getListItemType(editor);
    if (listType === false) return false;
    const isNumbered = listType.isNumbered;

    let levelsOptions = {match: n => isListNode(n.type), reverse: true};
    if (at) levelsOptions["at"] = at;

    // @ts-ignore
    const thisLevels = Editor.levels(editor, levelsOptions);
    thisLevels.next();
    const level2 = thisLevels.next();

    // @ts-ignore
    const isLevel2List = level2.value && level2.value.length && isListNode(level2.value[0].type);

    // if no ul two levels up then you can't unwrap
    if (!isLevel2List) {
        return false;
    }

    let unwrapOptions = {
        // @ts-ignore
        match: n => n.type === (isNumbered ? "ol" : "ul"),
        split: true,
    }
    if (at) unwrapOptions["at"] = at;

    Transforms.unwrapNodes(editor, unwrapOptions);

    // un-indent following list if it exists
    const thisPath = at ? at : editor.selection.anchor.path;
    const thisIndex = thisPath[thisPath.length - 2];
    const parentNode = Editor.node(editor, thisPath.slice(0, thisPath.length - 2));
    // @ts-ignore
    const nextNode = (parentNode[0].children.length > thisIndex + 1) && Editor.node(editor, [...thisPath.slice(0, thisPath.length - 2), thisIndex + 1]);
    // @ts-ignore
    const isNextListStartsWithList = nextNode && isListNode(nextNode[0].type) && nextNode[0].children.length && isListNode(nextNode[0].children[0].type);

    if (isNextListStartsWithList) {
        Transforms.moveNodes(editor, {at: [...nextNode[1], 0], to: [...thisPath.slice(0, thisPath.length - 2), thisIndex + 1]});
    }

    return true;
}

export const withLists = (editor: ReactEditor & HistoryEditor) => {
    const {normalizeNode} = editor;

    editor.normalizeNode = (entry) => {
        const [thisNode, thisPath] = entry;

        // console.log("normalizing", thisPath, thisNode);

        // if element has children that are lists
        // @ts-ignore
        if ("children" in thisNode && thisNode.children.length && thisNode.children.some(d => isListNode(d.type))) {
            // console.log("has children lists");

            for (let childIndex in thisNode.children) {
                const thisChild = thisNode.children[childIndex];

                // console.log("is child list", childIndex);

                // @ts-ignore
                if (isListNode(thisChild.type)) {
                    // @ts-ignore
                    if ((+childIndex + 1) < thisNode.children.length) {
                        const nextChild = thisNode.children[+childIndex + 1];
                        // @ts-ignore
                        if (isListNode(nextChild.type)) {
                            // console.log("merging down");

                            Editor.withoutNormalizing(editor, () => {
                                const nextPath = [...thisPath, +childIndex + 1];
                                // @ts-ignore
                                const toPath = [...thisPath, +childIndex, thisChild.children.length];

                                Transforms.moveNodes(editor, {at: nextPath,
                                    match: (
                                        node,
                                        path
                                    ) => {
                                        const isMatch = JSON.stringify(path.slice(0, path.length - 1)) === JSON.stringify(nextPath);
                                        console.log(isMatch, path, nextPath);
                                        return isMatch;
                                    },
                                    to: toPath
                                });

                                Transforms.removeNodes(editor, {at: nextPath});

                                const entryToNormalize = Editor.node(editor, thisPath);

                                editor.normalizeNode(entryToNormalize);
                            });

                            return;
                        }
                    }

                    // first item in list can't be list
                    if (+childIndex === 0) {
                        unIndentListItem(editor, [...thisPath, +childIndex, 0]);

                        return;
                    }
                }
            }
        }

        normalizeNode(entry);
    }

    return editor;
}

const getListItemType = (editor: ReactEditor & HistoryEditor) => {
    const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
    });

    if (!block) return false;

    // @ts-ignore
    const type = block[0].type;

    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    if (!isList) return false;

    return {isNumbered};
}