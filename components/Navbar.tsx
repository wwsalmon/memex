import {useSession} from "next-auth/client";
import Button from "./Button";
import Container from "./Container";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import Mousetrap from "mousetrap";
import Modal from "./style/Modal";
import {getInputStateProps} from "react-controlled-component-helpers";
import axios from "axios";
import {DatedObj, NodeObj} from "../utils/types";

export default function Navbar() {
    const [session, loading] = useSession();
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [nodes, setNodes] = useState<DatedObj<NodeObj>[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const router = useRouter();

    useEffect(() => {
        Mousetrap.bind("g", e => {
            e.preventDefault();
            setSearchOpen(true);
        });
    }, []);

    useEffect(() => {
        axios.get(`/api/node?searchQuery=${searchQuery}`)
            .then(res => {
                setNodes(res.data.nodes);
                setSelectedIndex(0);
            })
            .catch(e => console.log(e));
    }, [searchQuery]);

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
            <Modal isOpen={searchOpen} setIsOpen={() => {
                setSearchOpen(false);
                setSearchQuery("");
            }}>
                <input
                    type="text" {...getInputStateProps(searchQuery, setSearchQuery)}
                    className="text-xl focus:outline-none w-full"
                    placeholder="Search for a node"
                    onKeyDown={e => {
                        if (e.key === "ArrowDown") setSelectedIndex(Math.min(selectedIndex + 1, nodes.length - 1))
                        else if (e.key === "ArrowUp") setSelectedIndex(Math.max(selectedIndex - 1, 0));
                        else if (e.key === "Enter") {
                            router.push(`/node/${nodes[selectedIndex]._id}`)
                                .then(() => {
                                    setSearchQuery("");
                                    setNodes([]);
                                    setSearchOpen(false);
                                });
                        }
                    }}
                    autoFocus
                />
                {nodes.length ? (
                    <div className="mt-4 -mb-4">
                        {nodes.map((d, i) => (
                            <Button
                                href={`/node/${d._id}`}
                                className={`w-full h-full text-xl ${selectedIndex === i ? "" : "text-gray-500"}`}
                                containerClassName={`py-3 w-full px-4 -mx-4 box-content ${selectedIndex === i ? "bg-gray-100" : ""}`}
                            >{d.title}</Button>
                        ))}
                    </div>
                ) : (
                    <p className="text-xl mt-4 text-gray-300">No results</p>
                )}
            </Modal>
        </div>
    );
}