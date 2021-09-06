import Link from "next/link";

export default function Button(props: (
    React.HTMLProps<HTMLButtonElement> | React.HTMLProps<HTMLAnchorElement>)
    & {isLoading?: boolean, containerClassName?: string}) {
    const {href, isLoading, children, containerClassName} = props;

    return (
        <div className={`relative inline-block ${containerClassName || ""}`}>
            {href ? (
                <Link href={href}>
                    {/* @ts-ignore */}
                    <a {...props}>
                        <div className={isLoading ? "invisible" : ""}>
                            {children}
                        </div>
                    </a>
                </Link>
            ) : (
                // @ts-ignore
                <button {...props}>
                    <div className={isLoading ? "invisible" : ""}>
                        {children}
                    </div>
                </button>
            )}
            {isLoading && <div className="up-spinner"/>}
        </div>
    )
}