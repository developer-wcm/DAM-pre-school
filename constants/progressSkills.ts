/**
 * SHARED Progress Skills Configuration
 * Single source of truth for both Teacher Progress and Student Profile Progress
 * Extracted from Teacher Progress implementation
 */

export type SkillLevel = 'emerging' | 'developing' | 'proficient' | 'advanced';

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  level: SkillLevel;
  required: boolean;
  notes: string;
}

export const SKILL_LEVELS: { value: SkillLevel; label: string; color: string; progress: number }[] = [
  { value: 'emerging', label: 'Emerging', color: '#E05A5A', progress: 25 },
  { value: 'developing', label: 'Developing', color: '#F39C12', progress: 50 },
  { value: 'proficient', label: 'Proficient', color: '#7B6FE8', progress: 75 },
  { value: 'advanced', label: 'Advanced', color: '#2A9D6E', progress: 100 },
];

// Play Group Skills Structure
export const PLAY_GROUP_SKILLS: Skill[] = [
  // 1. Communication Skills
  { id: 'comm-1', name: 'Listening Skills', emoji: '👂', level: 'emerging', required: true, notes: '' },
  { id: 'comm-2', name: 'Understanding Instructions', emoji: '💭', level: 'emerging', required: true, notes: '' },
  { id: 'comm-3', name: 'Following Instructions', emoji: '✅', level: 'emerging', required: true, notes: '' },
  
  // 2. Participation
  { id: 'part-1', name: 'Arts/Crafts', emoji: '🎨', level: 'emerging', required: false, notes: '' },
  { id: 'part-2', name: 'Any Activities', emoji: '🎯', level: 'emerging', required: false, notes: '' },
  { id: 'part-3', name: 'Sports/Games', emoji: '⚽', level: 'emerging', required: false, notes: '' },
  { id: 'part-4', name: 'Group Play', emoji: '🤝', level: 'emerging', required: false, notes: '' },
  
  // 3. Social Skills
  { id: 'social-1', name: 'Helpful', emoji: '🤗', level: 'emerging', required: true, notes: '' },
  { id: 'social-2', name: 'Patience', emoji: '⏳', level: 'emerging', required: true, notes: '' },
  { id: 'social-3', name: 'Sharing', emoji: '🎁', level: 'emerging', required: true, notes: '' },
  { id: 'social-4', name: 'Cooperation', emoji: '👥', level: 'emerging', required: true, notes: '' },
  
  // 4. Motor Skills
  { id: 'motor-1', name: 'Fine Motor Skills', emoji: '✋', level: 'emerging', required: true, notes: '' },
  { id: 'motor-2', name: 'Gross Motor Skills', emoji: '🏃', level: 'emerging', required: true, notes: '' },
  
  // 5. Cognitive Skills
  { id: 'cog-1', name: 'Cognitive Development', emoji: '🧠', level: 'emerging', required: false, notes: '' },
];

// Pre-KG Skills Structure
export const PRE_KG_SKILLS: Skill[] = [
  // 1. Communication Skills
  { id: 'comm-1', name: 'Listening Skills', emoji: '👂', level: 'emerging', required: true, notes: '' },
  { id: 'comm-2', name: 'Understanding Instructions', emoji: '💭', level: 'emerging', required: true, notes: '' },
  { id: 'comm-3', name: 'Following Instructions', emoji: '✅', level: 'emerging', required: true, notes: '' },
  
  // 2. Participation
  { id: 'part-1', name: 'Arts/Crafts', emoji: '🎨', level: 'emerging', required: false, notes: '' },
  { id: 'part-2', name: 'Activities', emoji: '🎯', level: 'emerging', required: false, notes: '' },
  { id: 'part-3', name: 'Sports/Games', emoji: '⚽', level: 'emerging', required: false, notes: '' },
  { id: 'part-4', name: 'Group Play', emoji: '🤝', level: 'emerging', required: false, notes: '' },
  
  // 3. Social Skills
  { id: 'social-1', name: 'Helpful', emoji: '🤗', level: 'emerging', required: true, notes: '' },
  { id: 'social-2', name: 'Patience', emoji: '⏳', level: 'emerging', required: true, notes: '' },
  { id: 'social-3', name: 'Sharing', emoji: '🎁', level: 'emerging', required: true, notes: '' },
  { id: 'social-4', name: 'Co-operation', emoji: '👥', level: 'emerging', required: true, notes: '' },
  
  // 4. Cognitive
  { id: 'cog-1', name: 'Cognitive Skills', emoji: '🧠', level: 'emerging', required: true, notes: '' },
  
  // 5. Motor Skills
  { id: 'motor-1', name: 'Motor Skills', emoji: '🏃', level: 'emerging', required: true, notes: '' },
  
  // 6. Numerical Literacy
  { id: 'num-1', name: 'Numerical Literacy', emoji: '🔢', level: 'emerging', required: true, notes: '' },
  
  // 7. Language Literacy
  { id: 'lang-1', name: 'English Language', emoji: '🅰️', level: 'emerging', required: true, notes: '' },
  { id: 'lang-2', name: 'Second Language', emoji: '🌐', level: 'emerging', required: false, notes: '' },
  
  // 8. General Knowledge (UTW)
  { id: 'gk-1', name: 'General Knowledge (UTW)', emoji: '🌍', level: 'emerging', required: false, notes: '' },
];

// Junior KG & Senior KG Skills Structure (same for both)
export const JUNIOR_SENIOR_KG_SKILLS: Skill[] = [
  // 1. Language Literacy
  { id: 'lang-1', name: 'English Language', emoji: '🅰️', level: 'emerging', required: true, notes: '' },
  { id: 'lang-2', name: 'Second Language', emoji: '🌐', level: 'emerging', required: false, notes: '' },
  
  // 2. General Knowledge (UTW)
  { id: 'gk-1', name: 'General Knowledge (UTW)', emoji: '🌍', level: 'emerging', required: false, notes: '' },
  
  // 3. Numerical Literacy
  { id: 'num-1', name: 'Numerical Literacy', emoji: '🔢', level: 'emerging', required: true, notes: '' },
  
  // 4. Rhymes and Songs
  { id: 'rhyme-1', name: 'Rhymes and Songs', emoji: '🎵', level: 'emerging', required: false, notes: '' },
  
  // 5. Participation
  { id: 'part-1', name: 'Arts/Crafts', emoji: '🎨', level: 'emerging', required: false, notes: '' },
  { id: 'part-2', name: 'Activities', emoji: '🎯', level: 'emerging', required: false, notes: '' },
  { id: 'part-3', name: 'Sports/Games', emoji: '⚽', level: 'emerging', required: false, notes: '' },
  { id: 'part-4', name: 'Group Play', emoji: '🤝', level: 'emerging', required: false, notes: '' },
  
  // 6. Social Skills
  { id: 'social-1', name: 'Helpful', emoji: '🤗', level: 'emerging', required: true, notes: '' },
  { id: 'social-2', name: 'Patience', emoji: '⏳', level: 'emerging', required: true, notes: '' },
  { id: 'social-3', name: 'Sharing', emoji: '🎁', level: 'emerging', required: true, notes: '' },
  { id: 'social-4', name: 'Co-operation', emoji: '👥', level: 'emerging', required: true, notes: '' },
  
  // 7. Cognitive
  { id: 'cog-1', name: 'Cognitive Skills', emoji: '🧠', level: 'emerging', required: true, notes: '' },
];

/**
 * Class-wise skill mapping
 * Maps class codes to their respective skill sets
 */
export const CLASS_SKILLS_MAP: Record<string, Skill[]> = {
  'PG': PLAY_GROUP_SKILLS,
  'PKG': PRE_KG_SKILLS,
  'JKG': JUNIOR_SENIOR_KG_SKILLS,
  'SKG': JUNIOR_SENIOR_KG_SKILLS,
};

/**
 * Get skills for a specific class
 * @param className - Class code (PG, PKG, JKG, SKG)
 * @returns Array of skills for that class
 */
export function getSkillsForClass(className: string): Skill[] {
  return CLASS_SKILLS_MAP[className] || [];
}

/**
 * Get progress level details
 * @param level - Skill level
 * @returns Level details including color and progress percentage
 */
export function getProgressLevelDetails(level: SkillLevel) {
  return SKILL_LEVELS.find(l => l.value === level) || SKILL_LEVELS[0];
}

/**
 * Get level index for progress calculation
 * @param level - Skill level
 * @returns Index of the level (0-3)
 */
export function getLevelIndex(level: SkillLevel): number {
  return SKILL_LEVELS.findIndex(l => l.value === level);
}
