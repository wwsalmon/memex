import mongoose, {Model} from "mongoose";
import {DatedObj, NodeObj} from "../utils/types";

export const ParentLinksWithNodesModel: Model<DatedObj<NodeObj>> = mongoose.models.parentlinkswithnodes || mongoose.model("parentlinkswithnodes", new mongoose.Schema({
    parentId: { required: true, type: mongoose.Types.ObjectId },
    childId: { required: true, type: mongoose.Types.ObjectId },
    primary: { required: true, type: Boolean },
    node: { required: true, type: Object },
}, {
    timestamps: true,
}), "parentlinkswithnodes");