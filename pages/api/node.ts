import {NextApiHandler} from "next";
import nextApiEndpoint from "../../utils/nextApiEndpoint";
import {res200, res400, res403, res404} from "next-response-helpers";
import {NodeModel} from "../../models/Node";
import {ParentLinkModel} from "../../models/ParentLink";
import * as mongoose from "mongoose";
import htmlDecode from "../../utils/htmlDecode";
import {serialize} from "remark-slate";
import {DatedObj, NodeObj} from "../../utils/types";
import {ParentLinksWithNodesModel} from "../../models/ParentLinksWithNodes";

const handler: NextApiHandler = nextApiEndpoint(
    async function getFunction(req, res, session, thisUser) {
        const {parentId, id, searchQuery, childCount} = req.query;

        if (id) {
            const isAuthed = await nodeIsAuthed(id.toString(), thisUser);

            if (!isAuthed) return res403(res);

            const thisNote = await NodeModel.findOne({_id: id.toString()});

            if (!thisNote) return res404(res);

            return res200(res, {node: thisNote});
        }

        if (parentId) {
            const isAuthed = await nodeIsAuthed(parentId.toString(), thisUser);

            if (!isAuthed) return res403(res);

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

        if (searchQuery) {
            const lookupObj = await ParentLinksWithNodesModel.aggregate([
                {$match: {childId: mongoose.Types.ObjectId(thisUser._id.toString())}},
                {
                    $graphLookup: {
                        from: "parentlinkswithnodes",
                        startWith: "$childId",
                        connectFromField: "childId",
                        connectToField: "parentId",
                        as: "children",
                    },
                },
                {
                    $unwind: {
                        path: "$children",
                    },
                },
                {
                    $match: {
                        $expr: {
                            $regexMatch: {input: "$children.node.title", regex: `.*${searchQuery}.*`, options: "i"},
                        },
                    }
                },
                {$limit: 10},
            ]);

            const matchingNodes = lookupObj.map(d => d.children ? d.children.node : d.node);

            return res200(res, {nodes: matchingNodes});
        }

        return res400(res);
    },
    async function postFunction(req, res, session, thisUser) {
        const {id, title, body, slateBody, type, image, parentId, urlName} = req.body;

        if (!id && !(["note", "bucket", "timeline", "blog", "comment", "user"].includes(type) && parentId)) return res400(res);

        if (id) {
            const isAuthed = await nodeIsAuthed(id.toString(), thisUser);

            if (!isAuthed) return res403(res);

            const thisNote = await NodeModel.findOne({_id: id});
            
            if (title) thisNote.title = title;
            if (slateBody) {
                thisNote.slateBody = slateBody;
                thisNote.body = htmlDecode(
                    slateBody.map(d => serialize(d, {
                        nodeTypes: {
                            paragraph: "p",
                            ul_list: "ul",
                            ol_list: "ol",
                            listItem: "li",
                            heading: {
                                1: "h1",
                                2: "h2",
                                3: "h3",
                                4: "h4",
                                5: "h5",
                                6: "h6",
                            },
                            emphasis_mark: "italic",
                            strong_mark: "bold",
                            inline_code_mark: "code",
                            block_quote: "blockquote",
                            code_block: "codeblock",
                            link: "a",
                            image: "img",
                            delete_mark: "s",
                            thematic_break: "br",
                        },
                    })
                ).join(""));
            }
            else if (body) {
                thisNote.body = body;
                thisNote.slateBody = [{type: "p", children: [{text: body}]}];
            }
            if (image) thisNote.image = image;
            if (type) thisNote.type = type;
            if (urlName) thisNote.urlName = urlName;

            await thisNote.save();

            res200(res, {node: thisNote});
        } else {
            const isAuthed = await nodeIsAuthed(parentId.toString(), thisUser);

            if (!isAuthed) return res403(res);

            let newNode = {
                title: title || "",
                body: body || "",
                slateBody: [{type: "p", children: [{text: body || ""}]}],
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
        const {id} = req.query;

        const isAuthed = await nodeIsAuthed(id.toString(), thisUser);

        if (!isAuthed) return res403(res);

        const childrenGraph = await ParentLinkModel.aggregate([
            {$match: {parentId: mongoose.Types.ObjectId(id.toString())}},
            {
                $graphLookup: {
                    from: "parentlinks",
                    startWith: "$childId",
                    connectFromField: "childId",
                    connectToField: "parentId",
                    as: "children",
                },
            },
        ]);

        const allLinks = [...childrenGraph, ...childrenGraph.reduce((a, b) => [...a, ...b.children], [])];
        const allNodeIds = allLinks.map(d => d.childId).filter((d, i, a) => a.findIndex(x => x.toString() === d.toString()) === i);
        const deleteIds = [id, ...allNodeIds];

        await NodeModel.deleteMany({_id: {$in: deleteIds}});

        await ParentLinkModel.deleteMany({childId: {$in: deleteIds}});

        return res200(res, {count: deleteIds.length});
    },
)

async function nodeIsAuthed(nodeId: string, thisUser: DatedObj<NodeObj>): Promise<boolean> {
    if (nodeId === thisUser._id.toString()) return true;

    const parentsGraph = await ParentLinkModel.aggregate([
        {$match: {childId: mongoose.Types.ObjectId(nodeId)}},
        {
            $graphLookup: {
                from: "parentlinks",
                startWith: "$parentId",
                connectFromField: "parentId",
                connectToField: "childId",
                as: "parents",
            },
        },
    ]);

    const allLinks = [...parentsGraph, ...parentsGraph.reduce((a, b) => [...a, ...b.parents], [])];
    const allNodeIds = allLinks.map(d => d.parentId.toString()).filter((d, i, a) => a.findIndex(x => x === d) === i);

    return allNodeIds.includes(thisUser._id.toString());
}

export default handler;