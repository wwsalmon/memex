export default function Badge(props: React.HTMLProps<HTMLDivElement> & {bgClass?: string}) {
    let newProps = {...props};
    delete newProps.className;
    delete newProps.bgClass;

    return (
        <div
            className={"w-6 h-6 rounded-md text-white flex items-center justify-center font-medium " + (props.bgClass || "bg-purple-300") + " " + (props.className || "")}
            {...newProps}
        >
            {props.children}
        </div>
    );
}