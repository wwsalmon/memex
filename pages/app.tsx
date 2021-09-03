import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import {ssrRedirect} from "next-response-helpers";
import Container from "../components/Container";
import Button from "../components/Button";

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
                <div className="bg-white rounded-md shadow-sm p-4 hover:shadow-md transition cursor-pointer">
                    <h2 className="font-bold">Question Journal</h2>
                    <p className="text-gray-500">Journal of "bad questions"</p>
                    <div className="flex items-center mt-4 text-sm">
                        <div className="w-6 h-6 bg-purple-300 rounded-md text-white flex items-center justify-center font-medium"><span>C</span></div>
                        <div className="ml-2 text-gray-500"><span>2</span></div>
                    </div>
                </div>
            </div>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    return session ? {props: {}} : ssrRedirect("/app");
};