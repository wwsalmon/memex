export default function H2(props: React.HTMLProps<HTMLHeadingElement>) {
    let newProps = {...props};
    delete newProps.className;

    return (
        <h2
            className={"font-bold " + props.className}
            {...props}
        >
            {props.children}
        </h2>
    );
}