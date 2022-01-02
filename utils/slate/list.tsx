import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";
import {Editor, Element as SlateElement, Transforms} from "slate";
import insertEmptyLine from "./insertEmptyLine";
import {KeyboardEvent} from "react";

export const onShortcutSpaceList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    if (isList) {
        // get current block
        const block = Editor.above(editor, {
            // @ts-ignore
            match: n => ["ul", "ol"].includes(Editor.isBlock(editor, n) && SlateElement.isElement(n) && n.type),
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
                        !Editor.isEditor(n) &&
                        SlateElement.isElement(n) &&
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
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === (isNumbered ? "numbered-li" : "li"),
        });
    }
}

export const onShortcutDeleteBackwardsList = (editor: ReactEditor & HistoryEditor, type: string) => {
    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    // @ts-ignore
    if (isList) {
        Transforms.unwrapNodes(editor, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === (isNumbered ? "ol" : "ul"),
            split: true,
        });
    }
}

export const onEnterEOLList = (editor: ReactEditor & HistoryEditor) => {
    const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
    });

    if (!block) return false;

    // @ts-ignore
    const type = block[0].type;

    const isList = type === "li" || type === "numbered-li";
    const isNumbered = type === "numbered-li";

    // if type is li then insert another li, if the li is empty then break out of the larger ul
    if (isList) {
        // if empty li
        // @ts-ignore
        if (block[0].children && block[0].children.length && block[0].children[0].text === "") {
            Transforms.unwrapNodes(editor, {
                match: n =>
                    !Editor.isEditor(n) &&
                    SlateElement.isElement(n) &&
                    // @ts-ignore
                    n.type === (isNumbered ? "ol" : "ul"),
                split: true,
            });

            // @ts-ignore
            Transforms.setNodes(editor, {type: "p"});

            return true;
        }

        insertEmptyLine(editor, isNumbered ? "numbered-li" : "li");

        return true;
    } else {
        return false;
    }
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
    const thisLevels = Editor.levels(editor, {match: n => ["ul", "ol", "li", "numbered-li"].includes(n.type), reverse: true});
    thisLevels.next();
    const level1 = thisLevels.next();
    const level2 = thisLevels.next();

    if (e.shiftKey) {
        // @ts-ignore
        const isLevel2List = level2.value && level2.value.length && ["ul", "ol"].includes(level2.value[0].type);

        // if no ul two levels up then you can't unwrap
        if (!isLevel2List) {
            return false;
        }

        Transforms.unwrapNodes(editor, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
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

        const list = {
            type: (isNumbered ? "ol" : "ul"),
            children: [],
        };

        // @ts-ignore
        Transforms.wrapNodes(editor, list, {
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === (isNumbered ? "numbered-li" : "li"),
        });
    }

    return true;
}