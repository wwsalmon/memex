import {ReactNode} from "react";
import {useFocused, useSelected} from "slate-react";
import {BlockMath} from "react-katex";
import {CustomElement} from "./slate-types";
import {Node} from "slate";

export default function BlockTex({
                                      attributes,
                                      children,
                                      element
                                  }: { attributes: any, children: ReactNode, element: CustomElement }) {
    const focused = useFocused();
    const selected = useSelected();
    const showSource = focused && selected;

    const math = Node.string(element);

    const isEmpty = math === "";

    let divProps = {
        ...attributes,
        className: "relative px-1 " + (showSource ? "border border-gray-300 font-mono text-sm py-2 text-center " : (isEmpty ? "opacity-25" : "")),
    };

    if (!showSource) divProps["contentEditable"] = false;

    return (
        <div {...divProps}>
            {showSource ? (
                <>
                    {children}
                    <div
                        contentEditable={false}
                        className="absolute select-none bg-gray-100 top-0 border border-gray-300 font-bold"
                        style={{fontSize: 8, paddingLeft: 2, paddingRight: 2, transform: "translateY(-100%)", left: -1}}
                    >
                        <span>LaTeX</span>
                    </div>
                </>
            ) : (
                <BlockMath math={isEmpty ? "\\LaTeX" : math}/>
            )}
        </div>
    );
}