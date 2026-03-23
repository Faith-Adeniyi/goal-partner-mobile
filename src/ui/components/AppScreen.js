import { StatusBar } from 'expo-status-bar';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';

export default function AppScreen({
  children,
  scroll = false,
  padded = true,
  keyboardAware = false,
  style,
  contentContainerStyle,
  keyboardOffset = 0,
  backgroundVariant = 'plain',
  showsVerticalScrollIndicator = false,
}) {
  const { colors, spacing, statusBarStyle, backgroundStyle } = useAppTheme();

  const contentStyles = [
    styles.content,
    padded && { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
    contentContainerStyle,
  ];

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, ...contentStyles]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyles}>{children}</View>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.topRightBlob,
          {
            backgroundColor: backgroundStyle?.tint || colors.accentSoft,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.bottomLeftBlob,
          {
            backgroundColor: colors.mintSoft,
          },
        ]}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: backgroundStyle?.tint || 'transparent' }]} />
      <ImageBackground
        source={require('../../../assets/noise.png')}
        resizeMode="repeat"
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: 0.06 }]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: backgroundStyle?.overlay || 'transparent' },
        ]}
      />

      <StatusBar style={statusBarStyle} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        {wrappedContent}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.65,
  },
  topRightBlob: {
    width: 320,
    height: 320,
    right: -120,
    top: -96,
  },
  bottomLeftBlob: {
    width: 260,
    height: 260,
    left: -110,
    bottom: -96,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
