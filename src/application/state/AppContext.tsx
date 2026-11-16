import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';

import type { ReactNode } from 'react';

import { AccessibilityInfo } from 'react-native';

import { familyService } from '../services/family.service';

import type {
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

  familiesLoading: boolean;
  familyStorageError: string | null;

  plans: Plan[];
  basketItems: BasketItem[];

  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;

  // Funciones originales
  selectFamily: (id: string) => void;

  createFamily: (
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ) => Family;

  updateFamily: (
    id: string,
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ) => void;

  archiveFamily: (id: string) => void;
  restoreFamily: (id: string) => void;

  // Funciones persistentes con SQLite
  createFamilySaved: (
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ) => Promise<Family>;

  selectFamilySaved: (
    id: string
  ) => Promise<void>;

  updateFamilySaved: (
    id: string,
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ) => Promise<Family>;

  archiveFamilySaved: (
    id: string
  ) => Promise<void>;

  restoreFamilySaved: (
    id: string
  ) => Promise<void>;

  // Operaciones de planes
  savePlan: (
    planData: Omit<
      Plan,
      'id' | 'createdAt' | 'updatedAt'
    >,
    setActiveInBasket?: boolean
  ) => Plan;

  duplicatePlan: (planId: string) => Plan;
  deletePlan: (planId: string) => void;
  togglePlanActive: (planId: string) => void;

  getActivePlanForProduct: (
    productCode: ProductCode
  ) => Plan | null;
}


const AppContext = createContext<
  AppContextType | undefined
>(undefined);

// ============================================
// 3. PROVEEDOR GLOBAL
// ============================================

export const AppProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {

  // ==========================================
  // ESTADO DE FAMILIAS
  // ==========================================

  const [families, setFamilies] = useState<Family[]>([]);

  const [
    activeFamilyId,
    setActiveFamilyId,
  ] = useState<string | null>(null);

  const [
    familiesLoading,
    setFamiliesLoading,
  ] = useState(true);

  const [
    familyStorageError,
    setFamilyStorageError,
  ] = useState<string | null>(null);

  // ==========================================
  // ESTADO DE PLANES Y CANASTA
  // ==========================================

  const [plans, setPlans] = useState<Plan[]>([]);

  // "familyId:productCode" -> planId
  const [
    activeProductPlansMap,
    setActiveProductPlansMap,
  ] = useState<Record<string, string>>({});

  // ==========================================
  // ACCESIBILIDAD
  // ==========================================

  const [
    reduceMotion,
    setReduceMotion,
  ] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo
      .isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch((error) => {
        console.warn(
          'Error al consultar movimiento reducido:',
          error
        );
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      }
    );

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    async function loadFamilies() {
      try {
        setFamilyStorageError(null);

        const savedFamilies =
          await familyService.getAll();

        console.log(
          'FAMILIAS RECUPERADAS DE SQLITE:',
          savedFamilies.map((family) => ({
            id: family.id,
            name: family.name,
            archived: family.archived,
          }))
        );


        const selectedId =
          await familyService.getSelectedFamilyId();

        if (!mounted) return;

        setFamilies(savedFamilies);

        const validSelection = savedFamilies.some(
          (family) =>
            family.id === selectedId &&
            !family.archived
        );

        const fallbackId = savedFamilies.find(
          (family) => !family.archived
        )?.id ?? null;

        setActiveFamilyId(
          validSelection ? selectedId : fallbackId
        );

      } catch (error) {
        if (!mounted) return;

        console.error(
          'Error al cargar familias:',
          error
        );

        setFamilyStorageError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las familias'
        );

      } finally {
        if (mounted) {
          setFamiliesLoading(false);
        }
      }
    }

    void loadFamilies();

    return () => {
      mounted = false;
    };
  }, []);



  const assertFamiliesReady = () => {
    if (familiesLoading) {
      throw new Error(
        'Las familias todavía se están cargando'
      );
    }

    if (familyStorageError) {
      throw new Error(
        'No se pudo inicializar el almacenamiento: ' +
        familyStorageError
      );
    }
  };


  const activeFamily = useMemo(() => {
    return (
      families.find(
        (family) =>
          family.id === activeFamilyId &&
          !family.archived
      ) || null
    );
  }, [families, activeFamilyId]);

  // ==========================================
  // 7. CANASTA DERIVADA DE PLANES ACTIVOS
  // ==========================================

  const basketItems = useMemo<BasketItem[]>(() => {
    if (!activeFamilyId) {
      return [];
    }

    const items: BasketItem[] = [];

    const productCodes: ProductCode[] = [
      'hen_eggs',
      'chicken_meat',
      'quail_eggs',
      'quail_meat',
    ];

    for (const code of productCodes) {
      const key = `${activeFamilyId}:${code}`;

      const activePlanId =
        activeProductPlansMap[key];

      if (!activePlanId) {
        continue;
      }

      const plan = plans.find(
        (p) =>
          p.id === activePlanId &&
          p.familyId === activeFamilyId
      );

      if (!plan) {
        continue;
      }

      const prodDef = PRODUCTS[code];
      const res = plan.results;

      let weeklyText = '';
      let annualText: string | undefined;

      if (
        code === 'hen_eggs' ||
        code === 'quail_eggs'
      ) {
        weeklyText =
          `${res.weeklyDemand} huevos / semana`;
      } else {
        weeklyText =
          `${res.weeklyDemand} kg / semana`;

        annualText =
          `${res.annualDemand} kg / año`;
      }

      items.push({
        productCode: code,
        productName: prodDef.name,
        planId: plan.id,
        planName: plan.name,
        scenarioName: res.scenarioName,
        weeklyDemandText: weeklyText,
        annualDemandText: annualText,
        birdsSummaryText:
          `${res.primaryBirdsCount} ` +
          res.primaryBirdsLabel.toLowerCase(),
        accentColor: prodDef.color,
        lotsSummary: plan.lots
          ? `${plan.lots.lotsCount} lotes de producción`
          : undefined,
        breedingSummary: plan.reproduction
          ? `${plan.reproduction.eggsToIncubate} huevos fértiles a incubar`
          : undefined,
        updatedAt: plan.updatedAt,
      });
    }

    return items;
  }, [
    activeFamilyId,
    activeProductPlansMap,
    plans,
  ]);

  // ==========================================
  // 8. FUNCIONES ORIGINALES DE FAMILIAS
  // ==========================================

  // Estas funciones se mantienen para no
  // romper las pantallas existentes.
  // Todavía modifican solamente la memoria.

  const selectFamily = (id: string) => {
    setActiveFamilyId(id);
  };

  const createFamily = (
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ): Family => {
    const now = new Date().toISOString();

    const newFamily: Family = {
      id: `fam-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      name: name.trim() || 'Familia sin nombre',
      archived: false,
      ageCounts: { ...ageCounts },
      createdAt: now,
      updatedAt: now,
    };

    setFamilies((prev) => [
      newFamily,
      ...prev,
    ]);

    setActiveFamilyId(newFamily.id);

    return newFamily;
  };

  const updateFamily = (
    id: string,
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id
          ? {
            ...family,
            name: name.trim() || family.name,
            ageCounts: { ...ageCounts },
            updatedAt: new Date().toISOString(),
          }
          : family
      )
    );
  };

  const archiveFamily = (id: string) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id
          ? {
            ...family,
            archived: true,
            updatedAt: new Date().toISOString(),
          }
          : family
      )
    );

    if (activeFamilyId === id) {
      const remaining = families.find(
        (family) =>
          family.id !== id &&
          !family.archived
      );

      setActiveFamilyId(
        remaining?.id ?? null
      );
    }
  };

  const restoreFamily = (id: string) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id
          ? {
            ...family,
            archived: false,
            updatedAt: new Date().toISOString(),
          }
          : family
      )
    );

    setActiveFamilyId(id);
  };

  // ==========================================
  // 9. CREAR FAMILIA EN SQLITE
  // ==========================================

  const createFamilySaved = async (
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ): Promise<Family> => {
    assertFamiliesReady();

    const now = new Date().toISOString();

    const newFamily: Family = {
      id: `fam-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      name: name.trim() || 'Familia sin nombre',
      archived: false,
      ageCounts: { ...ageCounts },
      createdAt: now,
      updatedAt: now,
    };

    // Primero guardar en SQLite
    const savedFamily =
      await familyService.create(newFamily);

    // Después actualizar la interfaz
    setFamilies((prev) => [
      savedFamily,
      ...prev.filter(
        (family) => family.id !== savedFamily.id
      ),
    ]);

    setActiveFamilyId(savedFamily.id);

    try {
      await familyService.setSelectedFamilyId(
        savedFamily.id
      );
    } catch (error) {
      console.warn(
        'Familia guardada, pero falló la selección:',
        error
      );
    }

    return savedFamily;
  };

  // ==========================================
  // 10. SELECCIONAR FAMILIA EN SQLITE
  // ==========================================

  const selectFamilySaved = async (
    id: string
  ): Promise<void> => {
    assertFamiliesReady();

    const exists = families.some(
      (family) =>
        family.id === id &&
        !family.archived
    );

    if (!exists) {
      throw new Error(
        'La familia no existe o está archivada'
      );
    }

    // Persistir antes de cambiar el estado
    await familyService.setSelectedFamilyId(id);

    setActiveFamilyId(id);
  };

  // ==========================================
  // 11. ACTUALIZAR FAMILIA EN SQLITE
  // ==========================================

  const updateFamilySaved = async (
    id: string,
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ): Promise<Family> => {
    assertFamiliesReady();

    const updated = await familyService.update(
      id,
      name,
      ageCounts
    );

    if (!updated) {
      throw new Error(
        'No se encontró la familia que deseas editar'
      );
    }

    // Actualizar React solo después de SQLite
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id ? updated : family
      )
    );

    return updated;
  };

  // ==========================================
  // 12. ARCHIVAR FAMILIA EN SQLITE
  // ==========================================

  const archiveFamilySaved = async (
    id: string
  ): Promise<void> => {
    assertFamiliesReady();

    const changed = await familyService.archive(id);

    if (!changed) {
      throw new Error(
        'No se encontró la familia que deseas archivar'
      );
    }

    const updated = await familyService.getById(id);

    if (!updated) {
      throw new Error(
        'No se pudo recuperar la familia archivada'
      );
    }

    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id ? updated : family
      )
    );

    // Si se archiva la familia activa,
    // seleccionar otra disponible.
    if (activeFamilyId === id) {
      const nextFamily = families.find(
        (family) =>
          family.id !== id &&
          !family.archived
      );

      const nextId = nextFamily?.id ?? null;

      setActiveFamilyId(nextId);

      try {
        await familyService.setSelectedFamilyId(
          nextId
        );
      } catch (error) {
        console.warn(
          'Familia archivada, pero no se pudo persistir la nueva selección:',
          error
        );
      }
    }
  };

  // ==========================================
  // 13. RESTAURAR FAMILIA EN SQLITE
  // ==========================================

  const restoreFamilySaved = async (
    id: string
  ): Promise<void> => {
    assertFamiliesReady();

    const changed = await familyService.restore(id);

    if (!changed) {
      throw new Error(
        'No se encontró la familia que deseas restaurar'
      );
    }

    const updated = await familyService.getById(id);

    if (!updated) {
      throw new Error(
        'No se pudo recuperar la familia restaurada'
      );
    }

    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id ? updated : family
      )
    );

    setActiveFamilyId(id);

    try {
      await familyService.setSelectedFamilyId(id);
    } catch (error) {
      console.warn(
        'Familia restaurada, pero no se pudo guardar la selección:',
        error
      );
    }
  };


  const savePlan = (
    planData: Omit<
      Plan,
      'id' | 'createdAt' | 'updatedAt'
    >,
    setActiveInBasket: boolean = true
  ): Plan => {
    const now = new Date().toISOString();

    const newPlan: Plan = {
      ...planData,
      id: `plan-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };

    setPlans((prev) => [
      newPlan,
      ...prev,
    ]);

    if (
      setActiveInBasket &&
      planData.familyId
    ) {
      const key =
        `${planData.familyId}:${planData.productCode}`;

      setActiveProductPlansMap((prev) => ({
        ...prev,
        [key]: newPlan.id,
      }));
    }

    return newPlan;
  };


  const duplicatePlan = (planId: string): Plan => {
    const original = plans.find(
      (plan) => plan.id === planId
    );

    if (!original) {
      throw new Error('Plan no encontrado');
    }

    const now = new Date().toISOString();

    const duplicate: Plan = {
      ...original,
      id: `plan-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      name: `${original.name} (Copia)`,
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    };

    setPlans((prev) => [
      duplicate,
      ...prev,
    ]);

    return duplicate;
  };


  const deletePlan = (planId: string) => {
    const planToDelete = plans.find(
      (plan) => plan.id === planId
    );

    if (planToDelete) {
      const key =
        `${planToDelete.familyId}:${planToDelete.productCode}`;

      setActiveProductPlansMap((prev) => {
        if (prev[key] === planId) {
          const next = { ...prev };
          delete next[key];

          return next;
        }

        return prev;
      });
    }

    setPlans((prev) =>
      prev.filter((plan) => plan.id !== planId)
    );
  };


  const togglePlanActive = (planId: string) => {
    const plan = plans.find(
      (item) => item.id === planId
    );

    if (!plan) {
      return;
    }

    const key =
      `${plan.familyId}:${plan.productCode}`;

    setActiveProductPlansMap((prev) => {
      if (prev[key] === planId) {
        const next = { ...prev };
        delete next[key];

        return next;
      }

      return {
        ...prev,
        [key]: planId,
      };
    });
  };

  // ==========================================
  // 18. OBTENER PLAN ACTIVO POR PRODUCTO
  // ==========================================

  const getActivePlanForProduct = (
    productCode: ProductCode
  ): Plan | null => {
    if (!activeFamilyId) {
      return null;
    }

    const key =
      `${activeFamilyId}:${productCode}`;

    const planId =
      activeProductPlansMap[key];

    if (!planId) {
      return null;
    }

    return plans.find(
      (plan) => plan.id === planId
    ) || null;
  };

  return (
    <AppContext.Provider
      value={{
        families,
        activeFamily,
        activeFamilyId,

        familiesLoading,
        familyStorageError,

        plans,
        basketItems,

        reduceMotion,
        setReduceMotion,

        selectFamily,
        createFamily,
        updateFamily,
        archiveFamily,
        restoreFamily,

        createFamilySaved,
        selectFamilySaved,
        updateFamilySaved,
        archiveFamilySaved,
        restoreFamilySaved,

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
    throw new Error(
      'useApp debe ser usado dentro de un AppProvider'
    );
  }

  return context;
};
