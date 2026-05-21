import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

export function useQuickAddExpenseMotion(visible: boolean, onClosed: () => void) {
  const [mounted, setMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);

  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(28)).current;
  const amountOpacity = useRef(new Animated.Value(0)).current;
  const amountTranslateY = useRef(new Animated.Value(10)).current;
  const metaOpacity = useRef(new Animated.Value(0)).current;
  const metaTranslateY = useRef(new Animated.Value(10)).current;
  const recurrenceOpacity = useRef(new Animated.Value(0)).current;
  const recurrenceTranslateY = useRef(new Animated.Value(10)).current;
  const vesselsOpacity = useRef(new Animated.Value(0)).current;
  const vesselsTranslateY = useRef(new Animated.Value(10)).current;
  const noteOpacity = useRef(new Animated.Value(0)).current;
  const noteTranslateY = useRef(new Animated.Value(10)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const actionTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  const buildExitAnimation = () => {
    const dismiss = (opacity: Animated.Value, translateY: Animated.Value) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 130,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -6,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    return Animated.parallel([
      Animated.stagger(30, [
        dismiss(actionOpacity, actionTranslateY),
        dismiss(noteOpacity, noteTranslateY),
        dismiss(vesselsOpacity, vesselsTranslateY),
        dismiss(recurrenceOpacity, recurrenceTranslateY),
        dismiss(metaOpacity, metaTranslateY),
        dismiss(amountOpacity, amountTranslateY),
      ]),
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 20,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
  };

  const resetValues = () => {
    amountOpacity.setValue(0);
    amountTranslateY.setValue(10);
    metaOpacity.setValue(0);
    metaTranslateY.setValue(10);
    vesselsOpacity.setValue(0);
    vesselsTranslateY.setValue(10);
    recurrenceOpacity.setValue(0);
    recurrenceTranslateY.setValue(10);
    noteOpacity.setValue(0);
    noteTranslateY.setValue(10);
    actionOpacity.setValue(0);
    actionTranslateY.setValue(10);
  };

  useEffect(() => {
    if (visible || !mounted) return;
    if (reduceMotion) {
      setMounted(false);
      return;
    }

    const animation = buildExitAnimation();
    animation.start(() => {
      resetValues();
      setMounted(false);
    });
    return () => animation.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, visible]);

  useEffect(() => {
    if (!mounted || !visible) return;

    if (reduceMotion) {
      [
        scrimOpacity,
        sheetOpacity,
        amountOpacity,
        metaOpacity,
        recurrenceOpacity,
        vesselsOpacity,
        noteOpacity,
        actionOpacity,
      ].forEach((value) => value.setValue(1));
      [
        sheetTranslateY,
        amountTranslateY,
        metaTranslateY,
        recurrenceTranslateY,
        vesselsTranslateY,
        noteTranslateY,
        actionTranslateY,
      ].forEach((value) => value.setValue(0));
      return;
    }

    scrimOpacity.setValue(0);
    sheetOpacity.setValue(0);
    sheetTranslateY.setValue(28);
    amountOpacity.setValue(0);
    amountTranslateY.setValue(10);
    metaOpacity.setValue(0);
    metaTranslateY.setValue(10);
    recurrenceOpacity.setValue(0);
    recurrenceTranslateY.setValue(10);
    vesselsOpacity.setValue(0);
    vesselsTranslateY.setValue(10);
    noteOpacity.setValue(0);
    noteTranslateY.setValue(10);
    actionOpacity.setValue(0);
    actionTranslateY.setValue(10);

    const settle = (opacity: Animated.Value, translateY: Animated.Value) => Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(sheetOpacity, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.stagger(65, [
        settle(amountOpacity, amountTranslateY),
        settle(metaOpacity, metaTranslateY),
        settle(recurrenceOpacity, recurrenceTranslateY),
        settle(vesselsOpacity, vesselsTranslateY),
        settle(noteOpacity, noteTranslateY),
        settle(actionOpacity, actionTranslateY),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [
    actionOpacity,
    actionTranslateY,
    amountOpacity,
    amountTranslateY,
    metaOpacity,
    metaTranslateY,
    mounted,
    noteOpacity,
    noteTranslateY,
    reduceMotion,
    scrimOpacity,
    sheetOpacity,
    sheetTranslateY,
    vesselsOpacity,
    vesselsTranslateY,
    visible,
  ]);

  const close = () => {
    if (reduceMotion) {
      setMounted(false);
      onClosed();
      return;
    }

    buildExitAnimation().start(() => {
      resetValues();
      setMounted(false);
      onClosed();
    });
  };

  return {
    mounted,
    close,
    motion: {
      scrimOpacity,
      sheetOpacity,
      sheetTranslateY,
      amountOpacity,
      amountTranslateY,
      metaOpacity,
      metaTranslateY,
      recurrenceOpacity,
      recurrenceTranslateY,
      vesselsOpacity,
      vesselsTranslateY,
      noteOpacity,
      noteTranslateY,
      actionOpacity,
      actionTranslateY,
    },
  };
}
