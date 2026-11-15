import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Family,
  Plan,
  AgeGroupKey,
  ProductCode,
  BasketItem,
} from '@/types';
import { PRODUCTS } from '@/domain/calculators/scenarios';

interface AppContextType {
  families: Family[];
  activeFamily: Family | null;
  activeFamilyId: string | null;
  plans: Plan[];
  basketItems: BasketItem[];
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  selectFamily: (id: string) => void;
  createFamily: (name: string, ageCounts: Record<AgeGroupKey, number>) => Family;
  updateFamily: (id: string, name: string, ageCounts: Record<AgeGroupKey, number>) => void;
  archiveFamily: (id: string) => void;
  restoreFamily: (id: string) => void;
  savePlan: (
    planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>,
    setActiveInBasket?: boolean
  ) => Plan;
  duplicatePlan: (planId: string) => Plan;
  deletePlan: (planId: string) => void;
  togglePlanActive: (planId: string) => void;
  getActivePlanForProduct: (productCode: ProductCode) => Plan | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Familia de ejemplo oficial según sección 5.3 del documento base (2 adultos, 2 adolescentes, 1 niño 4-8 años)
const INITIAL_DEMO_FAMILY: Family = {
  id: 'fam-demo-01',
  name: 'Familia Traspatio Modelo',
  archived: false,
  ageCounts: {
    '0-3': 0,
    '4-8': 1,
    '9-13': 0,
    '14-18': 2,
    '19+': 2,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [families, setFamilies] = useState<Family[]>([INITIAL_DEMO_FAMILY]);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>('fam-demo-01');
  const [plans, setPlans] = useState<Plan[]>([]);
  // activeProductPlansMap: "familyId:productCode" -> planId
  const [activeProductPlansMap, setActiveProductPlansMap] = useState<Record<string, string>>({});
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  // Escuchar preferencia de accesibilidad del sistema
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      sub?.remove?.();
    };
  }, []);

  const activeFamily = useMemo(() => {
    return families.find((f) => f.id === activeFamilyId && !f.archived) || null;
  }, [families, activeFamilyId]);

  // Canasta Familiar derivada de planes activos (D-05, RF-29 a RF-32)
  const basketItems = useMemo<BasketItem[]>(() => {
    if (!activeFamilyId) return [];

    const items: BasketItem[] = [];
    const productCodes: ProductCode[] = ['hen_eggs', 'chicken_meat', 'quail_eggs', 'quail_meat'];

    for (const code of productCodes) {
      const key = `${activeFamilyId}:${code}`;
      const activePlanId = activeProductPlansMap[key];
      if (!activePlanId) continue;

      const plan = plans.find((p) => p.id === activePlanId && p.familyId === activeFamilyId);
      if (!plan) continue;

      const prodDef = PRODUCTS[code];
      const res = plan.results;

      let weeklyText = '';
      let annualText: string | undefined = undefined;

      if (code === 'hen_eggs' || code === 'quail_eggs') {
        weeklyText = `${res.weeklyDemand} huevos / semana`;
      } else {
        weeklyText = `${res.weeklyDemand} kg / semana`;
        annualText = `${res.annualDemand} kg / año`;
      }

      items.push({
        productCode: code,
        productName: prodDef.name,
        planId: plan.id,
        planName: plan.name,
        scenarioName: res.scenarioName,
        weeklyDemandText: weeklyText,
        annualDemandText: annualText,
        birdsSummaryText: `${res.primaryBirdsCount} ${res.primaryBirdsLabel.toLowerCase()}`,
        accentColor: prodDef.color,
        lotsSummary: plan.lots ? `${plan.lots.lotsCount} lotes de producción` : undefined,
        breedingSummary: plan.reproduction ? `${plan.reproduction.eggsToIncubate} huevos fértiles a incubar` : undefined,
        updatedAt: plan.updatedAt,
      });
    }

    return items;
  }, [activeFamilyId, activeProductPlansMap, plans]);

  const selectFamily = (id: string) => {
    setActiveFamilyId(id);
  };

  const createFamily = (name: string, ageCounts: Record<AgeGroupKey, number>): Family => {
    const newFamily: Family = {
      id: `fam-${Date.now()}`,
      name: name.trim() || 'Familia sin nombre',
      archived: false,
      ageCounts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFamilies((prev) => [newFamily, ...prev]);
    setActiveFamilyId(newFamily.id);
    return newFamily;
  };

  const updateFamily = (id: string, name: string, ageCounts: Record<AgeGroupKey, number>) => {
    setFamilies((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              name: name.trim() || f.name,
              ageCounts,
              updatedAt: new Date().toISOString(),
            }
          : f
      )
    );
  };

  const archiveFamily = (id: string) => {
    setFamilies((prev) =>
      prev.map((f) => (f.id === id ? { ...f, archived: true, updatedAt: new Date().toISOString() } : f))
    );
    if (activeFamilyId === id) {
      const remaining = families.find((f) => f.id !== id && !f.archived);
      setActiveFamilyId(remaining ? remaining.id : null);
    }
  };

  const restoreFamily = (id: string) => {
    setFamilies((prev) =>
      prev.map((f) => (f.id === id ? { ...f, archived: false, updatedAt: new Date().toISOString() } : f))
    );
    setActiveFamilyId(id);
  };

  const savePlan = (
    planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>,
    setActiveInBasket: boolean = true
  ): Plan => {
    const newPlan: Plan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPlans((prev) => [newPlan, ...prev]);

    if (setActiveInBasket && planData.familyId) {
      const key = `${planData.familyId}:${planData.productCode}`;
      setActiveProductPlansMap((prev) => ({
        ...prev,
        [key]: newPlan.id,
      }));
    }

    return newPlan;
  };

  const duplicatePlan = (planId: string): Plan => {
    const original = plans.find((p) => p.id === planId);
    if (!original) throw new Error('Plan no encontrado');

    const duplicate: Plan = {
      ...original,
      id: `plan-${Date.now()}`,
      name: `${original.name} (Copia)`,
      status: 'inactive',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPlans((prev) => [duplicate, ...prev]);
    return duplicate;
  };

  const deletePlan = (planId: string) => {
    const planToDelete = plans.find((p) => p.id === planId);
    if (planToDelete) {
      const key = `${planToDelete.familyId}:${planToDelete.productCode}`;
      setActiveProductPlansMap((prev) => {
        if (prev[key] === planId) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return prev;
      });
    }
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  const togglePlanActive = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const key = `${plan.familyId}:${plan.productCode}`;
    setActiveProductPlansMap((prev) => {
      const currentActive = prev[key];
      if (currentActive === planId) {
        // Desactivar
        const next = { ...prev };
        delete next[key];
        return next;
      } else {
        // Activar transaccionalmente (D-05)
        return {
          ...prev,
          [key]: planId,
        };
      }
    });
  };

  const getActivePlanForProduct = (productCode: ProductCode): Plan | null => {
    if (!activeFamilyId) return null;
    const key = `${activeFamilyId}:${productCode}`;
    const planId = activeProductPlansMap[key];
    if (!planId) return null;
    return plans.find((p) => p.id === planId) || null;
  };

  return (
    <AppContext.Provider
      value={{
        families,
        activeFamily,
        activeFamilyId,
        plans,
        basketItems,
        reduceMotion,
        setReduceMotion,
        selectFamily,
        createFamily,
        updateFamily,
        archiveFamily,
        restoreFamily,
        savePlan,
        duplicatePlan,
        deletePlan,
        togglePlanActive,
        getActivePlanForProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};

