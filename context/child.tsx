import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from '../lib/supabase';

export interface Child {
  id: string;
  full_name: string;
  class: string | null;
  roll_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  school_id: string | null;
}

interface ChildContextType {
  children: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child) => void;
  loading: boolean;
  refresh: () => void;
}

const ChildContext = createContext<ChildContextType | null>(null);

export function ChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('id, full_name, class, roll_number, gender, date_of_birth, school_id')
      .eq('parent_id', user.id)
      .order('full_name');
    const list = (data ?? []) as Child[];
    setChildren(list);
    // Keep active child in sync — preserve selection if still valid
    setActiveChild((prev) => {
      if (prev && list.find((c) => c.id === prev.id)) return prev;
      return list[0] ?? null;
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  return (
    <ChildContext.Provider value={{ children, activeChild, setActiveChild, loading, refresh: fetchChildren }}>
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used inside ChildProvider');
  return ctx;
}
