import {DatedObj, NodeObj, ParentLinkObj} from "../utils/types";
import Button from "./Button";
import Card from "./style/Card";
import H3 from "./style/H3";
import Badge from "./style/Badge";
import {getBgClassFromType, getLetterFromType} from "../utils/getInfoFromType";
import slateWordCount from "../utils/slateWordCount";

const NodeCard = ({node}: {node: DatedObj<NodeObj> & { linksArr: DatedObj<ParentLinkObj>[]}}) => (
    <Button href={`/node/${node._id}`}>
        <Card>
            <H3>{node.title || <span className="text-gray-400">Untitled {node.type}</span>}</H3>
            <p className="text-gray-500 truncate h-6">{node.body || <span className="text-gray-400">No description</span>}</p>
            <div className="flex items-center mt-4 text-sm">
                <Badge bgClass={getBgClassFromType(node.type)}>{getLetterFromType(node.type)}</Badge>
                <div className="ml-2 text-gray-500"><span>
                    {node.type === "note" ? (
                        (Math.ceil(slateWordCount(node.slateBody) / 200)) + " min read"
                    ) : (
                        node.linksArr.length
                    )}
                </span></div>
            </div>
        </Card>
    </Button>
)

export default NodeCard;