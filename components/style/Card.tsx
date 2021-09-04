export default function Card(props: React.HTMLProps<HTMLDivElement>) {
    let newProps = {...props};
    delete newProps.className;

    return (
        <div
            className={"bg-white rounded-md shadow-sm p-4 hover:shadow-md transition cursor-pointer " + props.className}
            {...props}
        >
            {props.children}
        </div>
    );
}