import { useEffect } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator } from "react-native";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Flame,
  Brain,
  Bookmark,
} from "lucide-react-native";

import { store, persistor } from "./reducers/store";
import { useAppFonts } from "./theme/useAppFonts";
import { colors } from "./theme";
import { GlassTabBar } from "./components/ui";

import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import SearchByNameScreen from "./screens/SearchByNameScreen";
import DetailsScreen from "./screens/DetailsScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import SurpriseScreen from "./screens/SurpriseScreen";
import AIRecipeScreen from "./screens/AIRecipeScreen";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OnboardingScreen from "./screens/OnboardingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.onSurface,
    border: colors.outlineVariant,
    primary: colors.primary,
    notification: colors.tertiaryContainer,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <HomeIcon size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <SearchIcon size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Swipe"
        component={SurpriseScreen}
        options={{
          tabBarActiveTintColor: colors.tertiaryContainer,
          tabBarIcon: ({ color }) => (
            <Flame size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="AIRecipe"
        component={AIRecipeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Brain size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Bookmark size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const token = useSelector((state) => state.user?.value?.token);
  const hasSeenOnboarding = useSelector((state) => state.app?.hasSeenOnboarding);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    >
      {!hasSeenOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !token ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Details" component={DetailsScreen} />
          <Stack.Screen name="SearchByName" component={SearchByNameScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppShell() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <AppShell />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
