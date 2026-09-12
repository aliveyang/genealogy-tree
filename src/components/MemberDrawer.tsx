import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Info, X } from 'lucide-react';
import { Gender, MemberFormValue, Person, RelationType } from '../types';
import type { RelationRows } from '../utils/relations';

interface RefOption {
  id: string;
  /** 「张思成 · 第三代 · 长子」 */
  label: string;
  name: string;
  gender: Gender;
}

interface MemberDrawerProps {
  open: boolean;
  mode: 'add' | 'edit';
  /** 编辑态：被编辑的人 */
  person: Person | null;
  /** 新增态：参照人下拉选项 */
  refOptions: RefOption[];
  /** 新增态：初始参照人（当前选中者或根） */
  defaultRefId: string | null;
  /** 编辑态：真实亲属关系展示值 */
  relations: RelationRows | null;
  onClose: () => void;
  onSubmit: (value: MemberFormValue) => void;
}

const RELATIONS: RelationType[] = ['父亲', '母亲', '配偶', '子女', '兄弟姐妹'];

const EMPTY_FORM: MemberFormValue = {
  name: '',
  nativePlace: '',
  gender: 'male',
  birthYear: '',
  deathYear: '',
  refId: '',
  relation: '子女',
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] leading-4 font-medium text-body">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-[9px] border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-faint focus:border-primary focus:outline-none';

/** 添加成员 / 编辑资料 抽屉（420，右侧） */
export function MemberDrawer({
  open,
  mode,
  person,
  refOptions,
  defaultRefId,
  relations,
  onClose,
  onSubmit,
}: MemberDrawerProps) {
  const [form, setForm] = useState<MemberFormValue>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && person) {
      setForm({
        name: person.name,
        nativePlace: person.nativePlace ?? '',
        gender: person.gender,
        birthYear: person.birthYear ?? '',
        deathYear: person.deathYear ?? '',
        refId: person.id,
        relation: '子女',
      });
    } else {
      setForm({ ...EMPTY_FORM, refId: defaultRefId ?? refOptions[0]?.id ?? '' });
    }
  }, [open, mode, person, defaultRefId, refOptions]);

  if (!open) return null;

  const title = mode === 'add' ? '添加成员' : '编辑资料';
  const submitText = mode === 'add' ? '确认添加' : '保存修改';
  const selectedRef = refOptions.find(o => o.id === form.refId);

  const pickRelation = (r: RelationType) => {
    // 父亲/母亲与性别联动，避免出现「女性父亲」这类矛盾组合
    const gender: Gender = r === '父亲' ? 'male' : r === '母亲' ? 'female' : form.gender;
    setForm({ ...form, relation: r, gender });
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />

      {/* 抽屉 */}
      <div className="absolute top-0 right-0 flex h-full w-[420px] max-w-full flex-col bg-surface shadow-2xl">
        {/* 头部 */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
          <h2 className="font-serif text-[17px] font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-bg"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* 主体 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <h3 className="mb-3 text-[12px] leading-4 font-medium text-faint">基本信息</h3>
          <div className="flex flex-col gap-4">
            <Field label="姓名（必填）">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="请输入姓名"
                className={inputClass}
              />
            </Field>

            <Field label="籍贯">
              <input
                value={form.nativePlace}
                onChange={e => setForm({ ...form, nativePlace: e.target.value })}
                placeholder="如：浙江绍兴"
                className={inputClass}
              />
            </Field>

            <Field label="性别">
              <div className="flex h-10 rounded-[9px] bg-female-tint p-[3px]">
                {(['male', 'female'] as Gender[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={[
                      'h-[30px] flex-1 rounded-[7px] text-[13px] transition-colors',
                      form.gender === g
                        ? 'border border-line bg-surface font-medium text-ink shadow-sm'
                        : 'text-muted hover:text-body',
                    ].join(' ')}
                  >
                    {g === 'male' ? '男' : '女'}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="生卒年（在世可留空）">
              <div className="flex items-center gap-2">
                <input
                  value={form.birthYear}
                  onChange={e => setForm({ ...form, birthYear: e.target.value })}
                  placeholder="出生年 如 1985"
                  className={`${inputClass} num`}
                />
                <input
                  value={form.deathYear}
                  onChange={e => setForm({ ...form, deathYear: e.target.value })}
                  placeholder="逝世年 如 2008"
                  className={`${inputClass} num`}
                />
              </div>
            </Field>
          </div>

          <div className="my-5 h-px bg-line" />

          <h3 className="mb-3 text-[12px] leading-4 font-medium text-faint">亲属关系</h3>

          {mode === 'add' ? (
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1.5 text-[12px] leading-4 text-muted">以谁为参照</div>
                <div className="relative">
                  {selectedRef && (
                    <span
                      className={[
                        'pointer-events-none absolute top-1/2 left-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full font-serif text-[12px] font-medium',
                        selectedRef.gender === 'male'
                          ? 'bg-male-tint text-primary'
                          : 'bg-female-tint text-accent',
                      ].join(' ')}
                    >
                      {selectedRef.name.slice(0, 1)}
                    </span>
                  )}
                  <select
                    value={form.refId}
                    onChange={e => setForm({ ...form, refId: e.target.value })}
                    className="h-11 w-full appearance-none rounded-[9px] border border-line bg-surface pr-9 pl-11 text-[13px] text-ink focus:border-primary focus:outline-none"
                  >
                    {refOptions.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-faint"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {RELATIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => pickRelation(r)}
                    className={[
                      'h-8 rounded-full px-3.5 text-[13px] transition-colors',
                      form.relation === r
                        ? 'border border-primary bg-primary-soft text-primary'
                        : 'border border-line bg-surface text-body hover:bg-bg',
                    ].join(' ')}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 rounded-[9px] bg-bg px-3 py-2.5">
                <Info size={14} className="mt-[3px] shrink-0 text-faint" />
                <span className="text-[12px] leading-5 text-muted">
                  新增成员会挂接到所选人物下，保存后可在族谱中拖动调整位置。
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[
                { label: '父母', value: relations?.父母 ?? '—' },
                { label: '配偶', value: relations?.配偶 ?? '—' },
                { label: '子女', value: relations?.子女 ?? '—' },
                {
                  label: relations?.兄弟姐妹Label ?? '兄弟姐妹',
                  value: relations?.兄弟姐妹 ?? '—',
                },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-[3px]">
                  <span className="text-[13px] text-faint">{row.label}</span>
                  <span
                    className={[
                      'text-[13px]',
                      row.value === '—' || row.value === '未记录' ? 'text-faint' : 'text-ink',
                    ].join(' ')}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex gap-2 rounded-[9px] bg-bg px-3 py-2.5">
                <Info size={14} className="mt-[3px] shrink-0 text-faint" />
                <span className="text-[12px] leading-5 text-muted">
                  亲属关系在族谱画布中通过拖拽调整，此处仅作展示。
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-[9px] border border-line bg-surface text-[13px] text-body transition-colors hover:bg-bg"
          >
            放弃
          </button>
          <button
            type="button"
            onClick={() => onSubmit(form)}
            disabled={!form.name.trim()}
            className="h-10 flex-1 rounded-[9px] bg-primary text-[13px] text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}
