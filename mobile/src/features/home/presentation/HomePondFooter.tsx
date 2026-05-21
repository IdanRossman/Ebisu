import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Radius } from '../../../constants/theme';

const pondVideo = require('../../../../assets/ebisu_pond.mp4');

export function HomePondFooter() {
  const player = useVideoPlayer(pondVideo, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        player.play();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.glow} />
      <View style={styles.frame}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: -4,
  },
  glow: {
    position: 'absolute',
    top: 20,
    width: '94%',
    height: 58,
    borderRadius: 999,
    backgroundColor: 'rgba(79,175,143,0.08)',
  },
  frame: {
    width: '100%',
    height: 86,
    borderRadius: Radius.full,
    overflow: 'hidden',
    opacity: 0.82,
    backgroundColor: 'rgba(79,175,143,0.08)',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
