import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated } from 'react-native';
import {
  createBudgetCategory,
  createDraftBudgetPlan,
  formatMoney,
  formatMoneyInput,
  loadHouseholdCurrency,
  parseMoneyInput,
  updateDraftBudgetPlan,
} from '../../../lib/budget';
import { BudgetSectionItem, CurrencyCode, DraftBudgetPlan } from '../../../types';
import {
  dropIn,
  fadeOut,
  settleHidden,
  settleVisible,
} from '../../motion/application/entranceMotion';

export type SetupStage = 'metadata' | 'funding' | 'steady_obligations' | 'categories' | 'review';
export type BudgetStepPhase = 'guidance' | 'form';

type GuidedStepsCompleted = Record<SetupStage, boolean>;

export function useBudgetSetupFlow() {
  const [stage, setStage] = useState<SetupStage>('metadata');
  const [currentPhase, setCurrentPhase] = useState<BudgetStepPhase>('guidance');
  const [guidedStepsCompleted, setGuidedStepsCompleted] = useState<GuidedStepsCompleted>({
    metadata: false,
    funding: false,
    steady_obligations: false,
    categories: false,
    review: false,
  });
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [draftBudget, setDraftBudget] = useState<DraftBudgetPlan>(() => createDraftBudgetPlan());
  const [reviewCategories, setReviewCategories] = useState<BudgetSectionItem[]>([]);
  const [fundingInput, setFundingInput] = useState('');
  const [reserveDismissed, setReserveDismissed] = useState(false);
  const [isGuidanceSkippable, setIsGuidanceSkippable] = useState(false);
  const guidanceAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const sceneOpacity = useRef(new Animated.Value(0)).current;
  const sceneDrop = useRef(new Animated.Value(-12)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageDrop = useRef(new Animated.Value(-10)).current;
  const formPromptOpacity = useRef(new Animated.Value(0)).current;
  const formPromptDrop = useRef(new Animated.Value(-10)).current;
  const planNameOpacity = useRef(new Animated.Value(0)).current;
  const planNameDrop = useRef(new Animated.Value(-10)).current;
  const rhythmOpacity = useRef(new Animated.Value(0)).current;
  const rhythmDrop = useRef(new Animated.Value(-10)).current;
  const formActionOpacity = useRef(new Animated.Value(0)).current;
  const formActionDrop = useRef(new Animated.Value(-10)).current;
  const fundingFieldOpacity = useRef(new Animated.Value(0)).current;
  const fundingFieldDrop = useRef(new Animated.Value(-10)).current;
  const fundingHelperOpacity = useRef(new Animated.Value(0)).current;
  const fundingHelperDrop = useRef(new Animated.Value(-10)).current;
  const fundingActionOpacity = useRef(new Animated.Value(0)).current;
  const fundingActionDrop = useRef(new Animated.Value(-10)).current;
  const steadyListOpacity = useRef(new Animated.Value(0)).current;
  const steadyListDrop = useRef(new Animated.Value(-10)).current;
  const steadyHelperOpacity = useRef(new Animated.Value(0)).current;
  const steadyHelperDrop = useRef(new Animated.Value(-10)).current;
  const steadyActionOpacity = useRef(new Animated.Value(0)).current;
  const steadyActionDrop = useRef(new Animated.Value(-10)).current;
  const vesselsSuggestionOpacity = useRef(new Animated.Value(0)).current;
  const vesselsSuggestionDrop = useRef(new Animated.Value(-10)).current;
  const vesselsListOpacity = useRef(new Animated.Value(0)).current;
  const vesselsListDrop = useRef(new Animated.Value(-10)).current;
  const vesselsHelperOpacity = useRef(new Animated.Value(0)).current;
  const vesselsHelperDrop = useRef(new Animated.Value(-10)).current;
  const vesselsActionOpacity = useRef(new Animated.Value(0)).current;
  const vesselsActionDrop = useRef(new Animated.Value(-10)).current;
  const reviewSummaryOpacity = useRef(new Animated.Value(0)).current;
  const reviewSummaryDrop = useRef(new Animated.Value(-10)).current;
  const reviewActionOpacity = useRef(new Animated.Value(0)).current;
  const reviewActionDrop = useRef(new Animated.Value(-10)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const controlsDrop = useRef(new Animated.Value(-10)).current;

  const plannedTotal = useMemo(
    () => reviewCategories.reduce((sum, category) => sum + category.plannedAmount, 0),
    [reviewCategories],
  );

  const steadyObligationsTotal = useMemo(
    () => draftBudget.steadyObligations.reduce((sum, category) => {
      const ownAmount = parseMoneyInput(category.amount);
      const subcategoryAmount = category.subcategories.reduce((subtotal, subcategory) => (
        subtotal + parseMoneyInput(subcategory.amount)
      ), 0);
      return sum + (category.subcategories.length ? subcategoryAmount : ownAmount || 0);
    }, 0),
    [draftBudget.steadyObligations],
  );

  const reserveSuggestion = useMemo(() => {
    if (!draftBudget.fundingAmount || reserveDismissed || draftBudget.reserveTargetAmount !== null) return null;
    const remainingAfterSteady = draftBudget.fundingAmount - steadyObligationsTotal;
    if (remainingAfterSteady <= 0) return null;
    const amount = Math.min(draftBudget.fundingAmount * 0.2, remainingAfterSteady * 0.5);
    if (amount <= 0) return null;
    return {
      amount: Math.round(amount * 100) / 100,
      remainingAfterSteady: Math.round(remainingAfterSteady * 100) / 100,
    };
  }, [draftBudget.fundingAmount, draftBudget.reserveTargetAmount, reserveDismissed, steadyObligationsTotal]);

  const householdVesselsTotal = useMemo(
    () => draftBudget.householdVessels.reduce((sum, category) => {
      const ownAmount = parseMoneyInput(category.amount);
      const subcategoryAmount = category.subcategories.reduce((subtotal, subcategory) => (
        subtotal + parseMoneyInput(subcategory.amount)
      ), 0);
      return sum + (category.subcategories.length ? subcategoryAmount : ownAmount || 0);
    }, 0),
    [draftBudget.householdVessels],
  );

  const steadyRemainingAmount = draftBudget.fundingAmount === null
    ? null
    : draftBudget.fundingAmount - steadyObligationsTotal;

  const vesselsRemainingAmount = draftBudget.fundingAmount === null
    ? null
    : draftBudget.fundingAmount - steadyObligationsTotal - householdVesselsTotal;

  useEffect(() => {
    loadHouseholdCurrency().then((savedCurrency) => {
      const nextCurrency = savedCurrency ?? 'ILS';
      setCurrency(nextCurrency);
      setDraftBudget((current) => updateDraftBudgetPlan(current, {
        currency: nextCurrency,
      }));
    });
  }, []);

  useEffect(() => {
    if (currentPhase !== 'guidance') return;

    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;

      settleHidden({ opacity: sceneOpacity, translateY: sceneDrop }, -12);
      settleHidden({ opacity: messageOpacity, translateY: messageDrop }, -10);
      settleHidden({ opacity: controlsOpacity, translateY: controlsDrop }, -10);

      if (reduceMotion) {
        settleVisible({ opacity: sceneOpacity, translateY: sceneDrop });
        settleVisible({ opacity: messageOpacity, translateY: messageDrop });
        setIsGuidanceSkippable(false);
        setGuidedStepsCompleted((current) => ({ ...current, [stage]: true }));
        setCurrentPhase('form');
        return;
      }

      setIsGuidanceSkippable(true);
      animation = Animated.sequence([
        dropIn({ opacity: sceneOpacity, translateY: sceneDrop }, 820),
        Animated.delay(180),
        dropIn({ opacity: messageOpacity, translateY: messageDrop }, 620),
        Animated.delay(3800),
        Animated.parallel([
          fadeOut({ opacity: sceneOpacity, translateY: sceneDrop }),
          fadeOut({ opacity: messageOpacity, translateY: messageDrop }),
        ]),
      ]);

      guidanceAnimationRef.current = animation;
      animation.start(() => {
        if (!mounted) return;
        setIsGuidanceSkippable(false);
        setGuidedStepsCompleted((current) => ({ ...current, [stage]: true }));
        setCurrentPhase('form');
      });
    });

    return () => {
      mounted = false;
      animation?.stop();
      guidanceAnimationRef.current = null;
    };
  }, [controlsDrop, controlsOpacity, currentPhase, messageDrop, messageOpacity, sceneDrop, sceneOpacity, stage]);

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;
      if (reduceMotion) {
        sceneOpacity.setValue(1);
        sceneDrop.setValue(0);
        messageOpacity.setValue(1);
        messageDrop.setValue(0);
        formPromptOpacity.setValue(1);
        formPromptDrop.setValue(0);
        planNameOpacity.setValue(1);
        planNameDrop.setValue(0);
        rhythmOpacity.setValue(1);
        rhythmDrop.setValue(0);
        formActionOpacity.setValue(1);
        formActionDrop.setValue(0);
        fundingFieldOpacity.setValue(1);
        fundingFieldDrop.setValue(0);
        fundingHelperOpacity.setValue(1);
        fundingHelperDrop.setValue(0);
        fundingActionOpacity.setValue(1);
        fundingActionDrop.setValue(0);
        steadyListOpacity.setValue(1);
        steadyListDrop.setValue(0);
        steadyHelperOpacity.setValue(1);
        steadyHelperDrop.setValue(0);
        steadyActionOpacity.setValue(1);
        steadyActionDrop.setValue(0);
        vesselsSuggestionOpacity.setValue(1);
        vesselsSuggestionDrop.setValue(0);
        vesselsListOpacity.setValue(1);
        vesselsListDrop.setValue(0);
        vesselsHelperOpacity.setValue(1);
        vesselsHelperDrop.setValue(0);
        vesselsActionOpacity.setValue(1);
        vesselsActionDrop.setValue(0);
        reviewSummaryOpacity.setValue(1);
        reviewSummaryDrop.setValue(0);
        reviewActionOpacity.setValue(1);
        reviewActionDrop.setValue(0);
        controlsOpacity.setValue(1);
        controlsDrop.setValue(0);
        return;
      }

      animation = Animated.sequence([dropIn({ opacity: controlsOpacity, translateY: controlsDrop }, 540)]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [
    controlsDrop,
    controlsOpacity,
    formActionDrop,
    formActionOpacity,
    fundingActionDrop,
    fundingActionOpacity,
    fundingFieldDrop,
    fundingFieldOpacity,
    fundingHelperDrop,
    fundingHelperOpacity,
    steadyActionDrop,
    steadyActionOpacity,
    steadyHelperDrop,
    steadyHelperOpacity,
    steadyListDrop,
    steadyListOpacity,
    vesselsActionDrop,
    vesselsActionOpacity,
    vesselsHelperDrop,
    vesselsHelperOpacity,
    vesselsListDrop,
    vesselsListOpacity,
    vesselsSuggestionDrop,
    vesselsSuggestionOpacity,
    reviewActionDrop,
    reviewActionOpacity,
    reviewSummaryDrop,
    reviewSummaryOpacity,
    formPromptDrop,
    formPromptOpacity,
    messageDrop,
    messageOpacity,
    planNameDrop,
    planNameOpacity,
    rhythmDrop,
    rhythmOpacity,
    sceneDrop,
    sceneOpacity,
  ]);

  useEffect(() => {
    if (currentPhase === 'guidance') return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      messageOpacity.setValue(0);
      messageDrop.setValue(-10);
      controlsOpacity.setValue(0);
      controlsDrop.setValue(-10);
      animation = Animated.sequence([
        dropIn({ opacity: messageOpacity, translateY: messageDrop }),
        Animated.delay(180),
        dropIn({ opacity: controlsOpacity, translateY: controlsDrop }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [controlsDrop, controlsOpacity, currentPhase, messageDrop, messageOpacity, stage]);

  useEffect(() => {
    if (stage !== 'metadata' || currentPhase !== 'form') return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      animation = Animated.sequence([
        dropIn({ opacity: formPromptOpacity, translateY: formPromptDrop }),
        Animated.delay(180),
        dropIn({ opacity: planNameOpacity, translateY: planNameDrop }),
        Animated.delay(140),
        dropIn({ opacity: rhythmOpacity, translateY: rhythmDrop }),
        Animated.delay(140),
        dropIn({ opacity: formActionOpacity, translateY: formActionDrop }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [
    formActionDrop,
    formActionOpacity,
    formPromptDrop,
    formPromptOpacity,
    currentPhase,
    planNameDrop,
    planNameOpacity,
    rhythmDrop,
    rhythmOpacity,
    stage,
  ]);

  useEffect(() => {
    if (stage !== 'funding' || currentPhase !== 'form') return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      animation = Animated.sequence([
        dropIn({ opacity: fundingFieldOpacity, translateY: fundingFieldDrop }),
        Animated.delay(160),
        dropIn({ opacity: fundingHelperOpacity, translateY: fundingHelperDrop }),
        Animated.delay(140),
        dropIn({ opacity: fundingActionOpacity, translateY: fundingActionDrop }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [
    fundingActionDrop,
    fundingActionOpacity,
    fundingFieldDrop,
    fundingFieldOpacity,
    fundingHelperDrop,
    fundingHelperOpacity,
    currentPhase,
    stage,
  ]);

  useEffect(() => {
    if (stage !== 'steady_obligations' || currentPhase !== 'form') return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      animation = Animated.sequence([
        dropIn({ opacity: steadyListOpacity, translateY: steadyListDrop }),
        Animated.delay(160),
        dropIn({ opacity: steadyHelperOpacity, translateY: steadyHelperDrop }),
        Animated.delay(140),
        dropIn({ opacity: steadyActionOpacity, translateY: steadyActionDrop }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [
    currentPhase,
    stage,
    steadyActionDrop,
    steadyActionOpacity,
    steadyHelperDrop,
    steadyHelperOpacity,
    steadyListDrop,
    steadyListOpacity,
  ]);

  useEffect(() => {
    if (stage !== 'categories' || currentPhase !== 'form') return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      animation = Animated.sequence([
        dropIn({ opacity: vesselsSuggestionOpacity, translateY: vesselsSuggestionDrop }),
        Animated.delay(120),
        dropIn({ opacity: vesselsListOpacity, translateY: vesselsListDrop }),
        Animated.delay(160),
        dropIn({ opacity: vesselsHelperOpacity, translateY: vesselsHelperDrop }),
        Animated.delay(140),
        dropIn({ opacity: vesselsActionOpacity, translateY: vesselsActionDrop }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [
    currentPhase,
    stage,
    vesselsActionDrop,
    vesselsActionOpacity,
    vesselsHelperDrop,
    vesselsHelperOpacity,
    vesselsListDrop,
    vesselsListOpacity,
    vesselsSuggestionDrop,
    vesselsSuggestionOpacity,
  ]);

  useEffect(() => {
    if (stage !== 'review') return;
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;
      if (reduceMotion) {
        reviewSummaryOpacity.setValue(1);
        reviewSummaryDrop.setValue(0);
        reviewActionOpacity.setValue(1);
        reviewActionDrop.setValue(0);
        return;
      }

      animation = Animated.sequence([
        dropIn({ opacity: reviewSummaryOpacity, translateY: reviewSummaryDrop }),
        Animated.delay(180),
        dropIn({ opacity: reviewActionOpacity, translateY: reviewActionDrop }),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [
    reviewActionDrop,
    reviewActionOpacity,
    reviewSummaryDrop,
    reviewSummaryOpacity,
    stage,
  ]);

  const acceptReserveSuggestion = () => {
    if (!reserveSuggestion) return;
    setDraftBudget((current) => updateDraftBudgetPlan(current, {
      reserveTargetAmount: reserveSuggestion.amount,
    }));
  };

  const changeFundingAmount = (amount: number) => {
    setFundingInput(formatMoneyInput(String(amount)));
    setDraftBudget((current) => updateDraftBudgetPlan(current, { fundingAmount: amount }));
  };

  const prepareReview = () => {
    const nextCategories: BudgetSectionItem[] = [];
    for (const draft of draftBudget.householdVessels) {
      const amount = parseMoneyInput(draft.amount);
      const hasAmount = draft.amount.trim().length > 0;
      if (hasAmount && (!Number.isFinite(amount) || amount <= 0)) {
        Alert.alert('Amount needed', 'Use positive amounts for the vessels you want to keep.');
        return;
      }
      if (hasAmount && amount > 0) {
        nextCategories.push(createBudgetCategory(draft.id, draft.name, amount));
      }
    }
    if (nextCategories.length === 0) {
      Alert.alert('One vessel needed', 'Keep at least one amount so the month has a shape.');
      return;
    }
    setReviewCategories(nextCategories);
    Animated.parallel([
      fadeOut({ opacity: vesselsSuggestionOpacity, translateY: vesselsSuggestionDrop }),
      fadeOut({ opacity: vesselsListOpacity, translateY: vesselsListDrop }),
      fadeOut({ opacity: vesselsHelperOpacity, translateY: vesselsHelperDrop }),
      fadeOut({ opacity: vesselsActionOpacity, translateY: vesselsActionDrop }),
    ]).start(() => {
      setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'review' }));
      setCurrentPhase(guidedStepsCompleted.review ? 'form' : 'guidance');
      setStage('review');
    });
  };

  const continueFromMetadata = () => {
    if (!draftBudget.name.trim()) {
      Alert.alert('A name is needed', 'Tell me what this plan should be called.');
      return;
    }
    if (!draftBudget.rhythm) {
      Alert.alert('A rhythm is needed', 'Choose how often this plan should begin again.');
      return;
    }
    Animated.parallel([
      fadeOut({ opacity: formPromptOpacity, translateY: formPromptDrop }),
      fadeOut({ opacity: planNameOpacity, translateY: planNameDrop }),
      fadeOut({ opacity: rhythmOpacity, translateY: rhythmDrop }),
      fadeOut({ opacity: formActionOpacity, translateY: formActionDrop }),
    ]).start(() => {
      setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'funding' }));
      setCurrentPhase(guidedStepsCompleted.funding ? 'form' : 'guidance');
      setStage('funding');
    });
  };

  const continueFromFunding = () => {
    Animated.parallel([
      fadeOut({ opacity: fundingFieldOpacity, translateY: fundingFieldDrop }),
      fadeOut({ opacity: fundingHelperOpacity, translateY: fundingHelperDrop }),
      fadeOut({ opacity: fundingActionOpacity, translateY: fundingActionDrop }),
    ]).start(() => {
      setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'steady_obligations' }));
      setCurrentPhase(guidedStepsCompleted.steady_obligations ? 'form' : 'guidance');
      setStage('steady_obligations');
    });
  };

  const skipFunding = () => {
    setDraftBudget((current) => updateDraftBudgetPlan(current, { fundingAmount: null }));
    continueFromFunding();
  };

  const returnToMetadata = () => {
    if (!guidedStepsCompleted.metadata) {
      setCurrentPhase('guidance');
      setStage('metadata');
      return;
    }
    setCurrentPhase('form');
    sceneOpacity.setValue(0);
    sceneDrop.setValue(-8);
    formPromptOpacity.setValue(1);
    formPromptDrop.setValue(0);
    planNameOpacity.setValue(1);
    planNameDrop.setValue(0);
    rhythmOpacity.setValue(1);
    rhythmDrop.setValue(0);
    formActionOpacity.setValue(1);
    formActionDrop.setValue(0);
    controlsOpacity.setValue(1);
    controlsDrop.setValue(0);
    setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'metadata' }));
    setStage('metadata');
  };

  const returnToFunding = () => {
    setCurrentPhase('form');
    fundingFieldOpacity.setValue(1);
    fundingFieldDrop.setValue(0);
    fundingHelperOpacity.setValue(1);
    fundingHelperDrop.setValue(0);
    fundingActionOpacity.setValue(1);
    fundingActionDrop.setValue(0);
    controlsOpacity.setValue(1);
    controlsDrop.setValue(0);
    setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'funding' }));
    setStage('funding');
  };

  const continueFromSteadyObligations = () => {
    Animated.parallel([
      fadeOut({ opacity: steadyListOpacity, translateY: steadyListDrop }),
      fadeOut({ opacity: steadyHelperOpacity, translateY: steadyHelperDrop }),
      fadeOut({ opacity: steadyActionOpacity, translateY: steadyActionDrop }),
    ]).start(() => {
      setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'categories' }));
      setCurrentPhase(guidedStepsCompleted.categories ? 'form' : 'guidance');
      setStage('categories');
    });
  };

  const returnToSteadyObligations = () => {
    setCurrentPhase('form');
    steadyListOpacity.setValue(1);
    steadyListDrop.setValue(0);
    steadyHelperOpacity.setValue(1);
    steadyHelperDrop.setValue(0);
    steadyActionOpacity.setValue(1);
    steadyActionDrop.setValue(0);
    controlsOpacity.setValue(1);
    controlsDrop.setValue(0);
    setDraftBudget((current) => updateDraftBudgetPlan(current, { currentStep: 'steady_obligations' }));
    setStage('steady_obligations');
  };

  return {
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
    dismissReserveSuggestion: () => setReserveDismissed(true),
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
    skipGuidance: () => {
      if (!isGuidanceSkippable || currentPhase !== 'guidance') return;
      guidanceAnimationRef.current?.stop();
      guidanceAnimationRef.current = Animated.sequence([
        Animated.parallel([
          fadeOut({ opacity: sceneOpacity, translateY: sceneDrop }, 220),
          fadeOut({ opacity: messageOpacity, translateY: messageDrop }, 220),
        ]),
      ]);
      guidanceAnimationRef.current.start(() => {
        setIsGuidanceSkippable(false);
        setGuidedStepsCompleted((current) => ({ ...current, [stage]: true }));
        setCurrentPhase('form');
        guidanceAnimationRef.current = null;
      });
    },
    motion: {
      sceneOpacity,
      sceneDrop,
      messageOpacity,
      messageDrop,
      formPromptOpacity,
      formPromptDrop,
      planNameOpacity,
      planNameDrop,
      rhythmOpacity,
      rhythmDrop,
      formActionOpacity,
      formActionDrop,
      fundingFieldOpacity,
      fundingFieldDrop,
      fundingHelperOpacity,
      fundingHelperDrop,
      fundingActionOpacity,
      fundingActionDrop,
      steadyListOpacity,
      steadyListDrop,
      steadyHelperOpacity,
      steadyHelperDrop,
      steadyActionOpacity,
      steadyActionDrop,
      vesselsSuggestionOpacity,
      vesselsSuggestionDrop,
      vesselsListOpacity,
      vesselsListDrop,
      vesselsHelperOpacity,
      vesselsHelperDrop,
      vesselsActionOpacity,
      vesselsActionDrop,
      reviewSummaryOpacity,
      reviewSummaryDrop,
      reviewActionOpacity,
      reviewActionDrop,
      controlsOpacity,
      controlsDrop,
    },
  };
}
