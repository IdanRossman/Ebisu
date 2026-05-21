import { Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CeremonialSeal, JewelButton } from '../../../components/ui';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import { DraftBudgetPlan } from '../../../types';
import { updateDraftBudgetPlan } from '../domain/budget';

type Motion = {
  planNameOpacity: Animated.Value;
  planNameDrop: Animated.Value;
  rhythmOpacity: Animated.Value;
  rhythmDrop: Animated.Value;
  formActionOpacity: Animated.Value;
  formActionDrop: Animated.Value;
};

type Props = {
  draftBudget: DraftBudgetPlan;
  setDraftBudget: React.Dispatch<React.SetStateAction<DraftBudgetPlan>>;
  onContinue: () => void;
  motion: Motion;
};

export function MetadataBudgetStep({
  draftBudget,
  setDraftBudget,
  onContinue,
  motion,
}: Props) {
  return (
    <>
      <View style={styles.metadataBlock}>
        <Animated.View style={{ opacity: motion.planNameOpacity, transform: [{ translateY: motion.planNameDrop }] }}>
          <TextInput
            value={draftBudget.name}
            onChangeText={(name) => setDraftBudget((current) => updateDraftBudgetPlan(current, { name }))}
            placeholder="Monthly household plan"
            placeholderTextColor={`${Colors.textSecondary}70`}
            autoCapitalize="words"
            returnKeyType="done"
            style={styles.planNameInput}
          />
        </Animated.View>

        <Animated.View style={[styles.rhythmBlock, { opacity: motion.rhythmOpacity, transform: [{ translateY: motion.rhythmDrop }] }]}>
          <Text style={styles.rhythmLabel}>What rhythm shall this plan keep?</Text>
          {([
            { id: 'monthly', title: 'Monthly', detail: 'Return with each new month' },
            { id: 'biweekly', title: 'Bi-weekly', detail: 'Follow a fortnightly rhythm' },
            { id: 'weekly', title: 'Weekly', detail: 'Begin again every 7 days' },
            { id: 'one_time', title: 'One-time journey', detail: 'Shape a plan for a single purpose', disabled: true },
          ] as const).map((option) => {
            const selected = draftBudget.rhythm === option.id;
            const isOneTime = option.id === 'one_time';
            const disabled = 'disabled' in option && option.disabled;
            return (
              <View key={option.id} style={isOneTime && styles.oneTimeOptionWrap}>
                {isOneTime && <View style={styles.rhythmDivider} />}
                <TouchableOpacity
                  onPress={() => setDraftBudget((current) => updateDraftBudgetPlan(current, { rhythm: option.id }))}
                  activeOpacity={0.84}
                  disabled={disabled}
                  style={[
                    styles.rhythmOption,
                    selected && styles.rhythmOptionSelected,
                    disabled && styles.rhythmOptionDisabled,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}
                >
                  <View style={styles.rhythmCopy}>
                    <Text style={[
                      styles.rhythmTitle,
                      selected && styles.rhythmTitleSelected,
                      disabled && styles.rhythmTitleDisabled,
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.rhythmDetail}>{option.detail}</Text>
                  </View>
                  {disabled ? (
                    <View style={styles.comingSoonMark}>
                      <CeremonialSeal style={styles.comingSoonSeal} />
                      <Text style={styles.comingSoonText}>Coming soon</Text>
                    </View>
                  ) : (
                    <View style={[styles.rhythmSeal, selected && styles.rhythmSealSelected]}>
                      {selected && <Text style={styles.rhythmSealText}>巡</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: motion.formActionOpacity, transform: [{ translateY: motion.formActionDrop }] }}>
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
  metadataBlock: { gap: 18 },
  planNameInput: {
    minHeight: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.76)',
    paddingHorizontal: 18,
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  rhythmBlock: { gap: 8 },
  rhythmLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  rhythmOption: {
    minHeight: 66,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.05)',
    backgroundColor: 'rgba(255,255,255,0.34)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  rhythmOptionSelected: {
    borderColor: 'rgba(79,175,143,0.34)',
    backgroundColor: 'rgba(79,175,143,0.10)',
  },
  rhythmOptionDisabled: {
    opacity: 0.55,
  },
  rhythmCopy: { flex: 1, gap: 2 },
  rhythmTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text.primary,
  },
  rhythmTitleSelected: { color: Colors.palette.green },
  rhythmTitleDisabled: { color: Colors.text.secondary },
  rhythmDetail: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
  },
  rhythmSeal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  rhythmSealSelected: {
    borderColor: 'rgba(79,175,143,0.34)',
    backgroundColor: Colors.palette.green,
  },
  rhythmSealText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.text.inverse,
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
  oneTimeOptionWrap: { marginTop: 10, gap: 10 },
  rhythmDivider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: 'rgba(26,26,26,0.06)',
  },
  nextStepScene: {
    minHeight: 150,
    marginTop: 8,
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

