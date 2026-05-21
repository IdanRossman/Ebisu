import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  type StyleProp,
  TouchableOpacity,
  UIManager,
  View,
  type ViewStyle,
} from 'react-native';

export type ExpandableCardState = {
  expanded: boolean;
  reduceMotion: boolean;
  expansionProgress: Animated.Value;
  toggle: () => void;
};

type Props = {
  summary: (state: ExpandableCardState) => ReactNode;
  children: (state: ExpandableCardState) => ReactNode;
  style?: StyleProp<ViewStyle>;
  detailsStyle?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  initiallyExpanded?: boolean;
  collapseOnDetailsPress?: boolean;
  onExpandedChange?: (expanded: boolean, reduceMotion: boolean) => void;
};

export function ExpandableCard({
  summary,
  children,
  style,
  detailsStyle,
  activeOpacity = 0.84,
  initiallyExpanded = false,
  collapseOnDetailsPress = false,
  onExpandedChange,
}: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [reduceMotion, setReduceMotion] = useState(false);
  const expansionProgress = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  const detailsOpacity = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  const detailsDrop = useRef(new Animated.Value(initiallyExpanded ? 0 : -8)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!expanded) {
      if (reduceMotion) {
        expansionProgress.setValue(0);
        detailsOpacity.setValue(0);
        detailsDrop.setValue(-8);
        return;
      }

      Animated.parallel([
        Animated.timing(expansionProgress, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(detailsDrop, {
          toValue: -8,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (reduceMotion) {
      expansionProgress.setValue(1);
      detailsOpacity.setValue(1);
      detailsDrop.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.timing(expansionProgress, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(detailsDrop, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [detailsDrop, detailsOpacity, expanded, expansionProgress, reduceMotion]);

  const toggle = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext({
        duration: expanded ? 220 : 360,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    }
    setExpanded((current) => {
      const next = !current;
      onExpandedChange?.(next, reduceMotion);
      return next;
    });
  };

  const state = { expanded, reduceMotion, expansionProgress, toggle };

  return (
    <View style={style}>
      <TouchableOpacity onPress={toggle} activeOpacity={activeOpacity}>
        {summary(state)}
      </TouchableOpacity>
      {expanded && collapseOnDetailsPress ? (
        <TouchableOpacity onPress={toggle} activeOpacity={1}>
          <Animated.View style={[detailsStyle, { opacity: detailsOpacity, transform: [{ translateY: detailsDrop }] }]}>
            {children(state)}
          </Animated.View>
        </TouchableOpacity>
      ) : expanded ? (
        <Animated.View style={[detailsStyle, { opacity: detailsOpacity, transform: [{ translateY: detailsDrop }] }]}>
          {children(state)}
        </Animated.View>
      ) : null}
    </View>
  );
}
