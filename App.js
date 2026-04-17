import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, Platform, View } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { store, persistor } from "./reducers/store";

import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import SearchByNameScreen from "./screens/SearchByNameScreen";
import DetailsScreen from "./screens/DetailsScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import SurpriseScreen from "./screens/SurpriseScreen";
import AIRecipeScreen from "./screens/AIRecipeScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarSafeAreaInsets: { bottom: 0 },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#2a0b2e",
          borderTopColor: "#ff4fd8",
          height: Platform.OS === "android" ? 72 : 80,
          paddingBottom: Platform.OS === "android" ? 14 : 18,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#ff8a00",
        tabBarInactiveTintColor: "#ffb3df",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Accueil",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? "🍸" : "🥂"}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: "Recherche",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? "🔮" : "✨"}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Swipe"
        component={SurpriseScreen}
        options={{
          tabBarLabel: "Swipe",
          tabBarIcon: ({ focused }) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 22 }}>❤</Text>
              <Text style={{ fontSize: 22, marginLeft: -12 }}>💚</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AIRecipe"
        component={AIRecipeScreen}
        options={{
          tabBarLabel: "IA",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? "⚗️" : "🧪"}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: "Favoris",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? "💎" : "🤍"}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#2a0b2e",
                },
                headerTintColor: "#ff8a00",
                headerTitleStyle: {
                  fontWeight: "600",
                  fontSize: 17,
                },
                headerBackTitle: "",
                headerShadowVisible: false,
                animation: "default",
              }}
            >
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Details"
                component={DetailsScreen}
                options={{
                  title: "Détails du cocktail",
                  headerBackTitle: " ",
                  headerBackTitleVisible: false,
                }}
              />
              <Stack.Screen
                name="SearchByName"
                component={SearchByNameScreen}
                options={{
                  title: "Recherche par nom",
                  headerBackTitle: " ",
                  headerBackTitleVisible: false,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
