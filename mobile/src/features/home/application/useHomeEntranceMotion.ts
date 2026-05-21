import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { dropIn, revealQuickly, settleHidden, settleVisible } from '../../motion/application/entranceMotion';

export function useHomeEntranceMotion(loading: boolean, includeGlimpse = true) {
  const [isSkippable, setIsSkippable] = useState(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const ebisuOpacity = useRef(new Animated.Value(0)).current;
  const ebisuDrop = useRef(new Animated.Value(-10)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingDrop = useRef(new Animated.Value(-10)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressDrop = useRef(new Animated.Value(-8)).current;
  const glimpseOpacity = useRef(new Animated.Value(0)).current;
  const glimpseDrop = useRef(new Animated.Value(-8)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const actionDrop = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (loading) return;

    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;

      if (reduceMotion) {
        settleVisible({ opacity: ebisuOpacity, translateY: ebisuDrop });
        settleVisible({ opacity: greetingOpacity, translateY: greetingDrop });
        settleVisible({ opacity: progressOpacity, translateY: progressDrop });
        if (includeGlimpse) {
          settleVisible({ opacity: glimpseOpacity, translateY: glimpseDrop });
        } else {
          settleHidden({ opacity: glimpseOpacity, translateY: glimpseDrop });
        }
        settleVisible({ opacity: actionOpacity, translateY: actionDrop });
        setIsSkippable(false);
        return;
      }

      settleHidden({ opacity: ebisuOpacity, translateY: ebisuDrop }, -10);
      settleHidden({ opacity: greetingOpacity, translateY: greetingDrop }, -10);
      settleHidden({ opacity: progressOpacity, translateY: progressDrop });
      settleHidden({ opacity: glimpseOpacity, translateY: glimpseDrop });
      settleHidden({ opacity: actionOpacity, translateY: actionDrop });
      setIsSkippable(true);

      const entranceSteps = [
        dropIn({ opacity: ebisuOpacity, translateY: ebisuDrop }, 560),
        Animated.delay(160),
        dropIn({ opacity: greetingOpacity, translateY: greetingDrop }, 440),
        Animated.delay(110),
        dropIn({ opacity: progressOpacity, translateY: progressDrop }, 420),
      ];

      if (includeGlimpse) {
        entranceSteps.push(
          Animated.delay(110),
          dropIn({ opacity: glimpseOpacity, translateY: glimpseDrop }, 420),
        );
      }

      entranceSteps.push(
        Animated.delay(110),
        dropIn({ opacity: actionOpacity, translateY: actionDrop }, 440),
      );

      animation = Animated.sequence(entranceSteps);
      animationRef.current = animation;
      animation.start(({ finished }) => {
        if (finished) setIsSkippable(false);
      });
    });

    return () => {
      mounted = false;
      animation?.stop();
      animationRef.current = null;
    };
  }, [
    actionDrop,
    actionOpacity,
    ebisuDrop,
    ebisuOpacity,
    glimpseDrop,
    glimpseOpacity,
    greetingDrop,
    greetingOpacity,
    includeGlimpse,
    loading,
    progressDrop,
    progressOpacity,
  ]);

  const skipEntrance = () => {
    if (!isSkippable) return;
    animationRef.current?.stop();
    animationRef.current = revealQuickly([
      { opacity: ebisuOpacity, translateY: ebisuDrop },
      { opacity: greetingOpacity, translateY: greetingDrop },
      { opacity: progressOpacity, translateY: progressDrop },
      ...(includeGlimpse ? [{ opacity: glimpseOpacity, translateY: glimpseDrop }] : []),
      { opacity: actionOpacity, translateY: actionDrop },
    ], 280);
    animationRef.current.start(() => {
      setIsSkippable(false);
      animationRef.current = null;
    });
  };

  return {
    ebisuOpacity,
    ebisuDrop,
    greetingOpacity,
    greetingDrop,
    progressOpacity,
    progressDrop,
    glimpseOpacity,
    glimpseDrop,
    actionOpacity,
    actionDrop,
    isSkippable,
    skipEntrance,
  };
}
