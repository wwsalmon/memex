import {useSession} from "next-auth/client";
import Button from "./Button";
import Container from "./Container";
import {useRouter} from "next/router";

export default function Navbar() {
    const [session, loading] = useSession();
    const router = useRouter();

    return (
        <div className="w-full fixed top-0 z-10">
            <Container className="flex items-center my-4" width="full">
                <div className="ml-auto">
                    {(session && router.route !== "/") ? (
                        <img
                            src={session.user.image}
                            alt={`Profile picture of ${session.user.name}`}
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <Button href="/auth/signin">Sign in</Button>
                    )}
                </div>
            </Container>
        </div>
    );
}