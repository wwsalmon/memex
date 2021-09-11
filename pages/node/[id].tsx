import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import getUserOrMakeNew from "../../utils/getUserOrMakeNew";
import cleanForJSON from "../../utils/cleanForJSON";
import dbConnect from "../../utils/dbConnect";
import {NodeModel} from "../../models/Node";
import {ssr404} from "next-response-helpers";
import {DatedObj, NodeObj, ParentLinkObj} from "../../utils/types";
import Container from "../../components/Container";
import H1 from "../../components/style/H1";
import Button from "../../components/Button";
import {useState} from "react";
import {getInputStateProps} from "react-controlled-component-helpers";
import axios from "axios";
import showToast from "../../utils/showToast";
import {useToasts} from "react-toast-notifications";
import useSWR, {SWRResponse} from "swr";
import fetcher from "../../utils/fetcher";
import {useRouter} from "next/router";
import NewNodeButtonAndModal from "../../components/NewNodeButtonAndModal";
import NodeCard from "../../components/NodeCard";
import * as mongoose from "mongoose";
import {ParentLinkModel} from "../../models/ParentLink";
import {format} from "date-fns";
import Badge from "../../components/style/Badge";
import getLetterFromType from "../../utils/getLetterFromType";

const NodeCrumb = ({id}: {id: string}) => {
    const {data, error} = useSWR(`/api/node?id=${id}`);

    return (
        <Button href={`/node/${id}`} className="px-2 py-1 mx-1 -ml-2 hover:bg-gray-100 block transition rounded text-gray-500 font-medium">
            {data ? data.node.title : "Loading..."}
        </Button>
    );
};

export default function Node(props: {thisNode: DatedObj<NodeObj>, thisNodeLinks: DatedObj<ParentLinkObj>[], thisUser?: DatedObj<NodeObj>}) {
    const {addToast} = useToasts();
    const router = useRouter();

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

    function getLinkChain(startId: string) {
        const thisLink = props.thisNodeLinks.find(d => d.childId === startId && d.primary === true);
        if (!thisLink) return [];
        return [thisLink, ...getLinkChain(thisLink.parentId)];
    }

    const linkChain = getLinkChain(thisNode._id);

    const {data, error}: SWRResponse<{ nodes: DatedObj<NodeObj>[] }, any> = useSWR(`/api/node?parentId=${thisNode._id}`, fetcher);

    return (
        <>
            <Container width="5xl" padding={8} className="mb-4 flex items-center">
                {linkChain.reverse().map((d, i) => (
                    <>
                        <NodeCrumb id={d.parentId}/>
                        <span className="mr-3 text-gray-300 font-medium">&gt;</span>
                    </>
                ))}
                <span className="font-bold">{thisNode.title}</span>
            </Container>
            <Container width="5xl" padding={8} className="bg-gray-100 rounded-md border py-8">
                <div className="flex mb-8">
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
                <div className="my-6 flex items-center">
                    <p>Created {format(new Date(thisNode.createdAt), "MMMM d, yyyy")}</p>
                    <Badge className="ml-6"><Badge>{getLetterFromType(thisNode.type)}</Badge></Badge>
                    <div className="ml-2 text-gray-500"><span>{data && data.nodes.length}</span></div>
                    {thisNode.type !== "note" && (
                        <NewNodeButtonAndModal
                            router={router}
                            addToast={addToast}
                            parentId={thisNode._id}
                            className="ml-auto"
                        />
                    )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {data && data.nodes.map(node => (
                        <NodeCard node={node}/>
                    ))}
                </div>
            </Container>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async ({req, query, res}) => {
    try {
        await dbConnect();

        const thisNode = await NodeModel.findOne({_id: query.id.toString()});

        if (!thisNode) return ssr404;

        const thisNodeLinks = await ParentLinkModel.aggregate([
            {$match: {childId: mongoose.Types.ObjectId(query.id.toString())}},
            {
                $graphLookup: {
                    from: "parentlinks",
                    startWith: "$parentId",
                    connectFromField: "parentId",
                    connectToField: "childId",
                    as: "linkHierarchy"
                }
            }
        ]);

        const thisNodeLinksFlat = [...thisNodeLinks.map(d => {
            let topLink = {...d};
            delete topLink.linkHierarchy;
            return topLink;
        }), ...thisNodeLinks.reduce((a, b) => [...a, ...b.linkHierarchy], [])];

        let props = {thisNode: cleanForJSON(thisNode), thisNodeLinks: cleanForJSON(thisNodeLinksFlat), key: thisNode._id.toString()};

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