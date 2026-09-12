import { Handle, Position } from '@xyflow/react';

interface MarriageNodeProps {
  data: {
    marriage: { id: string };
    hasChildren?: boolean;
  };
}

/** 婚姻圆点：6×6，居夫妻之间 */
export function MarriageNode({ data }: MarriageNodeProps) {
  const { hasChildren } = data;
  return (
    <div
      className="h-[6px] w-[6px] rounded-full bg-primary"
      style={hasChildren ? undefined : { opacity: 0.75 }}
    >
      <Handle id="left" type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle id="right" type="source" position={Position.Right} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}
