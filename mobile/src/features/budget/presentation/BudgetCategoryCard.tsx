import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type DimensionValue,
} from 'react-native';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import { categoryPlannedAmount, categorySpentAmount, formatMoney } from '../../../lib/budget';
import type { BudgetSectionItem, BudgetSectionKey, BudgetSubcategory, BudgetWatchTarget, CurrencyCode } from '../../../types';
import type { EditingTarget } from '../application/useBudgetConfiguration';
import { isSameWatchTarget } from '../application/useBudgetConfiguration';

type Props = {
  section: BudgetSectionKey;
  category: BudgetSectionItem;
  currency: CurrencyCode;
  editing: EditingTarget | null;
  editName: string;
  editAmount: string;
  canEditAmount: boolean;
  watchTargets: BudgetWatchTarget[];
  onChangeEditName: (name: string) => void;
  onChangeEditAmount: (amount: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleWatch: (section: BudgetSectionKey, categoryId: string, subcategoryId?: string | null) => void;
  onEditCategory: (section: BudgetSectionKey, category: BudgetSectionItem) => void;
  onEditSubcategory: (section: BudgetSectionKey, categoryId: string, subcategory: BudgetSubcategory) => void;
  onRemoveCategory: (section: BudgetSectionKey, categoryId: string) => void;
  onRemoveSubcategory: (section: BudgetSectionKey, categoryId: string, subcategoryId: string) => void;
  onCreateSubcategory: (section: BudgetSectionKey, categoryId: string) => void;
};

type ActionTarget = {
  subcategoryId: string | null;
  label: string;
  onEdit: () => void;
  onRemove: () => void;
};

function progressWidth(spent: number, planned: number) {
  if (planned <= 0) return '0%' as DimensionValue;
  return `${Math.min(100, Math.max(0, (spent / planned) * 100))}%` as DimensionValue;
}

export function BudgetCategoryCard({
  section,
  category,
  currency,
  editing,
  editName,
  editAmount,
  canEditAmount,
  watchTargets,
  onChangeEditName,
  onChangeEditAmount,
  onSaveEdit,
  onCancelEdit,
  onToggleWatch,
  onEditCategory,
  onEditSubcategory,
  onRemoveCategory,
  onRemoveSubcategory,
  onCreateSubcategory,
}: Props) {
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const planned = categoryPlannedAmount(category);
  const spent = categorySpentAmount(category);
  const editingCategory = editing?.section === section && editing.categoryId === category.id && !editing.subcategoryId;
  const hasActiveSubcategories = category.subcategories?.some((subcategory) => !subcategory.archivedAt) ?? false;
  const remaining = planned - spent;
  const categoryWatched = watchTargets.some((target) => isSameWatchTarget(target, section, category.id, null));

  const closeActions = () => setActionTarget(null);

  const runAction = (action: () => void) => {
    closeActions();
    action();
  };

  const renderEditor = () => (
    <View style={styles.editor}>
      <TextInput
        value={editName}
        onChangeText={onChangeEditName}
        placeholder="Vessel"
        placeholderTextColor={`${Colors.textSecondary}70`}
        selectTextOnFocus
        style={styles.editNameInput}
      />
      <View style={styles.editAmountRow}>
        {canEditAmount ? (
          <TextInput
            value={editAmount}
            onChangeText={onChangeEditAmount}
            placeholder="Amount"
            placeholderTextColor={`${Colors.textSecondary}70`}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={styles.editAmountInput}
          />
        ) : (
          <Text style={styles.sumHint}>Total follows its smaller vessels.</Text>
        )}
        <TouchableOpacity onPress={onSaveEdit} style={styles.iconButton} activeOpacity={0.8}>
          <MaterialIcons name="check" size={19} color={Colors.palette.green} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancelEdit} style={styles.iconButton} activeOpacity={0.8}>
          <MaterialIcons name="close" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOverflowButton = (
    label: string,
    subcategoryId: string | null,
    onEdit: () => void,
    onArchive: () => void,
  ) => (
    <TouchableOpacity
      onPress={() => setActionTarget({ subcategoryId, label, onEdit, onRemove: onArchive })}
      activeOpacity={0.78}
      style={styles.moreButton}
      accessibilityRole="button"
      accessibilityLabel={`Open actions for ${label}`}
    >
      <MaterialIcons name="more-vert" size={21} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

  const renderProgress = (plannedAmount: number, spentAmount: number) => (
    <View style={styles.progressPanel}>
      <View style={styles.valueRail}>
        <View style={styles.valueItem}>
          <Text style={styles.valueAmount}>{formatMoney(plannedAmount, currency)}</Text>
          <Text style={styles.valueLabel}>Planned</Text>
        </View>
        <View style={styles.valueDivider} />
        <View style={styles.valueItem}>
          <Text style={styles.valueAmount}>{formatMoney(spentAmount, currency)}</Text>
          <Text style={styles.valueLabel}>Spent</Text>
        </View>
        <View style={styles.valueDivider} />
        <View style={styles.valueItem}>
          <Text style={styles.valueAmount}>{formatMoney(plannedAmount - spentAmount, currency)}</Text>
          <Text style={styles.valueLabel}>Remaining</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.progress, { width: progressWidth(spentAmount, plannedAmount) }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.categoryBlock}>
      <View style={styles.topAccent} />
      {editingCategory ? renderEditor() : (
        <View style={styles.categoryIntro}>
          <View style={styles.titleCluster}>
            <View style={styles.titleLine}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {renderOverflowButton(
                category.name,
                null,
                () => onEditCategory(section, category),
                () => onRemoveCategory(section, category.id),
              )}
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.categorySupport}>
                {hasActiveSubcategories ? 'Total follows smaller vessels' : 'Main vessel'}
              </Text>
              {categoryWatched && (
                <View style={styles.watchingBadge}>
                  <MaterialIcons name="visibility" size={12} color={Colors.palette.green} />
                  <Text style={styles.watchingBadgeText}>Watching</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {!editingCategory && (
        <>
          {renderProgress(planned, spent)}

          {remaining < 0 && (
            <Text style={styles.overrunText}>
              This vessel is over by {formatMoney(Math.abs(remaining), currency)}.
            </Text>
          )}
        </>
      )}

      {hasActiveSubcategories && (
        <View style={styles.subcategoryGroup}>
          <Text style={styles.subcategoryGroupLabel}>Smaller vessels</Text>
          {category.subcategories?.map((subcategory) => {
            const editingSubcategory = editing?.section === section
              && editing.categoryId === category.id
              && editing.subcategoryId === subcategory.id;
            return (
              <View key={subcategory.id} style={styles.subcategoryRow}>
                <View style={styles.subcategoryHeader}>
                  <View style={styles.categoryCopy}>
                    {editingSubcategory ? renderEditor() : (
                      <>
                        <View style={styles.subcategoryTitleRow}>
                          <Text style={styles.subcategoryName}>{subcategory.name}</Text>
                          {watchTargets.some((target) => isSameWatchTarget(target, section, category.id, subcategory.id)) && (
                            <View style={styles.watchingDot} />
                          )}
                        </View>
                      </>
                    )}
                  </View>
                  {!editingSubcategory && renderOverflowButton(
                    subcategory.name,
                    subcategory.id,
                    () => onEditSubcategory(section, category.id, subcategory),
                    () => onRemoveSubcategory(section, category.id, subcategory.id),
                  )}
                </View>

                {!editingSubcategory && renderProgress(subcategory.plannedAmount, subcategory.spentAmount)}
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        onPress={() => onCreateSubcategory(section, category.id)}
        activeOpacity={0.78}
        style={[styles.addSubcategoryButton, editingCategory && styles.addSubcategoryButtonEditing]}
        accessibilityRole="button"
        accessibilityLabel={`Add smaller vessel to ${category.name}`}
      >
        <MaterialIcons name="add" size={16} color={Colors.palette.green} />
        <Text style={styles.addSubcategoryText}>
          {hasActiveSubcategories ? 'Add another smaller vessel' : 'Divide into smaller vessels'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={actionTarget !== null}
        transparent
        animationType="fade"
        accessibilityViewIsModal
        onRequestClose={closeActions}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheetBackdrop}
          onPress={closeActions}
          accessibilityRole="button"
          accessibilityLabel="Close vessel actions"
        >
          <TouchableOpacity activeOpacity={1} style={styles.actionSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{actionTarget?.label ?? 'Vessel actions'}</Text>
            <Text style={styles.sheetCopy}>Choose what to adjust for this vessel.</Text>

            <TouchableOpacity
              onPress={() => {
                if (!actionTarget) return;
                runAction(() => onToggleWatch(section, category.id, actionTarget.subcategoryId));
              }}
              activeOpacity={0.82}
              style={styles.sheetAction}
              accessibilityRole="button"
            >
              <MaterialIcons
                name={actionTarget && watchTargets.some((target) => isSameWatchTarget(target, section, category.id, actionTarget.subcategoryId)) ? 'visibility-off' : 'visibility'}
                size={20}
                color={Colors.palette.green}
              />
              <Text style={styles.sheetActionText}>
                {actionTarget && watchTargets.some((target) => isSameWatchTarget(target, section, category.id, actionTarget.subcategoryId))
                  ? 'Stop watching'
                  : 'Watch this vessel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => actionTarget && runAction(actionTarget.onEdit)}
              activeOpacity={0.82}
              style={styles.sheetAction}
              accessibilityRole="button"
            >
              <MaterialIcons name="edit" size={20} color={Colors.text.secondary} />
              <Text style={styles.sheetActionText}>Edit amount or name</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => actionTarget && runAction(actionTarget.onRemove)}
              activeOpacity={0.82}
              style={[styles.sheetAction, styles.dangerAction]}
              accessibilityRole="button"
            >
              <MaterialIcons name="delete-outline" size={20} color={Colors.palette.red} />
              <Text style={[styles.sheetActionText, styles.dangerActionText]}>Remove from plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeActions}
              activeOpacity={0.82}
              style={styles.cancelAction}
              accessibilityRole="button"
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  categoryBlock: {
    position: 'relative',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(79,175,143,0.14)',
    backgroundColor: 'rgba(255,255,255,0.68)',
    padding: 16,
    paddingTop: 18,
    gap: 12,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(79,175,143,0.34)',
  },
  categoryIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCluster: {
    flex: 1,
    gap: 3,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryName: {
    flex: 1,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 25,
    color: Colors.text.primary,
  },
  categorySupport: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.1,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  subcategoryName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
  },
  plannedText: {
    marginTop: 3,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text.secondary,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  actionPill: {
    minHeight: 34,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1.1,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  actionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  watchButtonActive: {
    borderColor: 'rgba(79,175,143,0.42)',
    backgroundColor: 'rgba(79,175,143,0.12)',
  },
  watchTextActive: {
    color: Colors.palette.green,
  },
  watchingBadge: {
    minHeight: 22,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79,175,143,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.18)',
  },
  watchingBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 13,
    color: Colors.palette.green,
  },
  progressPanel: {
    gap: 8,
  },
  valueRail: {
    minHeight: 54,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.055)',
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  valueDivider: {
    width: 1,
    height: 27,
    marginHorizontal: 8,
    backgroundColor: 'rgba(26,26,26,0.07)',
  },
  valueLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  valueAmount: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.palette.green,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(26,26,26,0.07)',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.palette.green,
  },
  overrunText: {
    marginTop: -4,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.palette.gold,
  },
  subcategoryGroup: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.12)',
    backgroundColor: 'rgba(79,175,143,0.045)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  subcategoryGroupLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.palette.green,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  subcategoryRow: {
    paddingTop: 10,
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79,175,143,0.12)',
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  subcategoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  watchingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.palette.green,
  },
  addSubcategoryButton: {
    minHeight: 42,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(79,175,143,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.18)',
  },
  addSubcategoryButtonEditing: {
    marginTop: 2,
  },
  addSubcategoryText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.palette.green,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay.scrim,
  },
  actionSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.surface.warm,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(26,26,26,0.16)',
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sheetCopy: {
    marginBottom: 4,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sheetAction: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  sheetActionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text.primary,
  },
  dangerAction: {
    borderColor: 'rgba(229,57,53,0.16)',
    backgroundColor: 'rgba(229,57,53,0.06)',
  },
  dangerActionText: {
    color: Colors.palette.red,
  },
  cancelAction: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  editor: {
    gap: 8,
  },
  editNameInput: {
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 12,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  editAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editAmountInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 12,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  sumHint: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
});
