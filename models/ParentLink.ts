import mongoose, {Document, Model} from "mongoose";
import {ParentLinkObj} from "../utils/types";

export const ParentLinkModel: Model<Document<ParentLinkObj>> = mongoose.models.parentLink || mongoose.model("parentLink", new mongoose.Schema({
    parentId: { required: true, type: mongoose.Types.ObjectId },
    childId: { required: true, type: mongoose.Types.ObjectId },
    primary: { required: true, type: Boolean },
}, {
    timestamps: true,
}));