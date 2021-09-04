import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import {ssrRedirect} from "next-response-helpers";
import Container from "../components/Container";
import Button from "../components/Button";
import Card from "../components/style/Card";
import H2 from "../components/style/H2";
import Badge from "../components/style/Badge";

const ProjectCard = ({name, description, badgeLetter, badgeNumber}: {name: string, description: string, badgeLetter: string, badgeNumber: number}) => (
    <Card>
        <H2>{name}</H2>
        <p className="text-gray-500">{description}</p>
        <div className="flex items-center mt-4 text-sm">
            <Badge>{badgeLetter}</Badge>
            <div className="ml-2 text-gray-500"><span>{badgeNumber}</span></div>
        </div>
    </Card>
);

export default function App() {
    return (
        <Container width="5xl" padding={12} className="bg-gray-100 rounded-lg shadow-md py-12">
            <div className="flex items-center mb-8">
                <h1 className="text-3xl font-bold">Home</h1>
                <Button onClick={() => null} className="bg-purple-500 hover:bg-purple-700 py-2 px-4 rounded-md ml-auto text-white">
                    + New category
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="C" badgeNumber={5}/>
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="C" badgeNumber={5}/>
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="C" badgeNumber={5}/>
                <ProjectCard name="Question Journal" description="Journal of bad questions" badgeLetter="C" badgeNumber={5}/>
            </div>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    return session ? {props: {}} : ssrRedirect("/app");
};