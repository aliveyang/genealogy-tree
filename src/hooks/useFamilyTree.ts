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

  const addChild = useCallback((marriageId: string, childName: string, gender: Gender) => {
    const marriage = data.marriages[marriageId];
    if (!marriage) return;

    const childId = crypto.randomUUID();
    const child: Person = { id: childId, name: childName, gender };

    setData(prev => ({
      ...prev,
      people: { ...prev.people, [childId]: child },
      marriages: {
        ...prev.marriages,
        [marriageId]: {
          ...marriage,
          childrenIds: [...marriage.childrenIds, childId]
        }
      }
    }));
    return childId;
  }, [data.marriages]);

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

  const getPersonMarriage = useCallback((personId: string) => {
    return findSpouseMarriage(data.marriages, personId);
  }, [data.marriages]);

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

  const loadExampleData = useCallback((rootName: string = '李四') => {
    // Root
    const rootId = crypto.randomUUID();
    const wifeId = crypto.randomUUID();
    
    // Parents
    const fatherId = crypto.randomUUID();
    const motherId = crypto.randomUUID();
    
    // Grandparents (Father's side)
    const gfId = crypto.randomUUID();
    const gmId = crypto.randomUUID();

    // Grandparents (Mother's side)
    const mgfId = crypto.randomUUID();
    const mgmId = crypto.randomUUID();

    // Siblings
    const olderBrotherId = crypto.randomUUID();
    const olderBrotherWifeId = crypto.randomUUID();
    const youngerSisterId = crypto.randomUUID();

    // Children of Root
    const sonId = crypto.randomUUID();
    const sonWifeId = crypto.randomUUID();
    const daughterId = crypto.randomUUID();
    const daughterHusbandId = crypto.randomUUID();
    
    // Grandchildren of Root
    const gsId = crypto.randomUUID();
    const gdId = crypto.randomUUID();

    // Father's siblings
    const auntId = crypto.randomUUID();
    const auntHusbandId = crypto.randomUUID();

    // Mother's siblings
    const uncleId = crypto.randomUUID();
    
    // Marriages
    const mGrandParentsId = crypto.randomUUID();
    const mMGrandParentsId = crypto.randomUUID();
    const mAuntId = crypto.randomUUID();
    const mParentsId = crypto.randomUUID();
    const mOlderBrotherId = crypto.randomUUID();
    const mRootId = crypto.randomUUID();
    const mSonId = crypto.randomUUID();
    const mDaughterId = crypto.randomUUID();

    const lastName = rootName[0] || '李';

    const people = {
      // Grandparents
      [gfId]: { id: gfId, name: `${lastName}爷爷`, gender: 'male', birthYear: '1940', deathYear: '2015', isDeceased: true },
      [gmId]: { id: gmId, name: '陈奶奶', gender: 'female', birthYear: '1943' },
      [mgfId]: { id: mgfId, name: '王外公', gender: 'male', birthYear: '1945' },
      [mgmId]: { id: mgmId, name: '周外婆', gender: 'female', birthYear: '1948' },

      // Parents and their siblings
      [fatherId]: { id: fatherId, name: `${lastName}父`, gender: 'male', birthYear: '1968' },
      [motherId]: { id: motherId, name: '王母', gender: 'female', birthYear: '1970' },
      [auntId]: { id: auntId, name: `${lastName}姑姑`, gender: 'female', birthYear: '1965' },
      [auntHusbandId]: { id: auntHusbandId, name: '赵姑父', gender: 'male', birthYear: '1962' },
      [uncleId]: { id: uncleId, name: '王舅舅', gender: 'male', birthYear: '1975' },

      // Root and siblings
      [olderBrotherId]: { id: olderBrotherId, name: `${lastName}大`, gender: 'male', birthYear: '1992' },
      [olderBrotherWifeId]: { id: olderBrotherWifeId, name: '刘大嫂', gender: 'female', birthYear: '1994' },
      [rootId]: { id: rootId, name: rootName, gender: 'male', birthYear: '1995' },
      [wifeId]: { id: wifeId, name: '张美丽', gender: 'female', birthYear: '1996' },
      [youngerSisterId]: { id: youngerSisterId, name: `${lastName}小妹`, gender: 'female', birthYear: '1998' },

      // Children
      [sonId]: { id: sonId, name: `${lastName}小明`, gender: 'male', birthYear: '2020' },
      [sonWifeId]: { id: sonWifeId, name: '陈儿媳', gender: 'female', birthYear: '2021' },
      [daughterId]: { id: daughterId, name: `${lastName}小红`, gender: 'female', birthYear: '2023' },
      [daughterHusbandId]: { id: daughterHusbandId, name: '林女婿', gender: 'male', birthYear: '2022' },

      // Grandchildren
      [gsId]: { id: gsId, name: `${lastName}孙孙`, gender: 'male', birthYear: '2045' },
      [gdId]: { id: gdId, name: '林外孙女', gender: 'female', birthYear: '2048' },
    } as Record<string, Person>;

    const marriages: Record<string, Marriage> = {
      [mGrandParentsId]: { id: mGrandParentsId, husbandId: gfId, wifeId: gmId, childrenIds: [auntId, fatherId] },
      [mMGrandParentsId]: { id: mMGrandParentsId, husbandId: mgfId, wifeId: mgmId, childrenIds: [uncleId, motherId] },
      [mAuntId]: { id: mAuntId, husbandId: auntHusbandId, wifeId: auntId, childrenIds: [] },
      [mParentsId]: { id: mParentsId, husbandId: fatherId, wifeId: motherId, childrenIds: [olderBrotherId, rootId, youngerSisterId] },
      [mOlderBrotherId]: { id: mOlderBrotherId, husbandId: olderBrotherId, wifeId: olderBrotherWifeId, childrenIds: [] },
      [mRootId]: { id: mRootId, husbandId: rootId, wifeId: wifeId, childrenIds: [sonId, daughterId] },
      [mSonId]: { id: mSonId, husbandId: sonId, wifeId: sonWifeId, childrenIds: [gsId] },
      [mDaughterId]: { id: mDaughterId, husbandId: daughterHusbandId, wifeId: daughterId, childrenIds: [gdId] },
    };

    setData({ people, marriages });
    return rootId;
  }, []);

  return {
    data,
    addPerson,
    updatePerson,
    addSpouse,
    addChild,
    addChildToPerson,
    addParent,
    addParentPerson,
    addSibling,
    clearAll,
    removePerson,
    getPersonMarriage,
    getParentMarriage,
    loadZhangFamily,
    loadTemplate,
    loadExampleData,
  };
}
