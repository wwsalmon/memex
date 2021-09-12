import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import {ssrRedirect} from "next-response-helpers";
import getUserOrMakeNew from "../utils/getUserOrMakeNew";

export default function App() {
    return <></>;
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    if (!session) return ssrRedirect("/");

    const thisUserRes = await getUserOrMakeNew(session);

    if (thisUserRes.error) return {notFound: true};

    return ssrRedirect(`/node/${thisUserRes.data._id}`);
};