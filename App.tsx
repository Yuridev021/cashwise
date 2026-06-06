import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import LottieView from 'lottie-react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';

import LoginScreen from "./screens/loginscreen";
import SignInOptionsScreen from "./screens/SignInOptionsScreen";
import SignUpOptionsScreen from "./screens/SignUpOptionsScreen";
import SignUpFormScreen from "./screens/SignUpFormScreen";
import HomeScreen from "./screens/HomeScreen";
import UserSettingsScreen from "./screens/UserSettingsScreen";
import AddTransactionScreen from "./screens/AddTransactionScreen";
import ChartsScreen from "./screens/ChartsScreen";
import BudgetScreen from "./screens/BudgetScreen";
import TransactionsScreen from "./screens/TransactionsScreen";

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignInOptions" component={SignInOptionsScreen} />
      <AuthStack.Screen name="SignUpOptions" component={SignUpOptionsScreen} />
      <AuthStack.Screen name="SignUpForm" component={SignUpFormScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator({ userId }: { userId: string }) {
  return (
    <FinanceProvider userId={userId}>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Home" component={HomeScreen} />
        <AppStack.Screen name="UserSettings" component={UserSettingsScreen} />
        <AppStack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <AppStack.Screen name="Charts" component={ChartsScreen} />
        <AppStack.Screen name="Budget" component={BudgetScreen} />
        <AppStack.Screen name="Transactions" component={TransactionsScreen} />
      </AppStack.Navigator>
    </FinanceProvider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const [minLoadingDone, setMinLoadingDone] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMinLoadingDone(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minLoadingDone) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#01033e' }}>
        <LottieView
          source={require('./assets/loading.json')}
          autoPlay
          loop
          style={{ width: 550, height: 550 }}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator userId={user.uid} /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
