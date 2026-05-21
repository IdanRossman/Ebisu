import { useCallback, useMemo, useState } from 'react';
import {
  activePlanItems,
  categoryPlannedAmount,
  targetId,
} from '../domain/budget';
import { loadBudgetPlan, saveBudgetPlan } from '../infrastructure/budgetRepository';
import { loadBudgetWatchTargets, saveBudgetWatchTargets } from '../infrastructure/watchRepository';
import { BudgetPlan, BudgetSectionItem, BudgetSectionKey, BudgetSubcategory, BudgetWatchTarget } from '../../../types';
import {
  loadRemoteBudgetPlan,
  loadRemoteWatchTargets,
  saveRemoteBudgetConfiguration,
  saveRemoteWatchTargets,
} from './budgetApi';

export type EditingTarget = {
  section: BudgetSectionKey;
  categoryId: string;
  subcategoryId?: string | null;
};

function makeWatchTarget(section: BudgetSectionKey, categoryId: string, subcategoryId?: string | null): BudgetWatchTarget {
  return { id: targetId(section, categoryId, subcategoryId), section, categoryId, subcategoryId: subcategoryId ?? null };
}

export function isSameWatchTarget(target: BudgetWatchTarget, section: BudgetSectionKey, categoryId: string, subcategoryId?: string | null) {
  return target.section === section && target.categoryId === categoryId && (target.subcategoryId ?? null) === (subcategoryId ?? null);
}

function sectionField(section: BudgetSectionKey) {
  return section === 'steady_obligations' ? 'steadyObligations' : 'householdVessels';
}

export function useBudgetConfiguration() {
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [savedBudget, setSavedBudget] = useState<BudgetPlan | null>(null);
  const [watchTargets, setWatchTargets] = useState<BudgetWatchTarget[]>([]);
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);

  const activeCategories = useMemo(() => budget ? activePlanItems(budget) : [], [budget]);
  const hasUnsavedChanges = useMemo(() => (
    JSON.stringify(budget) !== JSON.stringify(savedBudget)
  ), [budget, savedBudget]);
  const canEditAmount = useMemo(() => {
    if (!budget || !editing) return true;
    if (editing.subcategoryId) return true;
    const category = activePlanItems(budget).find(({ section, item }) => section === editing.section && item.id === editing.categoryId)?.item;
    return !category?.subcategories?.some((subcategory) => !subcategory.archivedAt);
  }, [budget, editing]);

  const refresh = useCallback(async () => {
    const savedBudget = await loadRemoteBudgetPlan().catch(() => loadBudgetPlan());
    const savedTargets = savedBudget
      ? await loadRemoteWatchTargets(savedBudget).catch(() => loadBudgetWatchTargets())
      : [];
    if (savedBudget) await saveBudgetPlan(savedBudget);
    setBudget(savedBudget);
    setSavedBudget(savedBudget);
    setWatchTargets(savedTargets);
    return savedBudget;
  }, []);

  const persistBudget = async (nextBudget: BudgetPlan) => {
    setBudget(nextBudget);
    await saveBudgetPlan(nextBudget);
  };

  const persistWatchTargets = async (nextTargets: BudgetWatchTarget[]) => {
    setWatchTargets(nextTargets);
    await saveRemoteWatchTargets(nextTargets).catch(() => undefined);
    await saveBudgetWatchTargets(nextTargets);
  };

  const updateDraftBudget = (updater: (current: BudgetPlan) => BudgetPlan) => {
    setBudget((current) => {
      if (!current) return current;
      return { ...updater(current), updatedAt: new Date().toISOString() };
    });
  };

  const updateCategoryInDraft = (
    section: BudgetSectionKey,
    categoryId: string,
    updater: (category: BudgetSectionItem) => BudgetSectionItem,
  ) => {
    const field = sectionField(section);
    updateDraftBudget((current) => ({
      ...current,
      [field]: current[field].map((category) => (
        category.id === categoryId ? updater(category) : category
      )),
    }));
  };

  const toggleWatch = async (section: BudgetSectionKey, categoryId: string, subcategoryId?: string | null) => {
    const selected = watchTargets.some((target) => isSameWatchTarget(target, section, categoryId, subcategoryId));
    const nextTargets = selected
      ? watchTargets.filter((target) => !isSameWatchTarget(target, section, categoryId, subcategoryId))
      : [...watchTargets, makeWatchTarget(section, categoryId, subcategoryId)];
    await persistWatchTargets(nextTargets);
  };

  const startEditCategory = (section: BudgetSectionKey, category: BudgetSectionItem) => {
    setEditing({ section, categoryId: category.id });
    setEditName(category.name);
    setEditAmount(String(categoryPlannedAmount(category) || ''));
  };

  const startEditSubcategory = (section: BudgetSectionKey, categoryId: string, subcategory: BudgetSubcategory) => {
    setEditing({ section, categoryId, subcategoryId: subcategory.id });
    setEditName(subcategory.name);
    setEditAmount(String(subcategory.plannedAmount || ''));
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditAmount('');
  };

  const saveEdit = async (input: { name: string; plannedAmount: number }) => {
    if (!budget || !editing) return;

    if (editing.subcategoryId) {
      updateCategoryInDraft(editing.section, editing.categoryId, (category) => {
        const subcategories = category.subcategories?.map((subcategory) => (
          subcategory.id === editing.subcategoryId
            ? { ...subcategory, name: input.name, plannedAmount: input.plannedAmount }
            : subcategory
        )) ?? [];
        return {
          ...category,
          subcategories,
          plannedAmount: subcategories.filter((subcategory) => !subcategory.archivedAt).reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0),
        };
      });
    } else {
      updateCategoryInDraft(editing.section, editing.categoryId, (category) => ({
        ...category,
        name: input.name,
        plannedAmount: category.subcategories?.some((subcategory) => !subcategory.archivedAt)
          ? categoryPlannedAmount(category)
          : input.plannedAmount,
      }));
    }

    cancelEdit();
  };

  const createCategory = (section: BudgetSectionKey) => {
    if (!budget) return;
    const created: BudgetSectionItem = {
      id: `draft-category-${Date.now()}`,
      name: section === 'steady_obligations' ? 'New obligation' : 'New household vessel',
      plannedAmount: 0,
      spentAmount: 0,
      skipped: false,
      subcategories: [],
    };
    updateDraftBudget((current) => ({
      ...current,
      [sectionField(section)]: [...current[sectionField(section)], created],
    }));
    setEditing({ section, categoryId: created.id });
    setEditName(created.name);
    setEditAmount('');
  };

  const createSubcategory = (section: BudgetSectionKey, categoryId: string) => {
    if (!budget) return;
    const created: BudgetSubcategory = {
      id: `draft-subcategory-${Date.now()}`,
      name: 'New smaller vessel',
      plannedAmount: 0,
      spentAmount: 0,
    };
    updateCategoryInDraft(section, categoryId, (category) => ({
      ...category,
      subcategories: [...(category.subcategories ?? []), created],
    }));
    setEditing({ section, categoryId, subcategoryId: created.id });
    setEditName(created.name);
    setEditAmount('');
  };

  const archiveCategory = (section: BudgetSectionKey, categoryId: string) => {
    if (!budget) return;
    updateDraftBudget((current) => ({
      ...current,
      [sectionField(section)]: current[sectionField(section)].map((category) => (
        category.id === categoryId
          ? { ...category, archivedAt: category.archivedAt ?? new Date().toISOString() }
          : category
      )),
    }));
    setWatchTargets(watchTargets.filter((target) => !(target.section === section && target.categoryId === categoryId)));
  };

  const archiveSubcategory = (section: BudgetSectionKey, categoryId: string, subcategoryId: string) => {
    if (!budget) return;
    updateCategoryInDraft(section, categoryId, (category) => {
      const subcategories = category.subcategories?.map((subcategory) => (
        subcategory.id === subcategoryId
          ? { ...subcategory, archivedAt: subcategory.archivedAt ?? new Date().toISOString() }
          : subcategory
      )) ?? [];
      return {
        ...category,
        subcategories,
        plannedAmount: subcategories.filter((subcategory) => !subcategory.archivedAt).reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0),
        spentAmount: subcategories.filter((subcategory) => !subcategory.archivedAt).reduce((sum, subcategory) => sum + subcategory.spentAmount, 0),
      };
    });
    setWatchTargets(watchTargets.filter((target) => !isSameWatchTarget(target, section, categoryId, subcategoryId)));
  };

  const updateReserveTarget = (reserveTargetAmount: number | null) => {
    if (!budget) return;
    updateDraftBudget((current) => ({ ...current, reserveTargetAmount }));
  };

  const updateFundingAmount = (fundingAmount: number | null) => {
    if (!budget) return;
    updateDraftBudget((current) => ({ ...current, fundingAmount }));
  };

  const saveChanges = async () => {
    if (!budget || savingChanges) return;
    setSavingChanges(true);
    try {
      const nextBudget = await saveRemoteBudgetConfiguration(budget);
      if (nextBudget) {
        await persistBudget(nextBudget);
        setSavedBudget(nextBudget);
      }
      await persistWatchTargets(watchTargets);
    } finally {
      setSavingChanges(false);
    }
  };

  return {
    budget,
    watchTargets,
    editing,
    editName,
    setEditName,
    editAmount,
    setEditAmount,
    activeCategories,
    canEditAmount,
    hasUnsavedChanges,
    savingChanges,
    refresh,
    toggleWatch,
    startEditCategory,
    startEditSubcategory,
    cancelEdit,
    saveEdit,
    archiveCategory,
    archiveSubcategory,
    createCategory,
    createSubcategory,
    updateReserveTarget,
    updateFundingAmount,
    saveChanges,
  };
}
