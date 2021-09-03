import mongoose, {Document, Model} from "mongoose";
import {NodeObj} from "../utils/types";

export const NodeModel: Model<Document<NodeObj>> = mongoose.models.node || mongoose.model("node", new mongoose.Schema({
    urlName: { required: true, type: String },
    body: { required: true, type: String },
    type: { required: true, type: String },
    image: { required: false, type: String },
    title: { required: false, type: String },
}, {
    timestamps: true,
}));