import { FamilyData } from '../../types';
import { FamilyTreeViewer } from '../FamilyTreeViewer';
import { MobileHeader } from './shared';

interface MobileCanvasProps {
  pedigreeName: string;
  data: FamilyData;
  rootId: string | null;
  selectedPersonId: string | null;
  newPersonId: string | null;
  focus: { id: string; nonce: number } | null;
  memberCount: number;
  onSelectPerson: (id: string | null) => void;
  onOpenDetail: (id: string) => void;
  onBack: () => void;
}

/** 移动端族谱画布：直系切换 pill + 浮动缩放 + 紧凑名条（复用 FamilyTreeViewer） */
export function MobileCanvas({
  pedigreeName,
  data,
  rootId,
  selectedPersonId,
  newPersonId,
  focus,
  memberCount,
  onSelectPerson,
  onOpenDetail,
  onBack,
}: MobileCanvasProps) {
  const handleSelect = (id: string | null) => {
    onSelectPerson(id);
    // 再次点击已选中的成员进入详情
    if (id && id === selectedPersonId) onOpenDetail(id);
  };

  return (
    <div className="flex h-full flex-col bg-canvas">
      <MobileHeader title={pedigreeName} onBack={onBack} />
      <div className="min-h-0 flex-1">
        <FamilyTreeViewer
          data={data}
          rootId={rootId}
          selectedPersonId={selectedPersonId}
          newPersonId={newPersonId}
          focus={focus}
          onSelectPerson={handleSelect}
          compact
          memberCount={memberCount}
        />
      </div>
    </div>
  );
}
