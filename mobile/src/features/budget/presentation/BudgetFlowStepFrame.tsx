import { ReactNode } from 'react';
import { Animated, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { BudgetFlowHeader } from './BudgetFlowHeader';
import { Colors, Fonts } from '../../../constants/theme';
import { SkippableIntroRegion } from '../../motion/presentation/SkippableIntroRegion';

type Props = {
  showHero: boolean;
  heroImage?: ImageSourcePropType;
  heroOpacity: Animated.Value;
  heroDrop: Animated.Value;
  showHeader: boolean;
  stepLabel: string;
  onBack?: () => void;
  prompt: ReactNode;
  promptOpacity: Animated.Value;
  promptDrop: Animated.Value;
  children: ReactNode;
  controlsOpacity: Animated.Value;
  controlsDrop: Animated.Value;
  footer?: ReactNode;
  layout?: 'stacked' | 'distributed';
  headerBehavior?: 'normal' | 'sticky';
  introSkippable?: boolean;
  onSkipIntro?: () => void;
};

export function BudgetFlowStepFrame({
  showHero,
  heroImage,
  heroOpacity,
  heroDrop,
  showHeader,
  stepLabel,
  onBack,
  prompt,
  promptOpacity,
  promptDrop,
  children,
  controlsOpacity,
  controlsDrop,
  footer,
  layout = 'stacked',
  headerBehavior = 'normal',
  introSkippable = false,
  onSkipIntro = () => undefined,
}: Props) {
  return (
    <>
      <SkippableIntroRegion enabled={introSkippable} onSkip={onSkipIntro} style={styles.introRegion}>
        {showHero && heroImage ? (
          <Animated.View style={[styles.ebisuScene, { opacity: heroOpacity, transform: [{ translateY: heroDrop }] }]}>
            <Animated.Image
              source={heroImage}
              style={styles.ebisuImage}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        ) : null}

        {!showHeader ? (
          <Animated.View style={[styles.messageBlock, { opacity: promptOpacity, transform: [{ translateY: promptDrop }] }]}>
            {prompt}
          </Animated.View>
        ) : null}
      </SkippableIntroRegion>

      {showHeader ? (
        <View style={headerBehavior === 'sticky' ? styles.stickyHeader : undefined}>
          <BudgetFlowHeader stepLabel={stepLabel} onBack={onBack} />
        </View>
      ) : null}

      {showHeader ? (
        <Animated.View style={[styles.messageBlock, { opacity: promptOpacity, transform: [{ translateY: promptDrop }] }]}>
          {prompt}
        </Animated.View>
      ) : null}

      {layout === 'distributed' ? (
        <View style={styles.distributedBody}>
          <Animated.View style={[styles.controlsBlock, { opacity: controlsOpacity, transform: [{ translateY: controlsDrop }] }]}>
            {children}
          </Animated.View>
          {footer}
        </View>
      ) : (
        <>
          <Animated.View style={[styles.controlsBlock, { opacity: controlsOpacity, transform: [{ translateY: controlsDrop }] }]}>
            {children}
          </Animated.View>
          {footer}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  ebisuScene: {
    width: '100%',
    height: 285,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  introRegion: {
    width: '100%',
  },
  ebisuImage: {
    width: '100%',
    height: '100%',
  },
  messageBlock: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  controlsBlock: {
    gap: 12,
    marginTop: 8,
  },
  distributedBody: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  stickyHeader: {
    zIndex: 1,
    backgroundColor: Colors.surface.warm,
  },
});
