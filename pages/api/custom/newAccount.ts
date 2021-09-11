import {NextApiHandler} from "next";
import {getSession} from "next-auth/client";
import dbConnect from "../../../utils/dbConnect";
import {res200, res403, res405, res500} from "next-response-helpers";
import {NodeModel} from "../../../models/Node";
import mongoose from "mongoose";

const handler: NextApiHandler = async (req, res) => {
    if (req.method !== "POST") return res405(res);

    const session = await getSession({req});

    if (!session) return res403(res);

    try {
        await dbConnect();

        const thisUser = await NodeModel.findOne({body: session.user.email, type: "user"});

        if (thisUser) return res500(res, new Error("Account already exists"));

        const thisId = new mongoose.Types.ObjectId();

        const newUserObj = await NodeModel.create({
            _id: thisId,
            type: "user",
            title: session.user.name,
            body: session.user.email,
            image: session.user.image,
            urlName: thisId,
        });

        return res200(res, {newUserObj});
    } catch (e) {
        return res500(res, e);
    }
}

export default handler;