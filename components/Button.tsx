import Link from "next/link";

export type ButtonProps = (React.HTMLProps<HTMLButtonElement> | React.HTMLProps<HTMLAnchorElement>)
& {isLoading?: boolean, containerClassName?: string};

export default function Button(props: ButtonProps) {
    const {href, isLoading, children, containerClassName, disabled} = props;

    return (
        <div className={`relative inline-block ${containerClassName || ""} ${disabled ? "opacity-25 cursor-not-allowed" : ""}`}>
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
                    <div className={(isLoading ? "invisible " : "") + (disabled ? "cursor-not-allowed" : "")}>
                        {children}
                    </div>
                </button>
            )}
            {isLoading && <div className="up-spinner"/>}
        </div>
    )
}