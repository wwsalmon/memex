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
import {useCallback, useEffect, useMemo, useState} from "react";
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
import Link from "next/link";
import SlateEditor from "../../components/SlateEditor";
import {Descendant} from "slate";
import {useAutosave} from "react-autosave";
import slateWordCount from "../../utils/slateWordCount";

const NodeCrumb = ({id}: { id: string }) => {
    const {data, error} = useSWR(`/api/node?id=${id}`);

    return (
        <Button
            href={`/node/${id}`}
            className="px-2 py-1 mx-1 -ml-2 hover:bg-gray-100 block transition rounded text-gray-500 font-medium"
        >
            {data ? data.node.title : "Loading..."}
        </Button>
    );
};

export default function Node(props: { thisNode: DatedObj<NodeObj>, thisNodeLinks: DatedObj<ParentLinkObj>[], thisUser?: DatedObj<NodeObj> }) {
    const {addToast} = useToasts();
    const router = useRouter();

    const [thisNode, setThisNode] = useState<DatedObj<NodeObj>>(props.thisNode);
    const [isEditTitle, setIsEditTitle] = useState<boolean>(!(thisNode.title || thisNode.body));
    const [isEditTitleLoading, setIsEditTitleLoading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>(thisNode.title || `Untitled ${thisNode.type}`);
    const [value, setValue] = useState<Descendant[]>(thisNode.slateBody || [{type: "p", children: [{text: ""}]}]);
    const [isSaving, setIsSaving] = useState<boolean>(false);

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

    const {
        data,
        error
    }: SWRResponse<{ nodes: (DatedObj<NodeObj> & { linksArr: DatedObj<ParentLinkObj>[] })[] }, any> = useSWR(`/api/node?parentId=${thisNode._id}&childCount=true`, fetcher);

    useAutosave({data: value, onSave: useCallback((value) => {
        setIsSaving(true);

        axios.post("/api/node", {
            id: thisNode._id,
            slateBody: value,
        })
            .then(res => setThisNode(res.data.node))
            .catch(e => console.log(e))
            .finally(() => setIsSaving(false));
    }, []), interval: 1000});

    return (
        <>
            <div className="fixed top-0 left-4 flex items-center h-16 z-10">
                {linkChain.reverse().map((d, i) => (
                    <>
                        <NodeCrumb id={d.parentId}/>
                        <span className="mr-3 text-gray-300 font-medium">&gt;</span>
                    </>
                ))}
                <span className="font-bold">{thisNode.title}</span>
            </div>
            <div className="relative">
                {!!linkChain.length && (
                    <Link href={`/node/${linkChain[linkChain.length - 1].parentId}`}>
                        <a
                            className={`absolute block w-full left-0 top-0 z-0 h-full ${thisNode.type === "note" ? "bg-gray-200" : ""}`}
                            style={{minHeight: "100vh"}}
                        />
                    </Link>
                )}
                <hr className="invisible"/>
                <Container
                    width={thisNode.type === "note" ? "3xl" : "5xl"}
                    padding={8}
                    className={`${thisNode.type === "note" ? "bg-white" : "bg-gray-100"} rounded-md border py-8 my-20 relative z-5`}
                >
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
                                <Button
                                    className="-m-2 p-2 hover:bg-gray-200 transition"
                                    onClick={() => setIsEditTitle(true)}
                                >
                                    <H1>{thisNode.title ||
                                    <span className="text-gray-500">Untitled {thisNode.type}</span>}</H1>
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="my-6 flex items-center">
                        <p>Created {format(new Date(thisNode.createdAt), "MMMM d, yyyy")}</p>
                        <Badge className="ml-6"><Badge>{getLetterFromType(thisNode.type)}</Badge></Badge>
                        <div className="ml-2 text-gray-500"><span>{data && data.nodes.length}</span></div>
                        {thisNode.type === "note" && (
                            <p className="ml-auto text-gray-500">
                                {isSaving ? (
                                    "Saving..."
                                ) : (JSON.stringify(value) !== JSON.stringify(thisNode.slateBody)) ? (
                                    "Unsaved changes"
                                ) : (
                                    "All changes saved"
                                )}
                            </p>
                        )}
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
                    {thisNode.type === "note" && (
                        <>
                            <SlateEditor value={value} setValue={setValue}/>
                            <p className="text-sm text-gray-500">{slateWordCount(value)} words / {Math.ceil(slateWordCount(value) / 200)} min read</p>
                        </>
                    )}
                </Container>
                <hr className="invisible"/>
            </div>
        </>
    );
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

        let props = {
            thisNode: cleanForJSON(thisNode),
            thisNodeLinks: cleanForJSON(thisNodeLinksFlat),
            key: thisNode._id.toString()
        };

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