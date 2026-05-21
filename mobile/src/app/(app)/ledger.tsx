import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Space } from '../../constants/theme';
import { loadBudgetPlan, saveBudgetPlan } from '../../lib/budget';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '../../features/budget/domain/money';
import { activePlanItems, sectionItems } from '../../features/budget/domain/budget';
import { deleteRemoteExpense, loadRemoteBudgetPlan, updateRemoteExpense } from '../../features/budget/application/budgetApi';
import { monthLabel } from '../../features/budget/presentation/format';
import type { BudgetPlan, BudgetSectionKey, ExpenseEntry } from '../../types';

type ReportView = 'day' | 'vessel';
type ExpenseTarget = {
  id: string;
  section: BudgetSectionKey;
  categoryId: string;
  subcategoryId?: string | null;
  displayLabel: string;
  parentLabel?: string;
};
type EditDraft = { amount: string; payeeName: string; note: string; date: string; targetId: string };

function dropIn(opacity: Animated.Value, translateY: Animated.Value, duration = 460) {
  return Animated.parallel([
    Animated.timing(opacity, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    Animated.timing(translateY, { toValue: 0, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
  ]);
}

function ordinalDay(day: number) {
  if (day >= 11 && day <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}

function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function compactDateLabel(dateKey: string) {
  const date = dateFromKey(dateKey);
  if (Number.isNaN(date.getTime())) return dateKey;
  return `${ordinalDay(date.getDate())} ${date.toLocaleString(undefined, { month: 'short' })}`;
}

function sectionLabel(section: BudgetSectionKey) {
  return section === 'steady_obligations' ? 'Steady obligations' : 'Household vessels';
}

function expenseLabel(expense: ExpenseEntry, budget: BudgetPlan) {
  const category = sectionItems(budget, expense.section).find((item) => item.id === expense.categoryId);
  const subcategory = category?.subcategories?.find((item) => item.id === expense.subcategoryId);
  const categoryLabel = expense.categoryNameSnapshot ?? category?.name ?? 'Household';
  const subcategoryLabel = expense.subcategoryNameSnapshot ?? subcategory?.name ?? null;
  return subcategoryLabel ? `${categoryLabel} / ${subcategoryLabel}` : categoryLabel;
}

function primaryExpenseTitle(expense: ExpenseEntry, budget: BudgetPlan) {
  return expense.payeeName.trim() || expenseLabel(expense, budget);
}

function secondaryExpenseMeta(expense: ExpenseEntry, budget: BudgetPlan, includeDate = true) {
  return [
    expenseLabel(expense, budget),
    expense.note.trim(),
    includeDate ? compactDateLabel(expense.date) : '',
  ].filter(Boolean).join(' · ');
}

function buildTargets(plan: BudgetPlan): ExpenseTarget[] {
  return activePlanItems(plan).flatMap(({ section, item }) => [
    { id: item.id, section, categoryId: item.id, subcategoryId: null, displayLabel: item.name },
    ...(item.subcategories?.map((subcategory) => ({
      id: subcategory.id,
      section,
      categoryId: item.id,
      subcategoryId: subcategory.id,
      displayLabel: subcategory.name,
      parentLabel: item.name,
    })) ?? []),
  ]);
}

function targetForExpense(expense: ExpenseEntry) {
  return expense.subcategoryId ?? expense.categoryId;
}

function recomputeSpentAmounts(plan: BudgetPlan): BudgetPlan {
  const zeroed = (items: BudgetPlan['householdVessels']) => items.map((category) => ({
    ...category,
    spentAmount: 0,
    subcategories: category.subcategories?.map((subcategory) => ({ ...subcategory, spentAmount: 0 })),
  }));
  const next: BudgetPlan = {
    ...plan,
    steadyObligations: zeroed(plan.steadyObligations),
    householdVessels: zeroed(plan.householdVessels),
  };
  next.expenses.forEach((expense) => {
    const category = sectionItems(next, expense.section).find((item) => item.id === expense.categoryId);
    if (!category) return;
    if (expense.subcategoryId && category.subcategories?.length) {
      const subcategory = category.subcategories.find((item) => item.id === expense.subcategoryId);
      if (subcategory) subcategory.spentAmount = Math.round((subcategory.spentAmount + expense.amount) * 100) / 100;
      category.spentAmount = Math.round(category.subcategories.reduce((sum, item) => sum + item.spentAmount, 0) * 100) / 100;
    } else {
      category.spentAmount = Math.round((category.spentAmount + expense.amount) * 100) / 100;
    }
  });
  return next;
}

function applyExpensePatch(plan: BudgetPlan, expenseId: string, nextExpense: Omit<ExpenseEntry, 'id' | 'createdAt'>) {
  return recomputeSpentAmounts({
    ...plan,
    expenses: plan.expenses.map((expense) => (expense.id === expenseId ? { ...expense, ...nextExpense } : expense)),
    updatedAt: new Date().toISOString(),
  });
}

function removeExpenseFromPlan(plan: BudgetPlan, expenseId: string) {
  return recomputeSpentAmounts({
    ...plan,
    expenses: plan.expenses.filter((expense) => expense.id !== expenseId),
    updatedAt: new Date().toISOString(),
  });
}

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportView, setReportView] = useState<ReportView>('day');
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerDrop = useRef(new Animated.Value(-10)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyDrop = useRef(new Animated.Value(-8)).current;

  const refresh = useCallback(async () => {
    const savedBudget = await loadRemoteBudgetPlan().catch(() => loadBudgetPlan());
    if (!savedBudget) {
      router.replace('/budget-setup');
      return;
    }
    await saveBudgetPlan(savedBudget);
    setBudget(savedBudget);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    if (!budget) return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;
      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerDrop.setValue(0);
        bodyOpacity.setValue(1);
        bodyDrop.setValue(0);
        return;
      }
      headerOpacity.setValue(0);
      headerDrop.setValue(-10);
      bodyOpacity.setValue(0);
      bodyDrop.setValue(-8);
      animation = Animated.sequence([dropIn(headerOpacity, headerDrop, 500), Animated.delay(130), dropIn(bodyOpacity, bodyDrop, 430)]);
      animation.start();
    });
    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [bodyDrop, bodyOpacity, budget, headerDrop, headerOpacity]);

  const targets = useMemo(() => (budget ? buildTargets(budget) : []), [budget]);
  const spentTotal = useMemo(() => budget?.expenses.reduce((sum, expense) => sum + expense.amount, 0) ?? 0, [budget]);
  const dayGroups = useMemo(() => {
    if (!budget) return [];
    const grouped = new Map<string, ExpenseEntry[]>();
    [...budget.expenses]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .forEach((expense) => grouped.set(expense.date, [...(grouped.get(expense.date) ?? []), expense]));
    return [...grouped.entries()].map(([date, expenses]) => ({
      date,
      total: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      expenses,
    }));
  }, [budget]);
  const vesselGroups = useMemo(() => {
    if (!budget) return [];
    return (['steady_obligations', 'household_vessels'] as const).map((section) => {
      const categories = sectionItems(budget, section).map((category) => {
        const directExpenses = budget.expenses.filter((expense) => expense.section === section && expense.categoryId === category.id && !expense.subcategoryId);
        const subcategories = (category.subcategories ?? []).map((subcategory) => {
          const expenses = budget.expenses.filter((expense) => expense.section === section && expense.subcategoryId === subcategory.id);
          return { id: subcategory.id, name: subcategory.name, total: expenses.reduce((sum, expense) => sum + expense.amount, 0), expenses };
        }).filter((item) => item.expenses.length > 0);
        return {
          id: category.id,
          name: category.name,
          total: [...directExpenses, ...subcategories.flatMap((item) => item.expenses)].reduce((sum, expense) => sum + expense.amount, 0),
          directExpenses,
          subcategories,
        };
      }).filter((category) => category.directExpenses.length > 0 || category.subcategories.length > 0);
      return { section, categories, total: categories.reduce((sum, category) => sum + category.total, 0) };
    }).filter((group) => group.categories.length > 0);
  }, [budget]);

  const openEdit = (expense: ExpenseEntry) => {
    setActiveExpenseId(null);
    setEditingExpense(expense);
    setEditDraft({
      amount: formatMoneyInput(String(expense.amount)),
      payeeName: expense.payeeName,
      note: expense.note,
      date: expense.date,
      targetId: targetForExpense(expense),
    });
  };

  const saveEdit = async () => {
    if (!budget || !editingExpense || !editDraft) return;
    const target = targets.find((candidate) => candidate.id === editDraft.targetId);
    const amount = parseMoneyInput(editDraft.amount);
    if (!target) return Alert.alert('Vessel needed', 'Choose where this expense belongs.');
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert('Amount needed', 'Enter a valid amount.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDraft.date) || Number.isNaN(dateFromKey(editDraft.date).getTime())) {
      return Alert.alert('Date needed', 'Use a date like 2026-05-20.');
    }
    const nextExpense: Omit<ExpenseEntry, 'id' | 'createdAt'> = {
      section: target.section,
      categoryId: target.categoryId,
      subcategoryId: target.subcategoryId,
      categoryNameSnapshot: target.parentLabel ?? target.displayLabel,
      subcategoryNameSnapshot: target.parentLabel ? target.displayLabel : null,
      amount,
      payeeName: editDraft.payeeName.trim(),
      note: editDraft.note.trim(),
      date: editDraft.date,
    };
    setSavingEdit(true);
    try {
      const remoteBudget = await updateRemoteExpense(budget, editingExpense.id, nextExpense);
      const nextBudget = remoteBudget ?? applyExpensePatch(budget, editingExpense.id, nextExpense);
      await saveBudgetPlan(nextBudget);
      setBudget(nextBudget);
      setEditingExpense(null);
      setEditDraft(null);
    } catch {
      Alert.alert('Could not save', 'The expense could not be updated. Restart the backend if it was just changed.');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = (expense: ExpenseEntry) => {
    if (!budget) return;
    setActiveExpenseId(null);
    Alert.alert('Delete expense?', `${primaryExpenseTitle(expense, budget)} · ${formatMoney(expense.amount, budget.currency)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingExpenseId(expense.id);
          try {
            const remoteBudget = await deleteRemoteExpense(expense.id);
            const nextBudget = remoteBudget ?? removeExpenseFromPlan(budget, expense.id);
            await saveBudgetPlan(nextBudget);
            setBudget(nextBudget);
          } catch {
            Alert.alert('Could not delete', 'The expense could not be removed. Restart the backend if it was just changed.');
          } finally {
            setDeletingExpenseId(null);
          }
        },
      },
    ]);
  };

  if (loading || !budget) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Opening the expense report.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderExpenseRow = (expense: ExpenseEntry, includeDate = true) => {
    const actionsOpen = activeExpenseId === expense.id;
    const busy = deletingExpenseId === expense.id;
    return (
      <View key={expense.id} style={[styles.entryCard, actionsOpen && styles.entryCardOpen]}>
        <View style={styles.entryRow}>
          <View style={styles.entryCopy}>
            <Text style={styles.entryLabel} numberOfLines={1}>{primaryExpenseTitle(expense, budget)}</Text>
            <Text style={styles.entryMeta} numberOfLines={2}>{secondaryExpenseMeta(expense, budget, includeDate)}</Text>
          </View>
          <View style={styles.entryTrailing}>
            <Text style={styles.entryAmount}>{formatMoney(expense.amount, budget.currency)}</Text>
            <TouchableOpacity onPress={() => setActiveExpenseId(actionsOpen ? null : expense.id)} activeOpacity={0.74} style={styles.moreButton}>
              {busy ? <ActivityIndicator size="small" color={Colors.palette.green} /> : <MaterialIcons name="more-vert" size={18} color={Colors.text.secondary} />}
            </TouchableOpacity>
          </View>
        </View>
        {actionsOpen ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => openEdit(expense)} activeOpacity={0.78} style={styles.actionButton}>
              <MaterialIcons name="edit" size={15} color={Colors.palette.green} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openEdit(expense)} activeOpacity={0.78} style={styles.actionButton}>
              <MaterialIcons name="swap-horiz" size={16} color={Colors.palette.green} />
              <Text style={styles.actionText}>Move</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(expense)} activeOpacity={0.78} style={[styles.actionButton, styles.deleteAction]}>
              <MaterialIcons name="delete-outline" size={16} color="#B4533B" />
              <Text style={[styles.actionText, styles.deleteActionText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerDrop }] }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.78} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.palette.green} />
          </TouchableOpacity>
          <Text style={styles.month}>{monthLabel(budget.periodKey)}</Text>
          <Text style={styles.ebisuLine}><Text style={styles.ebisuWord}>Ebisu</Text> keeps the household ledger.</Text>
          <Text style={styles.support}>Review what left this period, then correct or move entries when needed.</Text>
        </Animated.View>

        <Animated.View style={[styles.ledgerBody, { opacity: bodyOpacity, transform: [{ translateY: bodyDrop }] }]}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent this period</Text>
            <Text style={styles.summaryAmount}>{formatMoney(spentTotal, budget.currency)}</Text>
            <View style={styles.summaryMetaRow}>
              <Text style={styles.summaryMeta}>{budget.expenses.length} {budget.expenses.length === 1 ? 'expense' : 'expenses'}</Text>
              <View style={styles.summaryDot} />
              <Text style={styles.summaryMeta}>{compactDateLabel(budget.periodStart)} - {compactDateLabel(budget.periodEnd)}</Text>
            </View>
          </View>

          <View style={styles.segmentedControl}>
            {(['day', 'vessel'] as const).map((view) => {
              const selected = reportView === view;
              return (
                <TouchableOpacity key={view} onPress={() => setReportView(view)} activeOpacity={0.82} style={[styles.segmentOption, selected && styles.segmentOptionSelected]}>
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{view === 'day' ? 'By day' : 'By vessel'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {budget.expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>The page is still clear.</Text>
              <Text style={styles.emptyCopy}>Recorded expenses will appear here as a useful report, grouped by day or vessel.</Text>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.78} style={styles.emptyCta}>
                <Text style={styles.emptyCtaText}>Return home to record</Text>
              </TouchableOpacity>
            </View>
          ) : reportView === 'day' ? (
            <View style={styles.sectionStack}>
              {dayGroups.map((group) => (
                <View key={group.date} style={styles.reportSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{compactDateLabel(group.date)}</Text>
                    <Text style={styles.sectionTotal}>{formatMoney(group.total, budget.currency)}</Text>
                  </View>
                  <View style={styles.entryList}>{group.expenses.map((expense) => renderExpenseRow(expense, false))}</View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.sectionStack}>
              {vesselGroups.map((group) => (
                <View key={group.section} style={styles.reportSection}>
                  <View style={styles.sectionHeaderDecorated}>
                    <View style={styles.goldLine} />
                    <Text style={styles.sectionTitleDecorated}>{sectionLabel(group.section)}</Text>
                    <View style={styles.goldLine} />
                  </View>
                  <Text style={styles.sectionSupport}>{formatMoney(group.total, budget.currency)} across {group.categories.length} {group.categories.length === 1 ? 'vessel' : 'vessels'}</Text>
                  {group.categories.map((category) => (
                    <View key={category.id} style={styles.vesselGroupCard}>
                      <View style={styles.vesselGroupHeader}>
                        <Text style={styles.vesselGroupTitle}>{category.name}</Text>
                        <Text style={styles.vesselGroupTotal}>{formatMoney(category.total, budget.currency)}</Text>
                      </View>
                      {category.directExpenses.map((expense) => renderExpenseRow(expense, true))}
                      {category.subcategories.map((subcategory) => (
                        <View key={subcategory.id} style={styles.subcategoryBlock}>
                          <View style={styles.subcategoryHeader}>
                            <Text style={styles.subcategoryTitle}>{subcategory.name}</Text>
                            <Text style={styles.subcategoryTotal}>{formatMoney(subcategory.total, budget.currency)}</Text>
                          </View>
                          {subcategory.expenses.map((expense) => renderExpenseRow(expense, true))}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Modal visible={!!editingExpense && !!editDraft} transparent animationType="fade" onRequestClose={() => setEditingExpense(null)}>
        <View style={styles.editModalRoot}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditingExpense(null)} />
          <View style={styles.editSheet}>
            <View style={styles.editHeader}>
              <View>
                <Text style={styles.editTitle}>Edit expense</Text>
                <Text style={styles.editSupport}>Adjust amount, vessel, date, or notes.</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingExpense(null)} style={styles.closeButton} activeOpacity={0.78}>
                <MaterialIcons name="close" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            {editDraft ? (
              <ScrollView style={styles.editScroll} contentContainerStyle={styles.editContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Amount</Text>
                  <TextInput value={editDraft.amount} onChangeText={(value) => setEditDraft({ ...editDraft, amount: formatMoneyInput(value) })} keyboardType="decimal-pad" selectTextOnFocus style={styles.editInput} />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Vessel</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetRail}>
                    {targets.map((target) => {
                      const selected = editDraft.targetId === target.id;
                      return (
                        <TouchableOpacity key={`${target.section}-${target.categoryId}-${target.subcategoryId ?? 'root'}`} onPress={() => setEditDraft({ ...editDraft, targetId: target.id })} activeOpacity={0.78} style={[styles.targetChip, selected && styles.targetChipSelected]}>
                          <Text style={[styles.targetChipText, selected && styles.targetChipTextSelected]}>{target.displayLabel}</Text>
                          {target.parentLabel ? <Text style={[styles.targetChipParent, selected && styles.targetChipTextSelected]}>{target.parentLabel}</Text> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Spent on</Text>
                  <TextInput value={editDraft.date} onChangeText={(value) => setEditDraft({ ...editDraft, date: value })} placeholder="YYYY-MM-DD" style={styles.editInput} />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Paid to</Text>
                  <TextInput value={editDraft.payeeName} onChangeText={(value) => setEditDraft({ ...editDraft, payeeName: value })} placeholder="Business" style={styles.editInput} />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Note</Text>
                  <TextInput value={editDraft.note} onChangeText={(value) => setEditDraft({ ...editDraft, note: value })} placeholder="Optional note" multiline textAlignVertical="top" style={[styles.editInput, styles.editNote]} />
                </View>
                <TouchableOpacity onPress={saveEdit} disabled={savingEdit} activeOpacity={0.82} style={[styles.saveButton, savingEdit && styles.saveButtonDisabled]}>
                  {savingEdit ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={styles.saveButtonText}>Save expense</Text>}
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface.warm },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { fontFamily: Fonts.headingSemiBold, fontSize: 16, color: Colors.text.secondary, textAlign: 'center' },
  header: { alignItems: 'center', marginBottom: Space.xl },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.58)', borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.07)', marginBottom: 8 },
  month: { fontFamily: Fonts.bodyMedium, fontSize: 13, lineHeight: 20, color: Colors.text.secondary, marginBottom: 8 },
  ebisuLine: { fontFamily: Fonts.headingSemiBold, fontSize: 20, lineHeight: 29, color: Colors.text.primary, textAlign: 'center' },
  ebisuWord: { fontFamily: Fonts.heading, color: Colors.palette.green },
  support: { maxWidth: 320, marginTop: 8, fontFamily: Fonts.body, fontSize: 13, lineHeight: 20, color: Colors.text.secondary, textAlign: 'center' },
  ledgerBody: { gap: Space.lg },
  summaryCard: { borderRadius: Radius.xl, backgroundColor: '#20243A', paddingHorizontal: 18, paddingVertical: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  summaryLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.62)' },
  summaryAmount: { marginTop: 4, fontFamily: Fonts.headingSemiBold, fontSize: 30, lineHeight: 37, color: '#75D5B4' },
  summaryMetaRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  summaryMeta: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.68)' },
  summaryDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.34)' },
  segmentedControl: { minHeight: 48, flexDirection: 'row', gap: 8, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.52)', borderWidth: 1.4, borderColor: 'rgba(26,26,26,0.07)', padding: 5 },
  segmentOption: { flex: 1, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  segmentOptionSelected: { backgroundColor: Colors.palette.green },
  segmentText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.secondary },
  segmentTextSelected: { color: Colors.text.inverse },
  emptyState: { borderRadius: Radius.lg, borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.07)', backgroundColor: 'rgba(255,255,255,0.56)', paddingHorizontal: 18, paddingVertical: 22, alignItems: 'center' },
  emptyTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 17, lineHeight: 24, color: Colors.text.primary, textAlign: 'center' },
  emptyCopy: { marginTop: 5, fontFamily: Fonts.body, fontSize: 13, lineHeight: 20, color: Colors.text.secondary, textAlign: 'center' },
  emptyCta: { marginTop: 14, minHeight: 38, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79,175,143,0.12)', paddingHorizontal: 16 },
  emptyCtaText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.palette.green },
  sectionStack: { gap: Space.lg },
  reportSection: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 16, lineHeight: 22, color: Colors.text.primary },
  sectionTotal: { fontFamily: Fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: Colors.palette.green },
  sectionHeaderDecorated: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goldLine: { flex: 1, height: 1.2, backgroundColor: 'rgba(197,151,73,0.52)' },
  sectionTitleDecorated: { fontFamily: Fonts.headingSemiBold, fontSize: 15, lineHeight: 21, color: Colors.palette.green, textAlign: 'center' },
  sectionSupport: { marginTop: -3, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.text.secondary, textAlign: 'center' },
  entryList: { gap: 9 },
  entryCard: { borderRadius: Radius.lg, borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.07)', backgroundColor: 'rgba(255,255,255,0.58)', overflow: 'hidden' },
  entryCardOpen: { borderColor: 'rgba(79,175,143,0.24)', backgroundColor: 'rgba(255,255,255,0.72)' },
  entryRow: { minHeight: 68, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  entryCopy: { flex: 1, minWidth: 0 },
  entryLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: Colors.text.primary },
  entryMeta: { marginTop: 2, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  entryTrailing: { alignItems: 'flex-end', gap: 6 },
  entryAmount: { fontFamily: Fonts.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.text.primary },
  moreButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,26,26,0.04)' },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  actionButton: { flex: 1, minHeight: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, backgroundColor: 'rgba(79,175,143,0.10)' },
  actionText: { fontFamily: Fonts.bodyMedium, fontSize: 11.5, lineHeight: 15, color: Colors.palette.green },
  deleteAction: { backgroundColor: 'rgba(180,83,59,0.10)' },
  deleteActionText: { color: '#B4533B' },
  vesselGroupCard: { gap: 8, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.07)', backgroundColor: 'rgba(255,255,255,0.38)', padding: 10 },
  vesselGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  vesselGroupTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 15, lineHeight: 21, color: Colors.text.primary },
  vesselGroupTotal: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.palette.green },
  subcategoryBlock: { gap: 8, paddingTop: 4 },
  subcategoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  subcategoryTitle: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  subcategoryTotal: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.text.secondary },
  editModalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay.scrim },
  editSheet: { maxHeight: '86%', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, backgroundColor: Colors.surface.warm, paddingTop: 16 },
  editHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  editTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 20, lineHeight: 27, color: Colors.text.primary },
  editSupport: { marginTop: 2, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1.2, borderColor: 'rgba(26,26,26,0.07)' },
  editScroll: { flexGrow: 0 },
  editContent: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  editField: { gap: 6 },
  editLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  editInput: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.07)', backgroundColor: 'rgba(255,255,255,0.58)', paddingHorizontal: 14, fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text.primary },
  editNote: { minHeight: 78, paddingTop: 12, paddingBottom: 12 },
  targetRail: { gap: 8, paddingRight: 4 },
  targetChip: { minHeight: 45, borderRadius: Radius.full, borderWidth: 1.4, borderColor: 'rgba(26,26,26,0.07)', backgroundColor: 'rgba(255,255,255,0.56)', justifyContent: 'center', paddingHorizontal: 14 },
  targetChipSelected: { borderColor: Colors.palette.green, backgroundColor: 'rgba(79,175,143,0.12)' },
  targetChipText: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: Colors.text.primary },
  targetChipTextSelected: { color: Colors.palette.green },
  targetChipParent: { marginTop: 1, fontFamily: Fonts.body, fontSize: 10, lineHeight: 13, color: Colors.text.secondary },
  saveButton: { minHeight: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.palette.green, marginTop: 4 },
  saveButtonDisabled: { opacity: 0.62 },
  saveButtonText: { fontFamily: Fonts.headingSemiBold, fontSize: 15, color: Colors.text.inverse },
});
