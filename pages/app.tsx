import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import {ssrRedirect} from "next-response-helpers";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/style/Card";
import H3 from "../components/style/H3";
import Badge from "../components/style/Badge";
import Modal from "../components/Modal";
import {useState} from "react";
import H1 from "../components/style/H1";
import ItemButton from "../components/ItemButton";
import getUserOrMakeNew from "../utils/getUserOrMakeNew";
import {DatedObj, NodeObj} from "../utils/types";
import cleanForJSON from "../utils/cleanForJSON";
import axios from "axios";
import {useRouter} from "next/router";
import {useToasts} from "react-toast-notifications";
import showToast from "../utils/showToast";
import useSWR, {SWRResponse} from "swr";
import fetcher from "../utils/fetcher";
import NewNodeButtonAndModal from "../components/NewNodeButtonAndModal";
import NodeCard from "../components/NodeCard";

export default function App({thisUser}: {thisUser: DatedObj<NodeObj>}) {
    const router = useRouter();
    const {addToast} = useToasts();
    const [newCatOpen, setNewCatOpen] = useState<boolean>(false);

    const {data, error}: SWRResponse<{ nodes: DatedObj<NodeObj>[] }, any> = useSWR(`/api/node?parentId=${thisUser._id}`, fetcher);

    return (
        <Container width="5xl" padding={8} className="bg-gray-100 rounded-md border py-8">
            <div className="flex items-center mb-8">
                <H1>Home</H1>
                <NewNodeButtonAndModal
                    router={router}
                    addToast={addToast}
                    disabledOptions={["note"]}
                    parentId={thisUser._id}
                    className="ml-auto"
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {data && data.nodes.map(node => (
                    <NodeCard node={node}/>
                ))}
            </div>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    if (!session) return ssrRedirect("/");

    const thisUserRes = await getUserOrMakeNew(session);

    if (thisUserRes.error) return {notFound: true};

    return {props: {thisUser: cleanForJSON(thisUserRes.data)}};
};