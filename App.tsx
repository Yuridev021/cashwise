import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { AuthProvider } from './context/AuthContext';

import LoginScreen from "./screens/loginscreen";
import SignInOptionsScreen from "./screens/SignInOptionsScreen";
import SignUpOptionsScreen from "./screens/SignUpOptionsScreen";
import SignUpFormScreen from "./screens/SignUpFormScreen";
import HomeScreen from "./screens/HomeScreen";
import UserSettingsScreen from "./screens/UserSettingsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignInOptions" component={SignInOptionsScreen} />
          <Stack.Screen name="SignUpOptions" component={SignUpOptionsScreen} />
          <Stack.Screen name="SignUpForm" component={SignUpFormScreen} />
          <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

