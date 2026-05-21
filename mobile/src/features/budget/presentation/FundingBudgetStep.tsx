import { Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { JewelButton } from '../../../components/ui';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import { DraftBudgetPlan } from '../../../types';
import { formatMoneyInput, parseMoneyInput, updateDraftBudgetPlan } from '../../../lib/budget';

type Motion = {
  fieldOpacity: Animated.Value;
  fieldDrop: Animated.Value;
  helperOpacity: Animated.Value;
  helperDrop: Animated.Value;
  actionOpacity: Animated.Value;
  actionDrop: Animated.Value;
};

type Props = {
  draftBudget: DraftBudgetPlan;
  setDraftBudget: React.Dispatch<React.SetStateAction<DraftBudgetPlan>>;
  fundingInput: string;
  setFundingInput: (value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  motion: Motion;
};

export function FundingBudgetStep({
  draftBudget,
  setDraftBudget,
  fundingInput,
  setFundingInput,
  motion,
}: Props) {
  return (
    <View style={styles.block}>
      <Animated.View style={{ opacity: motion.fieldOpacity, transform: [{ translateY: motion.fieldDrop }] }}>
        <View style={styles.amountField}>
          <TextInput
            value={fundingInput}
            onChangeText={(value) => {
              const formattedValue = formatMoneyInput(value);
              setFundingInput(formattedValue);
              const amount = parseMoneyInput(formattedValue);
              setDraftBudget((current) => updateDraftBudgetPlan(current, {
                fundingAmount: Number.isFinite(amount) && amount > 0 ? amount : null,
              }));
            }}
            placeholder="0"
            placeholderTextColor={`${Colors.textSecondary}70`}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: motion.helperOpacity, transform: [{ translateY: motion.helperDrop }] }}>
        <Text style={styles.helperText}>
          {draftBudget.rhythm === 'one_time'
            ? 'This is the total amount you want available for the whole journey.'
            : 'This is the total amount you want available for this budget period.'}
        </Text>
      </Animated.View>
    </View>
  );
}

export function FundingBudgetFooter({
  onContinue,
  onSkip,
  motion,
}: Pick<Props, 'onContinue' | 'onSkip' | 'motion'>) {
  return (
    <Animated.View style={{ opacity: motion.actionOpacity, transform: [{ translateY: motion.actionDrop }] }}>
      <View style={styles.nextStepScene}>
        <Image
          source={require('../../../../assets/ebisu-fishing-transparent.png')}
          style={styles.fishingEbisuImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.actions}>
          <JewelButton
            label="Continue Shaping"
            onPress={onContinue}
            accessibilityLabel="Continue shaping this plan"
          />
          <TouchableOpacity onPress={onSkip} activeOpacity={0.78} style={styles.skipButton}>
            <Text style={styles.skipText}>Shape without a total for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 14 },
  amountField: {
    minHeight: 64,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.76)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amountInput: {
    minWidth: 72,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 24,
    color: Colors.text.primary,
    textAlign: 'center',
    paddingVertical: 0,
  },
  helperText: {
    maxWidth: 310,
    alignSelf: 'center',
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  nextStepScene: {
    minHeight: 154,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
  },
  fishingEbisuImage: {
    width: 112,
    height: 132,
    marginBottom: -4,
  },
  actions: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
