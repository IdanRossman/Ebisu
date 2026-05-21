import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { JewelButton } from '../../../components/ui';
import { Colors, Fonts } from '../../../constants/theme';
import { DraftBudgetPlan } from '../../../types';
import { updateDraftBudgetPlan } from '../../../lib/budget';
import { DraftCategoryEditor } from './DraftCategoryEditor';
import { RemainingBudgetCard } from './RemainingBudgetCard';

type Motion = {
  listOpacity: Animated.Value;
  listDrop: Animated.Value;
  helperOpacity: Animated.Value;
  helperDrop: Animated.Value;
  actionOpacity: Animated.Value;
  actionDrop: Animated.Value;
};

type Props = {
  draftBudget: DraftBudgetPlan;
  setDraftBudget: React.Dispatch<React.SetStateAction<DraftBudgetPlan>>;
  onContinue: () => void;
  fundingAmount: number | null;
  remainingAmount: number | null;
  onChangeFundingAmount: (amount: number) => void;
  motion: Motion;
};

export function SteadyObligationsBudgetStep({
  draftBudget,
  setDraftBudget,
  onContinue,
  fundingAmount,
  remainingAmount,
  onChangeFundingAmount,
  motion,
}: Props) {
  return (
    <>
      {fundingAmount !== null && remainingAmount !== null && draftBudget.currency ? (
        <RemainingBudgetCard
          currency={draftBudget.currency}
          fundingAmount={fundingAmount}
          remainingAmount={remainingAmount}
          onChangeFundingAmount={onChangeFundingAmount}
        />
      ) : null}

      <Animated.View style={{ opacity: motion.listOpacity, transform: [{ translateY: motion.listDrop }] }}>
        <DraftCategoryEditor
          categories={draftBudget.steadyObligations}
          onChange={(steadyObligations) => setDraftBudget((current) => updateDraftBudgetPlan(current, { steadyObligations }))}
          addLabel="Add another steady obligation"
        />
      </Animated.View>

      <Animated.View style={{ opacity: motion.helperOpacity, transform: [{ translateY: motion.helperDrop }] }}>
        <Text style={styles.helperText}>
          Begin with the parts that are hardest to move. Groceries, shopping, and flexible spending can be shaped later.
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
  fishingEbisuImage: {
    width: 118,
    height: 132,
    marginBottom: -4,
  },
  nextStepButtonWrap: {
    marginBottom: 18,
  },
});
