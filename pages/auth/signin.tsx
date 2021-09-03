import {GetServerSideProps} from "next";
import {getSession} from "next-auth/client";
import SEO from "../../components/SEO";
import SignInButton from "../../components/SignInButton";
import {ssrRedirect} from "next-response-helpers";

export default function Signin({}: {}) {
    return (
        <>
            <SEO title="Sign in"/>
            <h1>Welcome to Memex</h1>
            <p>Click the button below to sign in to or sign up for Memex with your Google account.</p>
            <SignInButton/>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req, res}) => {
    const session = await getSession({req});

    return session ? ssrRedirect("/app") : {props: {}};
};