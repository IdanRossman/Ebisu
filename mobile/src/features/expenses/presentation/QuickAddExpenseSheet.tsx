import { Animated, Easing, Keyboard, KeyboardAvoidingView, LayoutAnimation, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View, useWindowDimensions } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { CeremonialSeal, GradientButton } from '../../../components/ui';
import { Colors, Fonts, Radius, Space } from '../../../constants/theme';
import type { ExpenseTarget } from '../../budget/application/useHomeBudget';
import type { CurrencyCode } from '../../../types';
import { VesselPickerSheet } from './VesselPickerSheet';
import { formatMoneyInput } from '../../budget/domain/money';
import { useQuickAddExpenseMotion } from '../application/useQuickAddExpenseMotion';
import {
  dayOfMonth,
  recurrenceSummary,
  weekdayIndex,
  weekdayLabel,
  type RecurrenceFrequency,
} from '../domain/recurrence';

function RecurringSeal({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.96)).current;
  const glyphOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: active ? 1 : 0.96, duration: 150, useNativeDriver: true }),
      Animated.timing(glyphOpacity, { toValue: active ? 1 : 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [active, glyphOpacity, scale]);

  return (
    <Animated.View style={[sealStyles.seal, active && sealStyles.sealActive, { transform: [{ scale }] }]}>
      <Animated.View style={{ opacity: glyphOpacity }}>
        <Text style={sealStyles.glyph}>循</Text>
      </Animated.View>
    </Animated.View>
  );
}

const sealStyles = StyleSheet.create({
  seal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  sealActive: {
    borderColor: 'rgba(79,175,143,0.34)',
    backgroundColor: Colors.palette.green,
  },
  glyph: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.text.inverse,
  },
});

function ordinalDay(day: number) {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function compactDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  const month = date.toLocaleString(undefined, { month: 'short' });
  return `${ordinalDay(date.getDate())} ${month}`;
}

type Props = {
  visible: boolean;
  currency: CurrencyCode;
  amount: string;
  setAmount: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  payeeName: string;
  setPayeeName: (value: string) => void;
  spentOn: string;
  setSpentOn: (value: string) => void;
  recurringExpense: boolean;
  setRecurringExpense: (value: boolean) => void;
  recurrenceFrequency: RecurrenceFrequency;
  setRecurrenceFrequency: (value: RecurrenceFrequency) => void;
  recurrenceMonthlyDay: number;
  setRecurrenceMonthlyDay: (value: number) => void;
  recurrenceWeeklyDay: number;
  setRecurrenceWeeklyDay: (value: number) => void;
  recurrenceEndsOn: string;
  setRecurrenceEndsOn: (value: string) => void;
  selectedTargetId: string | null;
  setSelectedTargetId: (value: string | null) => void;
  targets: ExpenseTarget[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function QuickAddExpenseSheet({
  visible,
  currency,
  amount,
  setAmount,
  note,
  setNote,
  payeeName,
  setPayeeName,
  spentOn,
  setSpentOn,
  recurringExpense,
  setRecurringExpense,
  recurrenceFrequency,
  setRecurrenceFrequency,
  recurrenceMonthlyDay,
  setRecurrenceMonthlyDay,
  recurrenceWeeklyDay,
  setRecurrenceWeeklyDay,
  recurrenceEndsOn,
  setRecurrenceEndsOn,
  selectedTargetId,
  setSelectedTargetId,
  targets,
  saving,
  onClose,
  onSave,
}: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const [spentDatePickerOpen, setSpentDatePickerOpen] = useState(false);
  const sheetScrollRef = useRef<ScrollView>(null);
  const recurrenceBodyOpacity = useRef(new Animated.Value(recurringExpense ? 1 : 0)).current;
  const recurrenceBodyDrop = useRef(new Animated.Value(recurringExpense ? 0 : -6)).current;
  const { mounted, close, motion } = useQuickAddExpenseMotion(visible, onClose);
  const selectedTarget = targets.find((target) => target.id === selectedTargetId);
  const dateLabel = compactDateLabel(spentOn);
  const endDateValue = recurrenceEndsOn || spentOn;

  const weeklyDayItems = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ value: i, label: weekdayLabel(i) })),
    [],
  );

  const expandedInputOpen = pickerOpen || spentDatePickerOpen;

  const collapseExpandedInputs = () => {
    if (!expandedInputOpen) return false;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPickerOpen(false);
    setSpentDatePickerOpen(false);
    return true;
  };

  const openSpentDatePicker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPickerOpen(false);
    setSpentDatePickerOpen((open) => !open);
  };

  const openVesselPicker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSpentDatePickerOpen(false);
    setPickerOpen((open) => !open);
  };

  const confirmSpentDate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSpentDatePickerOpen(false);
  };

  const selectVesselAndCollapse = (targetId: string) => {
    setSelectedTargetId(targetId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPickerOpen(false);
  };

  const submitExpense = () => {
    collapseExpandedInputs();
    Keyboard.dismiss();
    onSave();
  };

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(recurrenceBodyOpacity, {
        toValue: recurringExpense ? 1 : 0,
        duration: recurringExpense ? 240 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(recurrenceBodyDrop, {
        toValue: recurringExpense ? 0 : -6,
        duration: recurringExpense ? 260 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [recurrenceBodyDrop, recurrenceBodyOpacity, recurringExpense]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.scrim, { opacity: motion.scrimOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!collapseExpandedInputs()) close();
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: screenHeight * 0.84, opacity: motion.sheetOpacity, transform: [{ translateY: motion.sheetTranslateY }] },
          ]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>What left the household?</Text>
              <Text style={styles.today}>Quick expense</Text>
            </View>
            <TouchableOpacity
              onPress={close}
              activeOpacity={0.8}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close expense entry"
            >
              <MaterialIcons name="close" size={19} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={sheetScrollRef}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={collapseExpandedInputs}
            onContentSizeChange={() => {
              if (noteFocused) {
                sheetScrollRef.current?.scrollToEnd({ animated: true });
              }
            }}
          >
            <Animated.View
              style={[styles.amountBlock, { opacity: motion.amountOpacity, transform: [{ translateY: motion.amountTranslateY }] }]}
            >
              <Text style={styles.currency}>{currency}</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(formatMoneyInput(value))}
                placeholder="0"
                placeholderTextColor={`${Colors.textSecondary}55`}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onFocus={collapseExpandedInputs}
                style={styles.amountInput}
              />
            </Animated.View>

            <Animated.View
              style={[
                { opacity: motion.vesselsOpacity, transform: [{ translateY: motion.vesselsTranslateY }] },
              ]}
            >
              <TouchableOpacity
                onPress={openVesselPicker}
                activeOpacity={0.82}
                style={[styles.vesselField, styles.vesselFieldFull, selectedTarget && styles.vesselFieldSelected]}
                accessibilityRole="button"
                accessibilityLabel="Choose vessel"
              >
                <Text style={styles.selectedLabel}>Vessel</Text>
                <View style={styles.vesselFieldValueRow}>
                  <Text
                    style={[styles.vesselFieldValue, selectedTarget && styles.vesselFieldValueSelected]}
                    numberOfLines={1}
                  >
                    {selectedTarget?.displayLabel ?? 'Choose'}
                  </Text>
                  <MaterialIcons name="expand-more" size={18} color={Colors.palette.green} />
                </View>
                {selectedTarget?.parentLabel ? (
                  <Text style={styles.vesselFieldParent} numberOfLines={1}>
                    {selectedTarget.parentLabel}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </Animated.View>

            <VesselPickerSheet
              visible={pickerOpen}
              targets={targets}
              selectedTargetId={selectedTargetId}
              onSelect={selectVesselAndCollapse}
              onClose={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setPickerOpen(false);
              }}
            />

            <Animated.View
              style={[
                styles.recurrenceBlock,
                recurringExpense && styles.recurrenceBlockActive,
                { opacity: motion.recurrenceOpacity, transform: [{ translateY: motion.recurrenceTranslateY }] },
              ]}
            >
              <TouchableOpacity
                style={styles.recurrenceToggleRow}
                activeOpacity={0.82}
                disabled
                accessibilityState={{ disabled: true }}
              >
                <MaterialIcons
                  name="autorenew"
                  size={17}
                  color={Colors.text.secondary}
                />
                <View style={styles.recurrenceToggleCopy}>
                  <Text style={styles.recurrenceTitle}>
                    Recurring expense
                  </Text>
                  <Text style={styles.recurrenceSupport}>Plan this payment to return again.</Text>
                </View>
                <View style={styles.comingSoonMark}>
                  <CeremonialSeal style={styles.comingSoonSeal} />
                  <Text style={styles.comingSoonText}>Coming soon</Text>
                </View>
              </TouchableOpacity>

              {recurringExpense ? (
                <Animated.View style={[styles.recurrenceFields, { opacity: recurrenceBodyOpacity, transform: [{ translateY: recurrenceBodyDrop }] }]}>
                  <View style={styles.frequencyRow}>
                    {(['monthly', 'weekly'] as const).map((frequency) => {
                      const selected = recurrenceFrequency === frequency;
                      return (
                        <TouchableOpacity
                          key={frequency}
                          onPress={() => { setRecurrenceFrequency(frequency); }}
                          activeOpacity={0.82}
                          style={[styles.frequencyOption, selected && styles.frequencyOptionSelected]}
                        >
                          <Text style={[styles.frequencyText, selected && styles.frequencyTextSelected]}>
                            {frequency === 'monthly' ? 'Monthly' : 'Weekly'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.dayGrid}>
                    {recurrenceFrequency === 'monthly'
                      ? Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setRecurrenceMonthlyDay(day)}
                            activeOpacity={0.7}
                            style={styles.dayGridCell}
                          >
                            <View style={[styles.dayGridDot, recurrenceMonthlyDay === day && styles.dayGridDotSelected]}>
                              <Text style={[styles.dayGridText, recurrenceMonthlyDay === day && styles.dayGridTextSelected]}>
                                {day}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      : weeklyDayItems.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            onPress={() => setRecurrenceWeeklyDay(item.value)}
                            activeOpacity={0.7}
                            style={styles.dayGridCell}
                          >
                            <View style={[styles.dayGridDot, recurrenceWeeklyDay === item.value && styles.dayGridDotSelected]}>
                              <Text style={[styles.dayGridText, recurrenceWeeklyDay === item.value && styles.dayGridTextSelected]}>
                                {item.label.slice(0, 2)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))
                    }
                  </View>

                  <View style={styles.endsOnRow}>
                    <Text style={styles.selectedLabel}>Ends on</Text>
                    <View style={styles.endsOnRight}>
                      {Platform.OS === 'ios' ? (
                        <>
                          <DateTimePicker
                            value={new Date(`${endDateValue}T12:00:00`)}
                            mode="date"
                            display="compact"
                            minimumDate={new Date(`${spentOn}T12:00:00`)}
                            onChange={(_event, selectedDate) => {
                              if (selectedDate) setRecurrenceEndsOn(selectedDate.toISOString().slice(0, 10));
                            }}
                            style={styles.compactDatePicker}
                          />
                          {recurrenceEndsOn ? (
                            <TouchableOpacity onPress={() => setRecurrenceEndsOn('')} activeOpacity={0.7}>
                              <MaterialIcons name="close" size={15} color={Colors.text.secondary} />
                            </TouchableOpacity>
                          ) : null}
                        </>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            DateTimePickerAndroid.open({
                              value: new Date(`${endDateValue}T12:00:00`),
                              mode: 'date',
                              minimumDate: new Date(`${spentOn}T12:00:00`),
                              onChange: (_event, selectedDate) => {
                                if (selectedDate) setRecurrenceEndsOn(selectedDate.toISOString().slice(0, 10));
                              },
                            });
                          }}
                          activeOpacity={0.8}
                          style={styles.dateButton}
                        >
                          <Text style={styles.dateValue}>{recurrenceEndsOn || 'Ongoing'}</Text>
                          <MaterialIcons name="calendar-month" size={16} color={Colors.palette.green} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <Text style={styles.recurrenceSummary}>
                    {recurrenceSummary(recurrenceFrequency, recurrenceMonthlyDay, recurrenceWeeklyDay)}
                    {recurrenceEndsOn ? ` until ${recurrenceEndsOn}` : ''}
                  </Text>
                </Animated.View>
              ) : null}
            </Animated.View>

            <Animated.View
              style={[
                styles.metaRow,
                { opacity: motion.metaOpacity, transform: [{ translateY: motion.metaTranslateY }] },
              ]}
            >
              <View style={styles.dateField}>
                <Text style={styles.selectedLabel}>Spent on</Text>
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    onPress={openSpentDatePicker}
                    activeOpacity={0.8}
                    style={styles.dateButton}
                  >
                    <Text style={styles.dateValue}>{dateLabel}</Text>
                    <MaterialIcons name="calendar-month" size={16} color={Colors.palette.green} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      DateTimePickerAndroid.open({
                        value: new Date(`${spentOn}T12:00:00`),
                        mode: 'date',
                        maximumDate: new Date(),
                        onChange: (_event, selectedDate) => {
                          if (selectedDate) {
                            setSpentOn(selectedDate.toISOString().slice(0, 10));
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSpentDatePickerOpen(false);
                          }
                        },
                      });
                    }}
                    activeOpacity={0.8}
                    style={styles.dateButton}
                  >
                    <Text style={styles.dateValue}>{dateLabel}</Text>
                    <MaterialIcons name="calendar-month" size={16} color={Colors.palette.green} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.payeeField}>
                <Text style={styles.selectedLabel}>Paid to</Text>
                <TextInput
                  value={payeeName}
                  onChangeText={setPayeeName}
                  placeholder="Business"
                  placeholderTextColor={`${Colors.textSecondary}70`}
                  maxLength={48}
                  onFocus={collapseExpandedInputs}
                  style={styles.payeeInput}
                />
              </View>
            </Animated.View>

            {Platform.OS === 'ios' && spentDatePickerOpen ? (
              <View style={styles.inlineDatePicker}>
                <DateTimePicker
                  value={new Date(`${spentOn}T12:00:00`)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  textColor={Colors.text.primary}
                  themeVariant="light"
                  onChange={(_event, selectedDate) => {
                    if (selectedDate) setSpentOn(selectedDate.toISOString().slice(0, 10));
                  }}
                  style={styles.inlineDateSpinner}
                />
                <TouchableOpacity
                  onPress={confirmSpentDate}
                  activeOpacity={0.78}
                  style={styles.inlineDateDone}
                >
                  <Text style={styles.inlineDateDoneText}>Use date</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Animated.View style={{ opacity: motion.noteOpacity, transform: [{ translateY: motion.noteTranslateY }] }}>
              <TextInput
                value={note}
                onChangeText={setNote}
                onFocus={() => {
                  collapseExpandedInputs();
                  setNoteFocused(true);
                  sheetScrollRef.current?.scrollToEnd({ animated: true });
                }}
                onBlur={() => setNoteFocused(false)}
                placeholder="Optional note"
                placeholderTextColor={`${Colors.textSecondary}70`}
                maxLength={120}
                multiline
                textAlignVertical="top"
                style={styles.noteInput}
              />
            </Animated.View>

            <Animated.View style={{ opacity: motion.actionOpacity, transform: [{ translateY: motion.actionTranslateY }] }}>
              <GradientButton
                onPress={submitExpense}
                disabled={saving}
                style={styles.saveButton}
                touchableStyle={saving ? styles.disabled : undefined}
              >
                <Text style={styles.saveText}>{saving ? 'Recording…' : 'Record expense'}</Text>
              </GradientButton>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay.scrim,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.surface.warm,
    paddingTop: 10,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: Space.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(26,26,26,0.12)',
    marginBottom: Space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: Space.sm,
  },
  title: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text.primary,
  },
  today: {
    marginTop: 2,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  amountBlock: {
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  currency: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.secondary,
  },
  amountInput: {
    minWidth: 100,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 42,
    lineHeight: 54,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  selectedLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    justifyContent: 'space-between',
  },
  dateButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
  },
  compactDatePicker: {
    alignSelf: 'flex-start',
  },
  inlineDatePicker: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(79,175,143,0.18)',
    backgroundColor: 'rgba(255,255,255,0.46)',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  inlineDateSpinner: {
    height: 180,
  },
  inlineDateDone: {
    alignSelf: 'center',
    minHeight: 38,
    minWidth: 128,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,175,143,0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(79,175,143,0.20)',
    paddingHorizontal: 20,
  },
  inlineDateDoneText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.palette.green,
  },
  payeeField: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  payeeInput: {
    minHeight: 28,
    padding: 0,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.primary,
  },
  vesselField: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  vesselFieldSelected: {
    borderColor: 'rgba(79,175,143,0.26)',
    backgroundColor: 'rgba(79,175,143,0.06)',
  },
  vesselFieldFull: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  vesselFieldValueRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  vesselFieldValue: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
  },
  vesselFieldValueSelected: {
    color: Colors.palette.green,
  },
  vesselFieldParent: {
    marginTop: -4,
    fontFamily: Fonts.body,
    fontSize: 10.5,
    lineHeight: 13,
    color: Colors.text.secondary,
  },
  recurrenceBlock: {
    gap: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recurrenceBlockActive: {
    borderColor: 'rgba(79,175,143,0.28)',
    backgroundColor: 'rgba(79,175,143,0.04)',
  },
  recurrenceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recurrenceToggleCopy: {
    flex: 1,
  },
  recurrenceTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
  },
  recurrenceTitleActive: {
    color: Colors.palette.green,
  },
  recurrenceSupport: {
    marginTop: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text.secondary,
  },
  comingSoonMark: {
    alignItems: 'center',
    gap: 4,
  },
  comingSoonSeal: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  comingSoonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 14,
    color: '#A77927',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recurrenceFields: { gap: 10 },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.08)',
  },
  frequencyOptionSelected: {
    backgroundColor: 'rgba(79,175,143,0.12)',
    borderColor: Colors.palette.green,
  },
  frequencyText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  frequencyTextSelected: {
    color: Colors.palette.green,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  dayGridCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayGridDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayGridDotSelected: {
    backgroundColor: Colors.palette.green,
  },
  dayGridText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  dayGridTextSelected: {
    color: Colors.text.inverse,
  },
  endsOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  endsOnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recurrenceSummary: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.palette.green,
  },
  noteInput: {
    minHeight: 84,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.primary,
  },
  saveButton: {
    height: 60,
    borderRadius: Radius.lg,
  },
  saveText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text.inverse,
  },
  disabled: {
    opacity: 0.58,
  },
});

