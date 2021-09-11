export default function Badge(props: React.HTMLProps<HTMLDivElement>) {
    let newProps = {...props};
    delete newProps.className;

    return (
        <div
            className={"w-6 h-6 bg-purple-300 rounded-md text-white flex items-center justify-center font-medium " + props.className}
            {...newProps}
        >
            {props.children}
        </div>
    );
}