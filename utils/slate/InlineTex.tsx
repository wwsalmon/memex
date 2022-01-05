import {ReactNode} from "react";
import {useFocused, useSelected} from "slate-react";
import {InlineMath} from "react-katex";
import {CustomElement} from "./slate-types";
import {Node} from "slate";

export default function InlineTex({attributes, children, element}: {attributes: any, children: ReactNode, element: CustomElement}) {
    const focused = useFocused();
    const selected = useSelected();
    const showSource = focused && selected;

    const math = Node.string(element);

    let spanProps = {
        ...attributes,
        className: "border p-1 " + (showSource ? "border-red-500" : "border-green-500"),
    };

    if (!showSource) spanProps["contentEditable"] = false;

    return (
        <span {...spanProps}>
            {showSource ? (
                children
            ) : (
                <span contentEditable={false}>
                    <InlineMath math={math || "\\LaTeX"}/>
                </span>
            )}
        </span>
    );
}