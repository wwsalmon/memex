import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import getUserOrMakeNew from "../../utils/getUserOrMakeNew";
import cleanForJSON from "../../utils/cleanForJSON";
import dbConnect from "../../utils/dbConnect";
import {NodeModel} from "../../models/Node";
import {ssr404} from "next-response-helpers";
import {DatedObj, NodeObj} from "../../utils/types";
import Container from "../../components/Container";
import H1 from "../../components/style/H1";
import Button from "../../components/Button";
import {useState} from "react";
import {getInputStateProps} from "react-controlled-component-helpers";
import axios from "axios";
import showToast from "../../utils/showToast";
import {useToasts} from "react-toast-notifications";
import useSWR from "swr";

export default function Node(props: {thisNode: DatedObj<NodeObj>, thisUser: DatedObj<NodeObj>}) {
    const {addToast} = useToasts();

    const [thisNode, setThisNode] = useState<DatedObj<NodeObj>>(props.thisNode);
    const [isEditTitle, setIsEditTitle] = useState<boolean>(!(thisNode.title || thisNode.body));
    const [isEditTitleLoading, setIsEditTitleLoading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>(thisNode.title || `Untitled ${thisNode.type}`);

    const prevTitle = thisNode.title || `Untitled ${thisNode.type}`;

    function onSubmitEditTitle() {
        setIsEditTitleLoading(true);

        axios.post("/api/node", {
            id: thisNode._id,
            title: title,
        }).then(res => {
            setThisNode(res.data.node);
            setIsEditTitle(false);
            showToast(true, "Title saved", addToast);
        }).catch(e => {
            showToast(false, e.message, addToast);
        }).finally(() => {
            setIsEditTitleLoading(false);
        });
    }

    return (
        <Container width="5xl" padding={8} className="bg-gray-100 rounded-md border py-8">
            <div className="flex items-center mb-8">
                <div>
                    {isEditTitle ? (
                        <>
                            <input
                                className="font-bold text-3xl -m-2 p-2 border rounded" {...getInputStateProps(title, setTitle)}
                                onKeyDown={e => {
                                    if (e.key === "Escape") {
                                        setTitle(prevTitle);
                                        return setIsEditTitle(false);
                                    }
                                    if (e.key === "Enter") {
                                        return title === prevTitle ? setIsEditTitle(false) : onSubmitEditTitle();
                                    }
                                }}
                                autoFocus={true}
                                onBlur={() => {
                                    setTitle(prevTitle);
                                    return setIsEditTitle(false);
                                }}
                            />
                            {title !== prevTitle && (
                                <p className="text-sm mt-3">{isEditTitleLoading ? "Saving..." : `Press "Enter" to save`}</p>
                            )}
                        </>
                    ) : (
                        <Button className="-m-2 p-2 hover:bg-gray-200 transition" onClick={() => setIsEditTitle(true)}>
                            <H1>{thisNode.title || <span className="text-gray-500">Untitled {thisNode.type}</span>}</H1>
                        </Button>
                    )}
                </div>
            </div>
        </Container>
    )
}

export const getServerSideProps: GetServerSideProps = async ({req, query, res}) => {
    try {
        await dbConnect();

        const thisNode = await NodeModel.findOne({_id: query.id.toString()});

        if (!thisNode) return ssr404;

        let props = {thisNode: cleanForJSON(thisNode)};

        const session = await getSession({req});

        if (session) {
            const thisUserRes = await getUserOrMakeNew(session);

            if (thisUserRes.error) return {notFound: true};

            props["thisUser"] = cleanForJSON(thisUserRes.data);
        }

        return {props: props};
    } catch (e) {
        return ssr404;
    }
};