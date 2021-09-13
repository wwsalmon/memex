import Button, {ButtonProps} from "../Button";

export default function MainButton(props: ButtonProps & {color?: string}) {
    let newProps = {...props};
    delete newProps.className;

    const bgClass = {
        purple: "text-white bg-purple-500 hover:bg-purple-700",
        red: "text-white bg-red-500 hover:bg-red-700",
        white: "hover:bg-gray-50",
    }[props.color || "white"];

    return (
        <Button
            className={`py-2 px-3 rounded ${bgClass} text-sm hover:shadow-inner transition font-medium tracking-wide`}
            {...newProps}
        >
            {props.children}
        </Button>
    );
}