import {DatedObj, NodeObj} from "../utils/types";
import Button from "./Button";
import Card from "./style/Card";
import H3 from "./style/H3";
import Badge from "./style/Badge";
import getLetterFromType from "../utils/getLetterFromType";

const NodeCard = ({node}: {node: DatedObj<NodeObj>}) => (
    <Button href={`/node/${node._id}`}>
        <Card>
            <H3>{node.title || <span className="text-gray-400">Untitled {node.type}</span>}</H3>
            <p className="text-gray-500">{node.body || <span className="text-gray-400">No description</span>}</p>
            <div className="flex items-center mt-4 text-sm">
                <Badge>{getLetterFromType(node.type)}</Badge>
                <div className="ml-2 text-gray-500"><span>0</span></div>
            </div>
        </Card>
    </Button>
)

export default NodeCard;