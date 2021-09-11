import {NextApiHandler, NextApiRequest, NextApiResponse} from "next";
import {getSession} from "next-auth/client";
import dbConnect from "./dbConnect";
import {Session} from "next-auth";
import {res403, res405, res500} from "next-response-helpers";
import {DatedObj, NodeObj} from "./types";
import {NodeModel} from "../models/Node";

export type MethodFunction = (req: NextApiRequest, res: NextApiResponse, session: Session, thisUser?: DatedObj<NodeObj>) => any;

export default function nextApiEndpoint(
    getFunction: MethodFunction,
    postFunction: MethodFunction,
    deleteFunction: MethodFunction,
): NextApiHandler {
    const handler: NextApiHandler = async (req, res) => {
        const session = await getSession({req});

        if (!session) return res403(res);

        try {
            await dbConnect();

            const thisUser = await NodeModel.findOne({body: session.user.email, type: "user"});
            if (!thisUser) return res500(res, new Error("User not found"));

            switch (req.method) {
                case "GET": {
                    return await getFunction(req, res, session, thisUser);
                }
                case "POST": {
                    return await postFunction(req, res, session, thisUser);
                }
                case "DELETE": {
                    return await deleteFunction(req, res, session, thisUser);
                }
                default: {
                    return res405(res);
                }
            }
        } catch (e) {
            console.log(e);

            return res500(res, e);
        }
    }

    return handler;
}