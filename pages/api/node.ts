import {NextApiHandler} from "next";
import nextApiEndpoint from "../../utils/nextApiEndpoint";
import {res200, res400, res404} from "next-response-helpers";
import {NodeModel} from "../../models/Node";
import {ParentLinkModel} from "../../models/ParentLink";
import * as mongoose from "mongoose";

const handler: NextApiHandler = nextApiEndpoint(
    async function getFunction(req, res, session, thisUser) {
        const {parentId, id, childCount} = req.query;

        if (id) {
            const thisNote = await NodeModel.findOne({_id: id.toString()});

            if (!thisNote) return res404(res);

            return res200(res, {node: thisNote});
        }

        if (parentId) {
            let nodeLookupStages = [];

            if (childCount) nodeLookupStages = [
                {
                    $lookup: {
                        from: "parentlinks",
                        foreignField: "parentId",
                        localField: "_id",
                        as: "linksArr",
                    },
                },
            ]

            const lookupObj = await ParentLinkModel.aggregate([
                {$match: {parentId: mongoose.Types.ObjectId(parentId.toString())}},
                {
                    $lookup: {
                        from: "nodes",
                        let: {"childId": "$childId"},
                        pipeline: [
                            {$match: {$expr: {$eq: ["$_id", "$$childId"]}}},
                            ...nodeLookupStages,
                        ],
                        as: "nodesArr",
                    }
                }
            ]);

            const nodesArr = lookupObj.map(link => link.nodesArr[0]);

            return res200(res, {nodes: nodesArr});
        }

        return res400(res);
    },
    async function postFunction(req, res, session, thisUser) {
        const {id, title, body, type, image, parentId, urlName} = req.body;

        if (!id && !(["note", "bucket", "timeline", "blog", "comment", "user"].includes(type) && parentId)) return res400(res);

        if (id) {
            const thisNote = await NodeModel.findOne({_id: id});
            
            if (title) thisNote.title = title;
            if (body) thisNote.body = body;
            if (image) thisNote.image = image;
            if (type) thisNote.type = type;
            if (urlName) thisNote.urlName = urlName;

            await thisNote.save();

            res200(res, {node: thisNote});
        } else {
            let newNode = {
                title: title || "",
                body: body || "",
                type: type,
            };

            if (image) newNode["image"] = image;

            if (urlName) newNode["urlName"] = urlName;
            else {
                const thisId = new mongoose.Types.ObjectId();
                newNode["_id"] = thisId;
                newNode["urlName"] = thisId;
            }

            const newNodeObj = await NodeModel.create(newNode);

            const newLink = {
                parentId: parentId,
                childId: newNodeObj._id,
                primary: true,
            }

            await ParentLinkModel.create(newLink);

            return res200(res, {node: newNodeObj});
        }
    },
    async function deleteFunction(req, res, session, thisUser) {

    },
)

export default handler;