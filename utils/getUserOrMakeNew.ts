import {Session} from "next-auth";
import dbConnect from "./dbConnect";
import {NodeModel} from "../models/Node";
import mongoose from "mongoose";
import {ParentLinkModel} from "../models/ParentLink";

export default async function getUserOrMakeNew(session: Session) {
    try {
        await dbConnect();

        const thisUser = await NodeModel.findOne({body: session.user.email, type: "user"});

        if (thisUser) return {data: thisUser};

        const newId = new mongoose.Types.ObjectId();

        const newUser = await NodeModel.create({
            _id: newId,
            type: "user",
            title: session.user.name,
            body: session.user.email,
            image: session.user.image,
            urlName: newId,
        });

        await ParentLinkModel.create({
            parentId: process.env.NEXT_PUBLIC_GENESIS_ID,
            childId: newUser._id,
            primary: true,
        });

        return {data: newUser};
    } catch (e) {
        return {error: e};
    }
}