import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import ChatScreen from './src/screens/ChatScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const GoalsStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function GoalsStackNavigator() {
  return (
    <GoalsStack.Navigator screenOptions={{ headerShown: false }}>
      <GoalsStack.Screen name="DashboardList" component={DashboardScreen} />
      <GoalsStack.Screen name="GoalDetail" component={GoalDetailScreen} />
    </GoalsStack.Navigator>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const { signOut } = useAuth();

  const tabIcon = (name) => ({ color, size }) => (
    <Ionicons name={name} size={size} color={color} />
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          height: 62,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Goals"
        component={GoalsStackNavigator}
        options={{ tabBarLabel: 'Goals', tabBarIcon: tabIcon('flag-outline') }}
      />
      <Tab.Screen
        name="Coach"
        component={ChatScreen}
        options={{ tabBarLabel: 'Coach', tabBarIcon: tabIcon('chatbubble-ellipses-outline') }}
      />
      <Tab.Screen name="You" options={{ tabBarLabel: 'You', tabBarIcon: tabIcon('person-outline') }}>
        {(props) => <ProfileScreen {...props} onSignOut={signOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function RootRouter() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, isBootstrapping } = useAuth();

  const navTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [isDark, theme]);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="MainApp" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootRouter />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
