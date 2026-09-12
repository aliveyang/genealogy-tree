import { useState, useCallback, useMemo } from 'react';
import { Person, Marriage, FamilyData, Gender, TemplateKind } from '../types';
import { buildZhangFamily, buildTemplate } from '../utils/sampleData';

const INITIAL_DATA: FamilyData = {
  people: {},
  marriages: {},
};

function findSpouseMarriage(marriages: Record<string, Marriage>, personId: string): Marriage | undefined {
  return Object.values(marriages).find(m => m.husbandId === personId || m.wifeId === personId);
}

export function useFamilyTree() {
  const [data, setData] = useState<FamilyData>(INITIAL_DATA);

  const addPerson = useCallback((name: string, gender: Gender) => {
    const id = crypto.randomUUID();
    const newPerson: Person = { id, name, gender };
    setData(prev => ({
      ...prev,
      people: { ...prev.people, [id]: newPerson }
    }));
    return id;
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    setData(prev => ({
      ...prev,
      people: {
        ...prev.people,
        [id]: { ...prev.people[id], ...updates }
      }
    }));
  }, []);

  const addSpouse = useCallback((personId: string, spouseName: string) => {
    const person = data.people[personId];
    if (!person) return;

    const spouseGender: Gender = person.gender === 'male' ? 'female' : 'male';
    const spouseId = crypto.randomUUID();
    const spouse: Person = { id: spouseId, name: spouseName, gender: spouseGender };

    const marriageId = crypto.randomUUID();
    const marriage: Marriage = {
      id: marriageId,
      husbandId: person.gender === 'male' ? personId : spouseId,
      wifeId: person.gender === 'female' ? personId : spouseId,
      childrenIds: [],
    };

    setData(prev => ({
      ...prev,
      people: { ...prev.people, [spouseId]: spouse },
      marriages: { ...prev.marriages, [marriageId]: marriage }
    }));
    return spouseId;
  }, [data.people]);

  const addChildToPerson = useCallback((personId: string, childName: string, gender: Gender) => {
    const person = data.people[personId];
    if (!person) return;

    const childId = crypto.randomUUID();
    const child: Person = { id: childId, name: childName, gender };

    setData(prev => {
      // Find again in prev to ensure latest state
      const existing = findSpouseMarriage(prev.marriages, personId);
      if (existing) {
        return {
          ...prev,
          people: { ...prev.people, [childId]: child },
          marriages: {
            ...prev.marriages,
            [existing.id]: { ...existing, childrenIds: [...existing.childrenIds, childId] }
          }
        };
      }

      // No spouse yet: create an unknown spouse + marriage atomically with the child
      const spouseGender: Gender = person.gender === 'male' ? 'female' : 'male';
      const spouseId = crypto.randomUUID();
      const spouse: Person = { id: spouseId, name: '未知配偶', gender: spouseGender };
      const marriageId = crypto.randomUUID();
      const marriage: Marriage = {
        id: marriageId,
        husbandId: person.gender === 'male' ? personId : spouseId,
        wifeId: person.gender === 'female' ? personId : spouseId,
        childrenIds: [childId],
      };
      return {
        ...prev,
        people: { ...prev.people, [spouseId]: spouse, [childId]: child },
        marriages: { ...prev.marriages, [marriageId]: marriage }
      };
    });
    return childId;
  }, [data.people]);

  /** 清空宗谱（回到未命名空态） */
  const clearAll = useCallback(() => {
    setData({ people: {}, marriages: {} });
  }, []);

  /**
   * 为某人添加一位父/母：另一位父/母以「未知」占位。
   * 返回新建的父/母 id，便于界面立即选中。
   */
  const addParentPerson = useCallback(
    (personId: string, name: string, gender: Gender) => {
      const parentId = crypto.randomUUID();
      const spouseId = crypto.randomUUID();
      const parent: Person = { id: parentId, name, gender };
      const spouse: Person = {
        id: spouseId,
        name: gender === 'male' ? '未知母亲' : '未知父亲',
        gender: gender === 'male' ? 'female' : 'male',
      };
      const marriageId = crypto.randomUUID();
      const marriage: Marriage = {
        id: marriageId,
        husbandId: gender === 'male' ? parentId : spouseId,
        wifeId: gender === 'male' ? spouseId : parentId,
        childrenIds: [personId],
      };

      setData(prev => ({
        ...prev,
        people: { ...prev.people, [parentId]: parent, [spouseId]: spouse },
        marriages: { ...prev.marriages, [marriageId]: marriage },
      }));

      return parentId;
    },
    []
  );

  const addParent = useCallback((personId: string, fatherName: string, motherName: string) => {
    // 1. Create Father and Mother
    const fatherId = crypto.randomUUID();
    const motherId = crypto.randomUUID();
    const father: Person = { id: fatherId, name: fatherName, gender: 'male' };
    const mother: Person = { id: motherId, name: motherName, gender: 'female' };

    // 2. Create Marriage
    const marriageId = crypto.randomUUID();
    const marriage: Marriage = {
      id: marriageId,
      husbandId: fatherId,
      wifeId: motherId,
      childrenIds: [personId],
    };

    setData(prev => ({
      ...prev,
      people: {
        ...prev.people,
        [fatherId]: father,
        [motherId]: mother
      },
      marriages: {
        ...prev.marriages,
        [marriageId]: marriage
      }
    }));
    return marriageId;
  }, []);

  /**
   * 删除成员：同时移除其参与的婚姻，并从其他婚姻的子女列表中摘除。
   * 用于「已添加成员」提示条上的撤销。
   */
  const removePerson = useCallback((personId: string) => {
    setData(prev => {
      const people = { ...prev.people };
      delete people[personId];

      const marriages: Record<string, Marriage> = {};
      Object.values(prev.marriages).forEach(m => {
        if (m.husbandId === personId || m.wifeId === personId) return;
        marriages[m.id] = { ...m, childrenIds: m.childrenIds.filter(id => id !== personId) };
      });

      return { people, marriages };
    });
  }, []);

  const getParentMarriage = useCallback((personId: string) => {
    return Object.values(data.marriages).find(m => m.childrenIds.includes(personId));
  }, [data.marriages]);

  const addSibling = useCallback((personId: string, siblingName: string, gender: Gender, ageRelation: 'older' | 'younger' = 'younger') => {
    const existing = getParentMarriage(personId);
    let targetMarriageId = existing?.id;

    if (!targetMarriageId) {
       // If the person has no parents, we create unknown parents to group the siblings
       targetMarriageId = addParent(personId, '未知父亲', '未知母亲');
    }

    const siblingId = crypto.randomUUID();
    const sibling: Person = { id: siblingId, name: siblingName, gender };

    setData(prev => {
        // Find again in prev to ensure latest state if we just created parents
        const m = prev.marriages[targetMarriageId!];
        if(!m) return prev; // Should not happen

        let newChildrenIds = [...m.childrenIds];
        const personIndex = newChildrenIds.indexOf(personId);
        
        if (personIndex !== -1) {
            if (ageRelation === 'older') {
                newChildrenIds.splice(personIndex, 0, siblingId);
            } else {
                newChildrenIds.splice(personIndex + 1, 0, siblingId);
            }
        } else {
            newChildrenIds.push(siblingId);
        }

        return {
          ...prev,
          people: {
             ...prev.people,
             [siblingId]: sibling
          },
          marriages: {
             ...prev.marriages,
             [targetMarriageId!]: {
                ...m,
                childrenIds: newChildrenIds
             }
          }
        };
    });
    return siblingId;
  }, [getParentMarriage, addParent]);

  /** 载入设计稿中的张氏宗谱示例（4 代 11 人） */
  const loadZhangFamily = useCallback(() => {
    const family = buildZhangFamily();
    setData(family);
    return family;
  }, []);

  /** 载入空态「从模板快速开始」的模板数据 */
  const loadTemplate = useCallback((kind: TemplateKind) => {
    setData(buildTemplate(kind));
  }, []);

  return {
    data,
    addPerson,
    updatePerson,
    addSpouse,
    addChildToPerson,
    addParent,
    addParentPerson,
    addSibling,
    clearAll,
    removePerson,
    getParentMarriage,
    loadZhangFamily,
    loadTemplate,
  };
}
