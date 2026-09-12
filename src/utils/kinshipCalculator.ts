import { FamilyData } from '../types';

const kinshipDictionary: Record<string, string> = {
  '': '自己',
  'f': '父亲',
  'm': '母亲',
  'h': '丈夫',
  'w': '妻子',
  's': '儿子',
  'd': '女儿',

  'f,f': '爷爷',
  'f,m': '奶奶',
  'm,f': '外公',
  'm,m': '外婆',

  's,s': '孙子',
  's,d': '孙女',
  'd,s': '外孙',
  'd,d': '外孙女',

  // Children's spouses
  's,w': '儿媳',
  'd,h': '女婿',
  
  // Grandchildren's spouses
  's,s,w': '孙媳妇',
  's,d,h': '孙女婿',
  'd,s,w': '外孙媳妇',
  'd,d,h': '外孙女婿',

  // Great-grandparents
  'f,f,f': '曾祖父',
  'f,f,m': '曾祖母',

  // Siblings
  'f,os': '哥哥',
  'f,ys': '弟弟',
  'f,od': '姐姐',
  'f,yd': '妹妹',
  'm,os': '哥哥',
  'm,ys': '弟弟',
  'm,od': '姐姐',
  'm,yd': '妹妹',

  // Spouse's Parents
  'h,f': '公公',
  'h,m': '婆婆',
  'w,f': '岳父',
  'w,m': '岳母',

  // Father's Siblings
  'f,f,os': '伯伯',
  'f,f,ys': '叔叔',
  'f,f,od': '姑母/大姑',
  'f,f,yd': '姑姑/小姑',
  'f,m,os': '伯伯',
  'f,m,ys': '叔叔',
  'f,m,od': '姑妈/大姑',
  'f,m,yd': '姑姑/小姑',

  // Mother's Siblings
  'm,f,os': '大舅',
  'm,f,ys': '小舅',
  'm,f,od': '大姨',
  'm,f,yd': '小姨',
  'm,m,os': '大舅',
  'm,m,ys': '小舅',
  'm,m,od': '大姨',
  'm,m,yd': '小姨',

  // Sibling's kids
  'f,os,s': '侄子',
  'f,os,d': '侄女',
  'f,ys,s': '侄子',
  'f,ys,d': '侄女',
  'm,os,s': '外甥',
  'm,os,d': '外甥女',
  'm,ys,s': '外甥',
  'm,ys,d': '外甥女',
  'f,od,s': '外甥',
  'f,od,d': '外甥女',
  'f,yd,s': '外甥',
  'f,yd,d': '外甥女',
  'm,od,s': '外甥',
  'm,od,d': '外甥女',
  'm,yd,s': '外甥',
  'm,yd,d': '外甥女',

  // Siblings' spouses
  'f,os,w': '嫂子',
  'f,ys,w': '弟媳',
  'm,os,w': '嫂子',
  'm,ys,w': '弟媳',
  'f,od,h': '姐夫',
  'f,yd,h': '妹夫',
  'm,od,h': '姐夫',
  'm,yd,h': '妹夫',

  // Spouse's siblings
  'h,f,os': '大伯子',
  'h,f,ys': '小叔子',
  'h,f,od': '大姑子',
  'h,f,yd': '小姑子',
  'h,m,os': '大伯子',
  'h,m,ys': '小叔子',
  'h,m,od': '大姑子',
  'h,m,yd': '小姑子',
  
  'w,f,os': '大舅子',
  'w,f,ys': '小舅子',
  'w,f,od': '大姨子',
  'w,f,yd': '小姨子',
  'w,m,os': '大舅子',
  'w,m,ys': '小舅子',
  'w,m,od': '大姨子',
  'w,m,yd': '小姨子',

  // Fallbacks
  'f,s': '兄弟',
  'f,d': '姐妹',
  'm,s': '兄弟',
  'm,d': '姐妹',
  'f,f,s': '伯/叔',
  'f,f,d': '姑姑',
  'm,f,s': '舅舅',
  'm,f,d': '阿姨',
  'f,s,s': '侄子',
  'f,s,d': '侄女',
  'm,s,s': '外甥',
  'm,s,d': '外甥女',
  'f,d,s': '外甥',
  'f,d,d': '外甥女',
  'f,s,w': '嫂子/弟媳',
  'f,d,h': '姐夫/妹夫',

  // Cousins
  'f,f,os,s': '堂哥/弟',
  'f,f,ys,s': '堂哥/弟',
  'f,f,os,d': '堂姐/妹',
  'f,f,ys,d': '堂姐/妹',
  'f,f,od,s': '表哥/弟',
  'f,f,yd,s': '表哥/弟',
  'f,f,od,d': '表姐/妹',
  'f,f,yd,d': '表姐/妹',

  'm,f,os,s': '表哥/弟',
  'm,f,ys,s': '表哥/弟',
  'm,f,os,d': '表姐/妹',
  'm,f,ys,d': '表姐/妹',
  'm,f,od,s': '表哥/弟',
  'm,f,yd,s': '表哥/弟',
  'm,f,od,d': '表姐/妹',
  'm,f,yd,d': '表姐/妹',
};

export function calculateKinship(data: FamilyData, sourceId: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!data.people[sourceId]) return result;

  const queue: { id: string; path: string[]; prevId: string | null }[] = [{ id: sourceId, path: [], prevId: null }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, path, prevId } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const pathKey = path.join(',');
    if (kinshipDictionary[pathKey]) {
      result[id] = kinshipDictionary[pathKey];
    } else {
      if (path.length > 0 && !result[id]) {
         result[id] = '亲属';
      }
    }

    const person = data.people[id];
    if (!person) continue;

    // Parents
    for (const m of Object.values(data.marriages)) {
      if (m.childrenIds.includes(id)) {
        if (m.husbandId) queue.push({ id: m.husbandId, path: [...path, 'f'], prevId: id });
        if (m.wifeId) queue.push({ id: m.wifeId, path: [...path, 'm'], prevId: id });
      }
    }

    // Children and Spouse
    for (const m of Object.values(data.marriages)) {
      if (m.husbandId === id || m.wifeId === id) {
        // Spouse
        const spouseId = m.husbandId === id ? m.wifeId : m.husbandId;
        if (spouseId) {
           const spouseGender = data.people[spouseId]?.gender;
           queue.push({ id: spouseId, path: [...path, spouseGender === 'male' ? 'h' : 'w'], prevId: id });
        }
        
        // Children
        m.childrenIds.forEach(childId => {
           const childGender = data.people[childId]?.gender;
           
           let ageModifier = '';
           if (prevId && m.childrenIds.includes(prevId)) {
               const prevIndex = m.childrenIds.indexOf(prevId);
               const childIndex = m.childrenIds.indexOf(childId);
               if (childIndex < prevIndex) ageModifier = 'o';
               else if (childIndex > prevIndex) ageModifier = 'y';
           }
           
           const step = ageModifier + (childGender === 'male' ? 's' : 'd');
           queue.push({ id: childId, path: [...path, step], prevId: id });
        });
      }
    }
  }

  return result;
}
