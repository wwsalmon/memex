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
import dbConnect from "../utils/dbConnect";
import {NodeModel} from "../models/Node";
import getUserOrMakeNew from "../utils/getUserOrMakeNew";
import {DatedObj, NodeObj} from "../utils/types";
import cleanForJSON from "../utils/cleanForJSON";
import axios from "axios";
import {useRouter} from "next/router";
import {useToasts} from "react-toast-notifications";
import showToast from "../utils/showToast";

const ProjectCard = ({name, description, badgeLetter, badgeNumber}: {name: string, description: string, badgeLetter: string, badgeNumber: number}) => (
    <Card>
        <H3>{name}</H3>
        <p className="text-gray-500">{description}</p>
        <div className="flex items-center mt-4 text-sm">
            <Badge>{badgeLetter}</Badge>
            <div className="ml-2 text-gray-500"><span>{badgeNumber}</span></div>
        </div>
    </Card>
);

export default function App({thisUser}: {thisUser: DatedObj<NodeObj>}) {
    const router = useRouter();
    const {addToast} = useToasts();
    const [newCatOpen, setNewCatOpen] = useState<boolean>(false);
    const [newCatLoading, setNewCatLoading] = useState<boolean>(false);

    function newNote(type: "note" | "bucket" | "timeline" | "blog") {
        setNewCatLoading(true);

        axios.post("/api/node", {
            parentId: thisUser._id,
            type: type,
        }).then(res => {
            setNewCatLoading(false);
            router.push(`/node/${res.data.node._id}`);
            showToast(true, "New node created", addToast);
        }).catch(e => {
            setNewCatLoading(false);
            showToast(false, e.message, addToast);
        });
    }

    return (
        <Container width="5xl" padding={8} className="bg-gray-100 rounded-md border py-8">
            <div className="flex items-center mb-8">
                <H1>Home</H1>
                <Button
                    onClick={() => setNewCatOpen(true)}
                    className="bg-purple-500 hover:bg-purple-700 py-2 px-3 rounded text-white text-sm hover:shadow-inner transition font-medium tracking-wide"
                    containerClassName="ml-auto"
                >
                    + New item (n)
                </Button>
                <Modal isOpen={newCatOpen} setIsOpen={setNewCatOpen}>
                    <h2 className="text-xl font-bold mb-2">New item</h2>
                    <div className="grid grid-cols-4 gap-4 py-4 -mb-4 mt-4 -mx-4 px-4 bg-gray-100 rounded-b-lg border-t">
                        <H3>Note</H3>
                        <H3>Container</H3>
                        <H3 className="col-span-2">Time series</H3>
                        <ItemButton
                            name="Note (n)" description="Write down your ideas"
                            onClick={() => newNote("note")}
                            color="pink"
                            disabled={true}
                            isLoading={newCatLoading}
                        />
                        <ItemButton
                            name="Bucket (b)"
                            description="Container of loose notes"
                            onClick={() => newNote("bucket")}
                            color="purple"
                            isLoading={newCatLoading}
                        />
                        <ItemButton
                            name="Timeline (t)"
                            description="A Twitter-like feed of updates"
                            onClick={() => newNote("timeline")}
                            color="blue"
                            isLoading={newCatLoading}
                        />
                        <ItemButton
                            name="Blog (l)"
                            description="A more substantial feed"
                            onClick={() => newNote("blog")}
                            color="black"
                            isLoading={newCatLoading}
                        />
                    </div>
                </Modal>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="B" badgeNumber={5}/>
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="B" badgeNumber={5}/>
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="B" badgeNumber={5}/>
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="B" badgeNumber={5}/>
            </div>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    if (!session) return ssrRedirect("/");

    await dbConnect();

    const thisUserRes = await getUserOrMakeNew(session);

    if (thisUserRes.error) return {notFound: true};

    return {props: {thisUser: cleanForJSON(thisUserRes.data)}};
};