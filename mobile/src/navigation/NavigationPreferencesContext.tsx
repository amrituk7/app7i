import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { firestore } from "../services/firebase";

export type InstructorModuleKey =
  | "lessons"
  | "calendar"
  | "students"
  | "learning"
  | "tests"
  | "earnings"
  | "car";

export type InstructorModule = {
  key: InstructorModuleKey;
  label: string;
  shortLabel: string;
  icon: string;
  iconFilled: string;
  tabRoute: string;
  stackRoute: string;
  description: string;
};

export const INSTRUCTOR_MODULES: InstructorModule[] = [
  { key: "lessons", label: "Today's lessons", shortLabel: "Lessons", icon: "car-outline", iconFilled: "car", tabRoute: "LessonsTab", stackRoute: "ModuleLessons", description: "Today's lesson list and attendance" },
  { key: "calendar", label: "Schedule", shortLabel: "Schedule", icon: "calendar-outline", iconFilled: "calendar", tabRoute: "CalendarTab", stackRoute: "ModuleCalendar", description: "Day and week calendar" },
  { key: "students", label: "Students", shortLabel: "Students", icon: "people-outline", iconFilled: "people", tabRoute: "StudentsTab", stackRoute: "ModuleStudents", description: "Learner profiles and progress" },
  { key: "learning", label: "Learning Hub", shortLabel: "Learning", icon: "school-outline", iconFilled: "school", tabRoute: "LearningTab", stackRoute: "ResourceLibrary", description: "Teaching resources and learning records" },
  { key: "tests", label: "Practical tests", shortLabel: "Tests", icon: "ribbon-outline", iconFilled: "ribbon", tabRoute: "TestsTab", stackRoute: "PracticalTests", description: "Upcoming practical test plans" },
  { key: "earnings", label: "Earnings", shortLabel: "Earnings", icon: "wallet-outline", iconFilled: "wallet", tabRoute: "EarningsTab", stackRoute: "ModuleEarnings", description: "Statements, expenses and payments" },
  { key: "car", label: "Car health", shortLabel: "Car", icon: "shield-checkmark-outline", iconFilled: "shield-checkmark", tabRoute: "CarTab", stackRoute: "ModuleCar", description: "Vehicle records and key dates" },
];

const DEFAULT_TABS: InstructorModuleKey[] = ["calendar", "students", "earnings"];

type NavigationPreferencesValue = {
  selectedTabs: InstructorModuleKey[];
  loading: boolean;
  saveSelectedTabs: (tabs: InstructorModuleKey[]) => Promise<void>;
};

const NavigationPreferencesContext = createContext<NavigationPreferencesValue>({
  selectedTabs: DEFAULT_TABS,
  loading: true,
  saveSelectedTabs: async () => undefined,
});

function storageKey(uid: string) {
  return `app7i:navigation-tabs:${uid}`;
}

function validTabs(value: unknown): InstructorModuleKey[] | null {
  if (!Array.isArray(value)) return null;
  const allowed = new Set(INSTRUCTOR_MODULES.map((item) => item.key));
  const unique = value.filter((item): item is InstructorModuleKey => typeof item === "string" && allowed.has(item as InstructorModuleKey));
  return new Set(unique).size === 3 ? Array.from(new Set(unique)).slice(0, 3) : null;
}

export function NavigationPreferencesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [selectedTabs, setSelectedTabs] = useState<InstructorModuleKey[]>(DEFAULT_TABS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.uid || user.role !== "instructor") {
        if (active) { setSelectedTabs(DEFAULT_TABS); setLoading(false); }
        return;
      }
      setLoading(true);
      const cachedRaw = await AsyncStorage.getItem(storageKey(user.uid)).catch(() => null);
      let cached: InstructorModuleKey[] | null = null;
      try {
        cached = cachedRaw ? validTabs(JSON.parse(cachedRaw)) : null;
      } catch {
        cached = null;
      }
      if (cached && active) setSelectedTabs(cached);
      if (firestore) {
        const remote = await getDoc(doc(firestore, "users", user.uid, "settings", "navigation")).catch(() => null);
        const remoteTabs = remote?.exists() ? validTabs(remote.data().selectedTabs) : null;
        if (remoteTabs && active) {
          setSelectedTabs(remoteTabs);
          await AsyncStorage.setItem(storageKey(user.uid), JSON.stringify(remoteTabs)).catch(() => undefined);
        }
      }
      if (active) setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [user?.role, user?.uid]);

  const saveSelectedTabs = useCallback(async (tabs: InstructorModuleKey[]) => {
    if (!user?.uid) throw new Error("Sign in before changing navigation tabs.");
    const next = validTabs(tabs);
    if (!next) throw new Error("Choose exactly three different tabs.");
    // Commit locally first so the visible tab bar can rebuild immediately.
    // Cloud sync must never hold up this UI change.
    setSelectedTabs([...next]);
    await AsyncStorage.setItem(storageKey(user.uid), JSON.stringify(next));
    if (firestore) {
      void setDoc(doc(firestore, "users", user.uid, "settings", "navigation"), {
        selectedTabs: next,
        updatedAt: Date.now(),
      }).catch((error) => console.warn("[NavigationPreferences] cloud sync failed", error));
    }
  }, [user?.uid]);

  const value = useMemo(() => ({ selectedTabs, loading, saveSelectedTabs }), [loading, saveSelectedTabs, selectedTabs]);
  return <NavigationPreferencesContext.Provider value={value}>{children}</NavigationPreferencesContext.Provider>;
}

export function useNavigationPreferences() {
  return useContext(NavigationPreferencesContext);
}

export function getInstructorModule(key: InstructorModuleKey) {
  return INSTRUCTOR_MODULES.find((item) => item.key === key) || INSTRUCTOR_MODULES[0];
}
