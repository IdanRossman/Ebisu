import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import type { CurrencyCode } from '../../../types';
import { formatMoney, parseMoneyInput } from '../domain/money';

type EditableAmount = 'funding' | 'reserve';

type Props = {
  currency: CurrencyCode;
  assignedTotal: number;
  fundingAmount: number | null;
  reserveTargetAmount: number | null;
  onChangeFundingAmount: (amount: number | null) => void;
  onChangeReserveTarget: (amount: number | null) => void;
};

function amountText(amount: number | null, currency: CurrencyCode) {
  return amount === null ? 'Not set' : formatMoney(amount, currency);
}

function percentText(part: number | null, whole: number | null) {
  if (part === null || whole === null || whole <= 0) return '-';
  return `${Math.round((part / whole) * 100)}%`;
}

export function BudgetBalancePanel({
  currency,
  assignedTotal,
  fundingAmount,
  reserveTargetAmount,
  onChangeFundingAmount,
  onChangeReserveTarget,
}: Props) {
  const [editing, setEditing] = useState<EditableAmount | null>(null);
  const [input, setInput] = useState('');

  const leftToAssign = fundingAmount === null ? null : fundingAmount - assignedTotal;
  const unassignedAmount = leftToAssign === null ? null : Math.max(0, leftToAssign);
  const activeAmount = editing === 'funding' ? fundingAmount : reserveTargetAmount;
  const activeTitle = editing === 'funding' ? 'Monthly income' : 'Reserve target';
  const activeCopy = editing === 'funding'
    ? 'How much money is available for this plan?'
    : 'How much would you like to keep untouched this period?';

  useEffect(() => {
    if (!editing) return;
    setInput(activeAmount === null ? '' : String(activeAmount));
  }, [activeAmount, editing]);

  const openEditor = (target: EditableAmount) => setEditing(target);

  const closeEditor = () => {
    setEditing(null);
    setInput('');
  };

  const clearActiveAmount = () => {
    if (editing === 'funding') onChangeFundingAmount(null);
    if (editing === 'reserve') onChangeReserveTarget(null);
    closeEditor();
  };

  const saveActiveAmount = () => {
    const amount = parseMoneyInput(input);
    if (!Number.isFinite(amount) || amount < 0 || !editing) return;
    if (editing === 'funding') onChangeFundingAmount(amount);
    if (editing === 'reserve') onChangeReserveTarget(amount);
    closeEditor();
  };

  return (
    <>
      <View
        style={styles.ratioPanel}
        accessibilityRole="summary"
        accessibilityLabel="Budget plan ratios"
      >
        <View style={styles.ratioHeader}>
          <Text style={styles.ratioEyebrow}>Plan ratios</Text>
          <Text style={styles.ratioHint}>A quick read of how the income is being shaped.</Text>
        </View>
        <View style={styles.ratioStrip}>
          <View style={styles.ratioItem}>
            <Text style={styles.ratioValue}>{percentText(assignedTotal, fundingAmount)}</Text>
            <Text style={styles.ratioLabel}>Assigned</Text>
          </View>
          <View style={styles.ratioDivider} />
          <View style={styles.ratioItem}>
            <Text style={styles.ratioValue}>{percentText(reserveTargetAmount, fundingAmount)}</Text>
            <Text style={styles.ratioLabel}>Reserve</Text>
          </View>
          <View style={styles.ratioDivider} />
          <View style={styles.ratioItem}>
            <Text style={styles.ratioValue}>{percentText(unassignedAmount, fundingAmount)}</Text>
            <Text style={styles.ratioLabel}>Unassigned</Text>
          </View>
        </View>
      </View>

      <View
        style={styles.settingsSection}
        accessibilityRole="summary"
        accessibilityLabel="Budget plan settings"
      >
        <View style={styles.sectionHeader} accessible accessibilityRole="header">
          <View style={styles.goldDividerStack}>
            <View style={styles.goldDividerStrong} />
            <View style={styles.goldDividerSoft} />
          </View>
          <Text style={styles.sectionTitle}>Plan settings</Text>
          <View style={styles.goldDividerStack}>
            <View style={styles.goldDividerSoft} />
            <View style={styles.goldDividerStrong} />
          </View>
        </View>

        <View style={styles.settingsGroup}>
          <TouchableOpacity
            onPress={() => openEditor('funding')}
            activeOpacity={0.82}
            style={styles.settingRow}
            accessibilityRole="button"
            accessibilityLabel={`Edit monthly income. Current value ${amountText(fundingAmount, currency)}`}
          >
            <View style={styles.settingIcon}>
              <MaterialIcons name="payments" size={18} color={Colors.palette.gold} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Monthly income</Text>
              <Text style={styles.settingSupport}>The full amount available to shape.</Text>
            </View>
            <Text style={styles.settingValue}>{amountText(fundingAmount, currency)}</Text>
            <MaterialIcons name="edit" size={17} color={Colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => openEditor('reserve')}
            activeOpacity={0.82}
            style={styles.settingRow}
            accessibilityRole="button"
            accessibilityLabel={`Edit reserve target. Current value ${amountText(reserveTargetAmount, currency)}`}
          >
            <View style={[styles.settingIcon, styles.reserveIcon]}>
              <MaterialIcons name="shield" size={18} color={Colors.palette.green} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Reserve target</Text>
              <Text style={styles.settingSupport}>Money you intend to keep untouched.</Text>
            </View>
            <Text style={styles.settingValue}>{amountText(reserveTargetAmount, currency)}</Text>
            <MaterialIcons name="edit" size={17} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        accessibilityViewIsModal
        onRequestClose={closeEditor}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{activeTitle}</Text>
            <Text style={styles.modalCopy}>{activeCopy}</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="0"
              placeholderTextColor={`${Colors.textSecondary}70`}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel={activeTitle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={clearActiveAmount} style={styles.secondaryButton} accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeEditor} style={styles.secondaryButton} accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveActiveAmount} style={styles.primaryButton} accessibilityRole="button">
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  settingsSection: {
    gap: 12,
  },
  ratioPanel: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1.3,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  sectionHeader: {
    gap: 7,
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.palette.green,
    textAlign: 'center',
  },
  goldDividerStack: {
    gap: 3,
  },
  goldDividerStrong: {
    height: 1.5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(212,162,76,0.58)',
  },
  goldDividerSoft: {
    width: '72%',
    height: 1,
    alignSelf: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(212,162,76,0.22)',
  },
  settingsGroup: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  settingRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,162,76,0.13)',
  },
  reserveIcon: {
    backgroundColor: 'rgba(79,175,143,0.12)',
  },
  settingCopy: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
  },
  settingSupport: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text.secondary,
  },
  settingValue: {
    maxWidth: 92,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginLeft: 56,
    backgroundColor: 'rgba(26,26,26,0.07)',
  },
  ratioHeader: {
    gap: 2,
  },
  ratioEyebrow: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.palette.green,
  },
  ratioHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  ratioStrip: {
    minHeight: 58,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,175,143,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.12)',
  },
  ratioItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  ratioDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(26,26,26,0.07)',
  },
  ratioValue: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#75D5B4',
  },
  ratioLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text.secondary,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: Colors.overlay.scrim,
  },
  modalCard: {
    borderRadius: Radius.lg,
    padding: 18,
    backgroundColor: Colors.surface.warm,
    gap: 10,
  },
  modalTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  modalCopy: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  input: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.76)',
    paddingHorizontal: 16,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 20,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 42,
    minWidth: 76,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  secondaryButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  primaryButton: {
    minHeight: 42,
    minWidth: 76,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.palette.green,
  },
  primaryButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.inverse,
  },
});
