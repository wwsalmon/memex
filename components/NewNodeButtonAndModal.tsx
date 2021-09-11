import {Dispatch, SetStateAction, useState} from "react";
import {NextRouter} from "next/router";
import {NodeObjTypeOpts} from "../utils/types";
import Modal from "./Modal";
import H3 from "./style/H3";
import ItemButton from "./ItemButton";
import axios from "axios";
import showToast from "../utils/showToast";
import {AddToast} from "react-toast-notifications";
import Button from "./Button";

export default function NewNodeButtonAndModal({className, router, addToast, disabledOptions, parentId}: {
    className?: string,
    router: NextRouter,
    addToast: AddToast,
    disabledOptions?: NodeObjTypeOpts[],
    parentId: string,
}) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    function onSubmit(type: "note" | "bucket" | "timeline" | "blog") {
        setIsLoading(true);

        axios.post("/api/node", {
            parentId: parentId,
            type: type,
        }).then(res => {
            setIsLoading(false);
            router.push(`/node/${res.data.node._id}`, null, {shallow: false});
            showToast(true, "New node created", addToast);
        }).catch(e => {
            setIsLoading(false);
            showToast(false, e.message, addToast);
        });
    }
    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-purple-500 hover:bg-purple-700 py-2 px-3 rounded text-white text-sm hover:shadow-inner transition font-medium tracking-wide"
                containerClassName={className || ""}
            >
                + New node (n)
            </Button>
            <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
                <h2 className="text-xl font-bold mb-2">New item</h2>
                <div className="grid grid-cols-4 gap-4 py-4 -mb-4 mt-4 -mx-4 px-4 bg-gray-100 rounded-b-lg border-t">
                    <H3>Note</H3>
                    <H3>Container</H3>
                    <H3 className="col-span-2">Time series</H3>
                    <ItemButton
                        name="Note (n)" description="Write down your ideas"
                        onClick={() => onSubmit("note")}
                        color="pink"
                        disabled={disabledOptions && disabledOptions.includes("note")}
                        isLoading={isLoading}
                    />
                    <ItemButton
                        name="Bucket (b)"
                        description="Container of loose notes"
                        onClick={() => onSubmit("bucket")}
                        color="purple"
                        disabled={disabledOptions && disabledOptions.includes("bucket")}
                        isLoading={isLoading}
                    />
                    <ItemButton
                        name="Timeline (t)"
                        description="A Twitter-like feed of updates"
                        onClick={() => onSubmit("timeline")}
                        color="blue"
                        disabled={disabledOptions && disabledOptions.includes("timeline")}
                        isLoading={isLoading}
                    />
                    <ItemButton
                        name="Blog (l)"
                        description="A more substantial feed"
                        onClick={() => onSubmit("blog")}
                        color="black"
                        disabled={disabledOptions && disabledOptions.includes("blog")}
                        isLoading={isLoading}
                    />
                </div>
            </Modal>
        </>
    );
}