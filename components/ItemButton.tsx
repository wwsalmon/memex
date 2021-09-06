import H3 from "./style/H3";
import Button from "./Button";

export type ItemButtonColorOpts = "purple" | "pink" | "blue" | "black";

export default function ItemButton({name, description, disabled, color = "purple", onClick}: {name: string, description: string, disabled?: boolean, color?: ItemButtonColorOpts, onClick: () => any}) {
    const colorClasses = {
        purple: "bg-purple-500 hover:bg-purple-700",
        pink: "bg-pink-500 hover:bg-pink-700",
        blue: "bg-blue-500 hover:bg-blue-700",
        black: "bg-gray-700 hover:bg-black",
    }[color];

    return (
        <Button
            className={`rounded px-3 py-4 ${colorClasses} transition text-white w-full text-left leading-tight h-full`}
            onClick={onClick}
            disabled={disabled}
        >
            <H3 className="mb-2">{name}</H3>
            <p>{description}</p>
        </Button>
    );
}