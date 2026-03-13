import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

const CANVAS_SCALE = 1.15;
const MIN_CANVAS_SIZE = 520;
const MAX_CANVAS_SIZE = 1400;
const MIN_RAIL_RADIUS = 160;
const CORE_MIN_SIZE = 120;
const CORE_MAX_SIZE = 170;
const CHECKPOINT_MIN_SIZE = 48;
const CHECKPOINT_MAX_SIZE = 68;
const CHECKPOINT_GAP = 12;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Core Trigonometry Engine: Converts degrees to exact screen pixels.
 */
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export default function ClockRailMap({ milestone, onToggleTask }) {
  const { theme } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [viewportSize, setViewportSize] = useState({
    width: windowWidth,
    height: windowHeight,
  });
  const [activeTask, setActiveTask] = useState(null);
  const tasks = useMemo(() => milestone?.tasks ?? [], [milestone]);
  const totalTasks = tasks.length;
  const width = viewportSize.width || windowWidth;
  const height = viewportSize.height || windowHeight;

  const maxViewport = Math.min(width, height);
  const initialCanvasSize = clamp(maxViewport * CANVAS_SCALE, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue((width - initialCanvasSize) / 2);
  const translateY = useSharedValue((height - initialCanvasSize) / 2);
  const savedTranslateX = useSharedValue((width - initialCanvasSize) / 2);
  const savedTranslateY = useSharedValue((height - initialCanvasSize) / 2);

  const geometry = useMemo(() => {
    const maxViewport = Math.min(width, height);
    const canvasSize = clamp(maxViewport * CANVAS_SCALE, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
    const center = canvasSize / 2;
    const checkpointSizeFromCanvas = clamp(canvasSize * 0.06, CHECKPOINT_MIN_SIZE, CHECKPOINT_MAX_SIZE);
    const maxRailRadius = center - checkpointSizeFromCanvas / 2 - 20;
    const desiredSpacing = checkpointSizeFromCanvas + CHECKPOINT_GAP;
    const requiredRadius = totalTasks > 1 ? (desiredSpacing * totalTasks) / (2 * Math.PI) : MIN_RAIL_RADIUS;
    const railRadius = clamp(Math.max(canvasSize * 0.34, requiredRadius), MIN_RAIL_RADIUS, maxRailRadius);
    const checkpointSize =
      totalTasks > 0
        ? clamp((2 * Math.PI * railRadius) / totalTasks - CHECKPOINT_GAP, CHECKPOINT_MIN_SIZE, CHECKPOINT_MAX_SIZE)
        : checkpointSizeFromCanvas;
    const coreSize = clamp(canvasSize * 0.12, CORE_MIN_SIZE, CORE_MAX_SIZE);

    return {
      canvasSize,
      center,
      railRadius,
      innerRailRadius: railRadius * 0.55,
      checkpointSize,
      coreSize,
    };
  }, [width, height, totalTasks]);

  const defaultScale = 1;

  // Fit-to-view scale so the entire clockrail (outer radius + node size) can be seen at once without panning.
  // (Must be defined *after* geometry to avoid "checkpointSize of undefined" crashes.)
  // Adapt to screen size:
  // - On small screens: show the full rail with a bit of padding (fitScale <= 1)
  // - On large screens: allow scale up to 1 so it doesn't look "tiny"
  const fitScale = useMemo(() => {
    const nodeRadius = geometry?.checkpointSize ? geometry.checkpointSize / 2 : CHECKPOINT_MIN_SIZE / 2;
    const railRadius = geometry?.railRadius ?? MIN_RAIL_RADIUS;
    const padding = 16;
    const contentRadius = railRadius + nodeRadius + padding;
    const requiredSize = contentRadius * 2;
    const maxViewport = Math.min(width, height);
    if (!requiredSize || !maxViewport) return defaultScale;
    return clamp(maxViewport / requiredSize, 0.5, 1);
  }, [defaultScale, geometry, width, height]);

  const taskNodes = useMemo(() => {
    if (totalTasks === 0) return [];

    return tasks
      .map((task, index) => {
        if (!task) return null;

        const angle = (360 / totalTasks) * index;
        const position = polarToCartesian(geometry.center, geometry.center, geometry.railRadius, angle);
        return { task, index, position };
      })
      .filter(Boolean);
  }, [tasks, totalTasks, geometry.center, geometry.railRadius]);

  useEffect(() => {
    // UX: subtle motion should feel "alive" without becoming distracting.
    // 32s per full rotation is ~25% faster than 40s, but still calm.
    rotation.value = withRepeat(
      withTiming(360, { duration: 32000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  useEffect(() => {
    // Reset viewport so the whole rail is visible by default (no hidden nodes on first render).
    // Also apply fitScale as the starting zoom.
    const centeredX = (width - geometry.canvasSize) / 2;
    const centeredY = (height - geometry.canvasSize) / 2;

    scale.value = fitScale;
    savedScale.value = fitScale;

    translateX.value = centeredX;
    translateY.value = centeredY;
    savedTranslateX.value = centeredX;
    savedTranslateY.value = centeredY;
  }, [
    width,
    height,
    geometry.canvasSize,
    fitScale,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  // Expo Go + RN Gesture Handler sometimes misbehaves with Pinch+Reanimated on Android.
  // Instead of crashing the app, we safely degrade to pan-only on Android in dev clients.
  const pinchGesture = Gesture.Pinch()
    .enabled(false)
    .onUpdate(() => {})
    .onEnd(() => {});

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGestures = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedCanvasStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const animatedRailStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  const handleTaskTap = (task) => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTask(task);
  };

  const handleTaskComplete = () => {
    if (!activeTask || !milestone) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToggleTask?.(milestone.id, activeTask.id);
    setActiveTask(null);
  };

  if (!milestone) return null;

  return (
    <View
      style={styles.viewport}
      onLayout={(event) => {
        const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
        if (
          Math.abs(layoutWidth - viewportSize.width) > 1 ||
          Math.abs(layoutHeight - viewportSize.height) > 1
        ) {
          setViewportSize({
            width: layoutWidth,
            height: layoutHeight,
          });
        }
      }}
    >
      <GestureDetector gesture={composedGestures}>
        <Animated.View
          style={[
            styles.canvasBoundary,
            { width: geometry.canvasSize, height: geometry.canvasSize },
            animatedCanvasStyle,
          ]}
        >
          <View style={[StyleSheet.absoluteFill, styles.centerElements]}>
            <Svg width={geometry.canvasSize} height={geometry.canvasSize}>
              {taskNodes.map(({ task, index, position }) => {
                return (
                  <Line
                    key={`spoke-${task.id || index}`}
                    x1={geometry.center}
                    y1={geometry.center}
                    x2={position.x}
                    y2={position.y}
                    stroke={theme.accent}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                );
              })}
            </Svg>
          </View>

          <Animated.View style={[StyleSheet.absoluteFill, styles.centerElements, animatedRailStyle]}>
            <Svg width={geometry.canvasSize} height={geometry.canvasSize}>
              <Circle
                cx={geometry.center}
                cy={geometry.center}
                r={geometry.railRadius}
                stroke={theme.accent}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="14 10"
                opacity="0.9"
              />
              <Circle
                cx={geometry.center}
                cy={geometry.center}
                r={geometry.innerRailRadius}
                stroke={theme.accent}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="10 8"
                opacity="0.75"
              />
            </Svg>
          </Animated.View>

          <View
            style={[
              styles.coreNode,
              {
                left: geometry.center - geometry.coreSize / 2,
                top: geometry.center - geometry.coreSize / 2,
                width: geometry.coreSize,
                height: geometry.coreSize,
                borderRadius: geometry.coreSize / 2,
                backgroundColor: theme.surface,
                borderColor: theme.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.coreTitle,
                {
                  color: theme.accent,
                  fontSize: clamp(geometry.coreSize * 0.12, 14, 20),
                  letterSpacing: clamp(geometry.coreSize * 0.016, 2, 3),
                },
              ]}
            >
              PHASE {milestone.id}
            </Text>
          </View>

          {taskNodes.map(({ task, index, position }) => {
            const isCompleted = task.is_completed === 1;
            const isActive = activeTask && activeTask.id === task.id;

            return (
              <TouchableOpacity
                key={`task-${task.id || index}`}
                activeOpacity={0.8}
                onPress={() => handleTaskTap(task)}
                hitSlop={8}
                style={[
                  styles.taskDot,
                  {
                    left: position.x - geometry.checkpointSize / 2,
                    top: position.y - geometry.checkpointSize / 2,
                    width: geometry.checkpointSize,
                    height: geometry.checkpointSize,
                    borderRadius: geometry.checkpointSize / 2,
                    backgroundColor: isCompleted ? theme.success : theme.surface,
                    borderColor: isActive ? theme.accent : (isCompleted ? theme.success : theme.border),
                    borderWidth: isActive ? 4 : 2.5,
                    transform: [{ scale: isActive ? 1.3 : 1 }],
                  },
                ]}
              >
                {isCompleted && (
                  <Text style={[styles.taskCheck, { fontSize: Math.round(geometry.checkpointSize * 0.46) }]}>
                    {'\u2713'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </GestureDetector>

      {activeTask !== null && (
        <View style={styles.overlayWrapper}>
          <View style={[styles.overlayCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.overlayTitle, { color: theme.text }]} numberOfLines={3}>
              {activeTask.title}
            </Text>

            <View style={styles.overlayActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTask(null);
                }}
              >
                <Text style={[styles.actionBtnText, { color: theme.textMuted }]}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: activeTask.is_completed === 1 ? theme.surface : theme.accent,
                    borderColor: theme.accent,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleTaskComplete}
              >
                <Text style={[styles.actionBtnText, { color: activeTask.is_completed === 1 ? theme.accent : '#ffffff' }]}>
                  {activeTask.is_completed === 1 ? 'Re-open Task' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasBoundary: {
    position: 'relative',
  },
  centerElements: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreNode: {
    position: 'absolute',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  coreTitle: {
    fontWeight: '900',
  },
  taskDot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 20,
  },
  taskCheck: {
    color: '#ffffff',
    fontWeight: '900',
  },
  overlayWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  overlayCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    maxHeight: 170,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 12,
  },
  overlayActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
