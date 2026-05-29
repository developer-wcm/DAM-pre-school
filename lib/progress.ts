import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Skill } from '../constants/progressSkills';

export function progressStorageKey(studentId: string, term: number) {
  return `student_progress:${studentId}:term:${term}`;
}

export async function loadStudentProgress(
  studentId: string,
  term: number
): Promise<Skill[] | null> {
  try {
    const raw = await AsyncStorage.getItem(progressStorageKey(studentId, term));
    if (!raw) return null;
    return JSON.parse(raw) as Skill[];
  } catch {
    return null;
  }
}

export async function saveStudentProgress(
  studentId: string,
  term: number,
  skills: Skill[]
): Promise<void> {
  await AsyncStorage.setItem(progressStorageKey(studentId, term), JSON.stringify(skills));
}

export function mergeSkillsWithSaved(defaults: Skill[], saved: Skill[] | null): Skill[] {
  if (!saved?.length) return defaults.map((skill) => ({ ...skill }));

  const savedById = new Map(saved.map((skill) => [skill.id, skill]));
  return defaults.map((skill) => {
    const stored = savedById.get(skill.id);
    if (!stored) return { ...skill };
    return {
      ...skill,
      level: stored.level,
      notes: stored.notes ?? '',
    };
  });
}
