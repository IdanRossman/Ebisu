import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { saveBudgetPlan, updateDraftBudgetPlan } from '../../lib/budget';
import { createRemoteShapedPlan } from '../../features/budget/application/budgetApi';
import { BudgetFlowStepFrame } from '../../features/budget/presentation/BudgetFlowStepFrame';
import { MetadataBudgetStep } from '../../features/budget/presentation/MetadataBudgetStep';
import { FundingBudgetFooter, FundingBudgetStep } from '../../features/budget/presentation/FundingBudgetStep';
import { SteadyObligationsBudgetStep } from '../../features/budget/presentation/SteadyObligationsBudgetStep';
import { HouseholdVesselsBudgetStep } from '../../features/budget/presentation/HouseholdVesselsBudgetStep';
import { ReviewBudgetStep } from '../../features/budget/presentation/ReviewBudgetStep';
import { useBudgetSetupFlow } from '../../features/budget/application/useBudgetSetupFlow';
import { SkippableIntroOverlay } from '../../features/motion/presentation/SkippableIntroOverlay';

const countingEbisu = require('../../../assets/ebisu-counting-transparent.png');

export default function BudgetSetupScreen() {
  const [saving, setSaving] = useState(false);
  const {
    stage,
    currentPhase,
    currency,
    draftBudget,
    setDraftBudget,
    fundingInput,
    setFundingInput,
    reviewCategories,
    plannedTotal,
    steadyObligationsTotal,
    householdVesselsTotal,
      reserveSuggestion,
    steadyRemainingAmount,
    vesselsRemainingAmount,
      acceptReserveSuggestion,
    changeFundingAmount,
      dismissReserveSuggestion,
    prepareReview,
    continueFromMetadata,
    continueFromFunding,
    skipFunding,
    returnToMetadata,
    returnToFunding,
    continueFromSteadyObligations,
    returnToSteadyObligations,
    setStage,
    isGuidanceSkippable,
    skipGuidance,
    motion,
  } = useBudgetSetupFlow();

  const saveBudget = async () => {
    if (!currency || saving) return;
    setSaving(true);
    try {
      const remotePlan = await createRemoteShapedPlan(draftBudget);
      if (remotePlan) await saveBudgetPlan(remotePlan);
      router.replace('/home');
    } catch {
      Alert.alert('Could not save', 'Please try again in a moment.');
      setSaving(false);
    }
  };

  const prompt = stage === 'metadata' && currentPhase === 'form'
    ? <Text style={styles.question}>What shall we call this plan?</Text>
    : stage === 'metadata'
      ? (
        <>
          <Text style={styles.ebisuLine}>Every plan begins with a name and a rhythm.</Text>
          <Text style={styles.support}>Let us decide how this one should live.</Text>
        </>
      )
      : stage === 'funding'
        ? (
          <>
            <Text style={styles.ebisuLine}>How much money is available for this plan?</Text>
            <Text style={styles.support}>You may set a total now, or continue without one.</Text>
          </>
        )
      : stage === 'steady_obligations'
        ? (
          <>
            <Text style={styles.ebisuLine}>First, let us name what must be paid.</Text>
            <Text style={styles.support}>These are the steady obligations. Flexible spending will come next.</Text>
          </>
        )
      : stage === 'categories'
        ? (
          <>
            <Text style={styles.ebisuLine}>Now let us shape what the household lives on.</Text>
            <Text style={styles.support}>Keep the vessels that belong here. Add what this month asks for.</Text>
          </>
        )
        : currency
          ? (
            <>
              <Text style={styles.question}>Your first step toward prosperity is shaped.</Text>
              <Text style={styles.support}>Keep faith with the plan, and let the month grow steadier from here.</Text>
            </>
          )
          : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            currentPhase === 'form' && styles.formContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BudgetFlowStepFrame
            showHero={currentPhase === 'guidance'}
            heroImage={countingEbisu}
            heroOpacity={motion.sceneOpacity}
            heroDrop={motion.sceneDrop}
            showHeader={currentPhase === 'form'}
            stepLabel={
              stage === 'metadata'
                ? 'Plan foundation'
                : stage === 'funding'
                  ? 'Available funds'
                  : stage === 'steady_obligations'
                    ? 'Steady obligations'
                  : stage === 'categories'
                    ? 'Household vessels'
                    : 'Review the shape'
            }
            onBack={
              stage === 'metadata'
                ? () => router.replace('/home')
                : stage === 'funding'
                ? returnToMetadata
                : stage === 'steady_obligations'
                  ? returnToFunding
                  : stage === 'categories'
                  ? returnToSteadyObligations
                    : undefined
            }
            prompt={prompt}
            promptOpacity={stage === 'metadata' && currentPhase === 'form' ? motion.formPromptOpacity : motion.messageOpacity}
            promptDrop={stage === 'metadata' && currentPhase === 'form' ? motion.formPromptDrop : motion.messageDrop}
            controlsOpacity={motion.controlsOpacity}
            controlsDrop={motion.controlsDrop}
            layout={stage === 'funding' && currentPhase === 'form' ? 'distributed' : 'stacked'}
            headerBehavior="normal"
            footer={stage === 'funding' && currentPhase === 'form' ? (
              <FundingBudgetFooter
                onContinue={continueFromFunding}
                onSkip={skipFunding}
                motion={{
                  fieldOpacity: motion.fundingFieldOpacity,
                  fieldDrop: motion.fundingFieldDrop,
                  helperOpacity: motion.fundingHelperOpacity,
                  helperDrop: motion.fundingHelperDrop,
                  actionOpacity: motion.fundingActionOpacity,
                  actionDrop: motion.fundingActionDrop,
                }}
              />
            ) : undefined}
            introSkippable={currentPhase === 'guidance' && isGuidanceSkippable}
            onSkipIntro={skipGuidance}
          >
            {stage === 'metadata' && currentPhase === 'form' && (
              <MetadataBudgetStep
                draftBudget={draftBudget}
                setDraftBudget={setDraftBudget}
                onContinue={continueFromMetadata}
                motion={{
                  planNameOpacity: motion.planNameOpacity,
                  planNameDrop: motion.planNameDrop,
                  rhythmOpacity: motion.rhythmOpacity,
                  rhythmDrop: motion.rhythmDrop,
                  formActionOpacity: motion.formActionOpacity,
                  formActionDrop: motion.formActionDrop,
                }}
              />
            )}

            {stage === 'funding' && currentPhase === 'form' && (
              <FundingBudgetStep
                draftBudget={draftBudget}
                setDraftBudget={setDraftBudget}
                fundingInput={fundingInput}
                setFundingInput={setFundingInput}
                onContinue={continueFromFunding}
                onSkip={skipFunding}
                motion={{
                  fieldOpacity: motion.fundingFieldOpacity,
                  fieldDrop: motion.fundingFieldDrop,
                  helperOpacity: motion.fundingHelperOpacity,
                  helperDrop: motion.fundingHelperDrop,
                  actionOpacity: motion.fundingActionOpacity,
                  actionDrop: motion.fundingActionDrop,
                }}
              />
            )}

            {stage === 'steady_obligations' && currentPhase === 'form' && (
              <SteadyObligationsBudgetStep
                draftBudget={draftBudget}
                setDraftBudget={setDraftBudget}
                onContinue={continueFromSteadyObligations}
                fundingAmount={draftBudget.fundingAmount}
                remainingAmount={steadyRemainingAmount}
                onChangeFundingAmount={changeFundingAmount}
                motion={{
                  listOpacity: motion.steadyListOpacity,
                  listDrop: motion.steadyListDrop,
                  helperOpacity: motion.steadyHelperOpacity,
                  helperDrop: motion.steadyHelperDrop,
                  actionOpacity: motion.steadyActionOpacity,
                  actionDrop: motion.steadyActionDrop,
                }}
              />
            )}

            {stage === 'categories' && currentPhase === 'form' && currency && (
              <HouseholdVesselsBudgetStep
                currency={currency}
                draftBudget={draftBudget}
                setDraftBudget={setDraftBudget}
                  reserveSuggestion={reserveSuggestion}
                fundingAmount={draftBudget.fundingAmount}
                remainingAmount={vesselsRemainingAmount}
                onChangeFundingAmount={changeFundingAmount}
                onAcceptReserve={acceptReserveSuggestion}
                onDismissReserve={dismissReserveSuggestion}
                onChangeReserveTarget={(reserveTargetAmount) => setDraftBudget((current) => (
                  updateDraftBudgetPlan(current, { reserveTargetAmount })
                ))}
                onContinue={prepareReview}
                motion={{
                  suggestionOpacity: motion.vesselsSuggestionOpacity,
                  suggestionDrop: motion.vesselsSuggestionDrop,
                  listOpacity: motion.vesselsListOpacity,
                  listDrop: motion.vesselsListDrop,
                  helperOpacity: motion.vesselsHelperOpacity,
                  helperDrop: motion.vesselsHelperDrop,
                  actionOpacity: motion.vesselsActionOpacity,
                  actionDrop: motion.vesselsActionDrop,
                }}
              />
            )}

            {stage === 'review' && currentPhase === 'form' && currency && (
              <ReviewBudgetStep
                currency={currency}
                draftBudget={draftBudget}
                steadyTotal={steadyObligationsTotal}
                householdTotal={householdVesselsTotal}
                remainingAmount={vesselsRemainingAmount}
                onBegin={saveBudget}
                saving={saving}
                onReturnToVessels={() => setStage('categories')}
                motion={{
                  summaryOpacity: motion.reviewSummaryOpacity,
                  summaryDrop: motion.reviewSummaryDrop,
                  actionOpacity: motion.reviewActionOpacity,
                  actionDrop: motion.reviewActionDrop,
                }}
              />
            )}
          </BudgetFlowStepFrame>
        </ScrollView>
      </KeyboardAvoidingView>
      <SkippableIntroOverlay enabled={currentPhase === 'guidance' && isGuidanceSkippable} onSkip={skipGuidance} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface.warm },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  formContent: {
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  ebisuLine: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  ebisuWord: { fontFamily: Fonts.heading, color: Colors.palette.green },
  question: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 25,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  support: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  roundAction: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
  },
});
