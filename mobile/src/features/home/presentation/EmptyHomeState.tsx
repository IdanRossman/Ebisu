import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { JewelButton } from '../../../components/ui';
import { Colors, Fonts } from '../../../constants/theme';
import { SkippableIntroRegion } from '../../motion/presentation/SkippableIntroRegion';

const teaEbisu = require('../../../../assets/ebisu-drinking-tea-gif.gif');

type Props = {
  displayName: string;
  motion: {
    ebisuOpacity: Animated.Value;
    ebisuDrop: Animated.Value;
    greetingOpacity: Animated.Value;
    greetingDrop: Animated.Value;
    progressOpacity: Animated.Value;
    progressDrop: Animated.Value;
    glimpseOpacity: Animated.Value;
    glimpseDrop: Animated.Value;
    actionOpacity: Animated.Value;
    actionDrop: Animated.Value;
    isSkippable: boolean;
    skipEntrance: () => void;
  };
};

export function EmptyHomeState({ displayName, motion }: Props) {
  const openBudgetSetup = () => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        router.push('/budget-setup');
        return;
      }

      Animated.parallel([
        Animated.timing(motion.ebisuOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.ebisuDrop, {
          toValue: -8,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.greetingOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.greetingDrop, {
          toValue: -8,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.progressOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.progressDrop, {
          toValue: -8,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.glimpseOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.glimpseDrop, {
          toValue: -8,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.actionOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(motion.actionDrop, {
          toValue: -8,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.push('/budget-setup');
      });
    });
  };

  return (
    <View style={styles.emptyShell}>
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        activeOpacity={0.78}
        style={styles.emptySettingsButton}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <MaterialIcons name="settings" size={19} color={Colors.palette.green} />
      </TouchableOpacity>

      <View style={styles.emptyHome}>
        <SkippableIntroRegion enabled={motion.isSkippable} onSkip={motion.skipEntrance} style={styles.hero}>
          <Animated.Image
            source={teaEbisu}
            resizeMode="contain"
            style={[
              styles.emptyEbisuImage,
              { opacity: motion.ebisuOpacity, transform: [{ translateY: motion.ebisuDrop }] },
            ]}
          />
          <Animated.Text
            style={[
              styles.emptyPrompt,
              { opacity: motion.greetingOpacity, transform: [{ translateY: motion.greetingDrop }] },
            ]}
          >
            Good evening{displayName ? `, ${displayName}` : ''}.
          </Animated.Text>
        </SkippableIntroRegion>

        <Animated.Text
          style={[
            styles.emptySupport,
            { opacity: motion.glimpseOpacity, transform: [{ translateY: motion.glimpseDrop }] },
          ]}
        >
          Our journey begins with a budget shaped to the rhythm of your household.
        </Animated.Text>

        <Animated.View style={{ opacity: motion.actionOpacity, transform: [{ translateY: motion.actionDrop }] }}>
          <JewelButton
            label="Shape Your Budget"
            onPress={openBudgetSetup}
            accessibilityLabel="Shape your budget"
            touchableStyle={styles.emptyActionWrap}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyShell: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  emptySettingsButton: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  emptyHome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    width: '100%',
  },
  emptyEbisuImage: {
    width: '100%',
    height: 240,
    marginBottom: 4,
  },
  emptyPrompt: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 20,
    lineHeight: 29,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptySupport: {
    maxWidth: 290,
    marginTop: 10,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyActionWrap: {
    marginTop: 22,
  },
});
