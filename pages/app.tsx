import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import {ssrRedirect} from "next-response-helpers";

export default function App() {
    return (
        <p>app</p>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    return session ? {props: {}} : ssrRedirect("/app");
};