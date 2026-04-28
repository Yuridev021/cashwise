import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";

import LoginScreen from "./screens/loginscreen";
import SignUpOptionsScreen from "./screens/SignUpOptionsScreen";
import SignUpFormScreen from "./screens/SignUpFormScreen";
import HomeScreen from "./screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUpOptions" component={SignUpOptionsScreen} />
            <Stack.Screen name="SignUpForm" component={SignUpFormScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}