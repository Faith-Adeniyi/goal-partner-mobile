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
  backgroundVariant = 'noise',
  showsVerticalScrollIndicator = false,
}) {
  const { colors, spacing, statusBarStyle, isDark } = useAppTheme();

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
    <ImageBackground
      source={backgroundVariant === 'noise' ? require('../../../assets/noise.png') : undefined}
      style={[styles.container, { backgroundColor: colors.background }, style]}
      imageStyle={{ opacity: isDark ? 0.2 : 0.1, resizeMode: 'repeat' }}
    >
      <StatusBar style={statusBarStyle} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        {wrappedContent}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
