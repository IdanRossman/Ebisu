import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JewelButton } from '../../../components/ui';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import type { DraftBudgetPlan } from '../../../types';
import { formatMoney, updateDraftBudgetPlan } from '../../../lib/budget';
import { DraftCategoryEditor } from './DraftCategoryEditor';
import { RemainingBudgetCard } from './RemainingBudgetCard';
import { ReserveTargetCard } from './ReserveTargetCard';

type Motion = {
  suggestionOpacity: Animated.Value;
  suggestionDrop: Animated.Value;
  listOpacity: Animated.Value;
  listDrop: Animated.Value;
  helperOpacity: Animated.Value;
  helperDrop: Animated.Value;
  actionOpacity: Animated.Value;
  actionDrop: Animated.Value;
};

type ReserveSuggestion = {
  amount: number;
  remainingAfterSteady: number;
};

type Props = {
  currency: NonNullable<DraftBudgetPlan['currency']>;
  draftBudget: DraftBudgetPlan;
  setDraftBudget: React.Dispatch<React.SetStateAction<DraftBudgetPlan>>;
  reserveSuggestion: ReserveSuggestion | null;
  fundingAmount: number | null;
  remainingAmount: number | null;
  onChangeFundingAmount: (amount: number) => void;
  onAcceptReserve: () => void;
  onDismissReserve: () => void;
  onChangeReserveTarget: (amount: number | null) => void;
  onContinue: () => void;
  motion: Motion;
};

export function HouseholdVesselsBudgetStep({
  currency,
  draftBudget,
  setDraftBudget,
  reserveSuggestion,
  fundingAmount,
  remainingAmount,
  onChangeFundingAmount,
  onAcceptReserve,
  onDismissReserve,
  onChangeReserveTarget,
  onContinue,
  motion,
}: Props) {
  return (
    <>
      {fundingAmount !== null && remainingAmount !== null ? (
        <RemainingBudgetCard
          currency={currency}
          fundingAmount={fundingAmount}
          remainingAmount={remainingAmount}
          onChangeFundingAmount={onChangeFundingAmount}
        />
      ) : null}

      {reserveSuggestion ? (
        <Animated.View
          style={[
            styles.suggestionCard,
            { opacity: motion.suggestionOpacity, transform: [{ translateY: motion.suggestionDrop }] },
          ]}
        >
          <Text style={styles.suggestionTitle}>Ebisu suggests keeping a little aside.</Text>
          <Text style={styles.suggestionCopy}>
            After the steady obligations, {formatMoney(reserveSuggestion.remainingAfterSteady, currency)} remains to shape.
            If it suits this period, keeping about {formatMoney(reserveSuggestion.amount, currency)} untouched would leave
            a little breathing room for the household.
          </Text>
          <View style={styles.suggestionActions}>
            <TouchableOpacity onPress={onAcceptReserve} activeOpacity={0.82} style={styles.acceptButton}>
              <Text style={styles.acceptButtonText}>Set reserve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismissReserve} activeOpacity={0.78} style={styles.dismissButton}>
              <Text style={styles.dismissButtonText}>Not for now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}

      {draftBudget.reserveTargetAmount !== null ? (
        <Animated.View
          style={{ opacity: motion.suggestionOpacity, transform: [{ translateY: motion.suggestionDrop }] }}
        >
          <ReserveTargetCard
            currency={currency}
            reserveTargetAmount={draftBudget.reserveTargetAmount}
            onChangeReserveTarget={onChangeReserveTarget}
          />
        </Animated.View>
      ) : null}

      <Animated.View style={{ opacity: motion.listOpacity, transform: [{ translateY: motion.listDrop }] }}>
        <DraftCategoryEditor
          categories={draftBudget.householdVessels}
          onChange={(householdVessels) => setDraftBudget((current) => updateDraftBudgetPlan(current, { householdVessels }))}
          addLabel="Add another household vessel"
        />
      </Animated.View>

      <Animated.View style={{ opacity: motion.helperOpacity, transform: [{ translateY: motion.helperDrop }] }}>
        <Text style={styles.helperText}>
          Keep what belongs to this household. Rename, divide, or remove anything that does not.
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: motion.actionOpacity, transform: [{ translateY: motion.actionDrop }] }}>
        <View style={styles.nextStepScene}>
          <Image
            source={require('../../../../assets/ebisu-fishing-transparent.png')}
            style={styles.fishingEbisuImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <JewelButton
            label="Continue Shaping"
            onPress={onContinue}
            accessibilityLabel="Continue shaping this plan"
            touchableStyle={styles.nextStepButtonWrap}
          />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  suggestionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.22)',
    backgroundColor: 'rgba(79,175,143,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 10,
  },
  suggestionTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  suggestionCopy: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  suggestionActions: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  acceptButton: {
    minHeight: 40,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.palette.green,
  },
  acceptButtonText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.inverse },
  dismissButton: {
    minHeight: 40,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  dismissButtonText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.secondary },
  helperText: {
    marginTop: 2,
    maxWidth: 320,
    alignSelf: 'center',
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  nextStepScene: {
    minHeight: 150,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
  },
  fishingEbisuImage: { width: 118, height: 132, marginBottom: -4 },
  nextStepButtonWrap: { marginBottom: 18 },
});
