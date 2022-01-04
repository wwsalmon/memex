import {CustomEditor} from "./slate-types";
import {Descendant, Editor, Element, Transforms} from "slate";
import {unified} from "unified";
import markdown from "remark-parse";
import slate from "remark-slate";

const withDeserializeMD = (editor: CustomEditor) => {
    const {insertData} = editor;

    editor.insertData = (data) => {
        // if in code block, don't deserialize anything, just insert
        const block = Editor.above(editor, {match: n => Editor.isBlock(editor, n)});
        const isCodeBlock = block && Element.isElement(block[0]) && block[0].type === "codeblock";
        if (isCodeBlock) return insertData(data);

        const content = data.getData("text/plain");
        if (content) {
            const fragment = unified()
                .use(markdown)
                .use(slate, {
                    nodeTypes: {
                        paragraph: "p",
                        block_quote: "blockquote",
                        link: "a",
                        image: "img",
                        code_block: "codeblock",
                        ul_list: "ul",
                        ol_list: "ol",
                        listItem: "li",
                        heading: {
                            1: "h1",
                            2: "h2",
                            3: "h3",
                            4: "h4",
                            5: "h5",
                            6: "h6",
                        },
                    },
                    linkDestinationKey: "href",
                })
                .processSync(content)
                .result as Descendant[];

            console.log(fragment);

            if (fragment.length) {
                return Transforms.insertNodes(editor, fragment);
            }
        }

        insertData(data);
    };

    return editor;
};

export default withDeserializeMD;