import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Existing Screens
import SplashScreen from "./Screens/SplashScreen";
import AccountTypeScreen from "./Screens/AccountTypeScreen";
import ServiceTypeScreen from "./Screens/ServiceTypeScreen";
import OnboardingScreen from "./Screens/OnboardingScreen";

import LoginScreen from "./Screens/LoginScreen";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import OtpScreen from "./Screens/OtpScreen";
import NewPasswordScreen from "./Screens/NewPasswordScreen";
import PasswordResetSuccess from "./Screens/PasswordResetSuccess";

import CreateAccountScreen from "./Screens/CreateAccountScreen";
import FillProfile1 from "./Screens/FillProfile1";
import CongratulationsScreen from "./Screens/CongratulationsScreen";

import EnableLocationScreen from "./Screens/EnableLocationScreen";
import HomeScreen from "./Screens/HomeScreen";
import NotificationScreen from "./Screens/NotificationScreen";
import FavoritesScreen from "./Screens/FavoritesScreen";
import SearchScreen from "./Screens/SearchScreen";

import OnboardingScreenMen from "./Screens/OnboardingScreenMen";
import onboardingbus from "./Screens/onboardingbus";
import buslogin from "./Screens/buslogin";
import busacc from "./Screens/busacc";
import BusinessProfile from "./Screens/BusinessProfile";
import SuccessScreen from  "./Screens/SuccessScreen";
import busHome from "./Screens/busHome";
import signin from "./Screens/signin";
import buspassword from "./Screens/buspassword";
import verify from "./Screens/verify";
import resetbus from "./Screens/resetbus";
import passok from "./Screens/passok";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* Auth Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AccountType" component={AccountTypeScreen} />
        <Stack.Screen name="ServiceType" component={ServiceTypeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
        <Stack.Screen name="Success" component={PasswordResetSuccess} />

        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="FillProfile1" component={FillProfile1} />
        <Stack.Screen name="Congratulations" component={CongratulationsScreen} />

        <Stack.Screen name="EnableLocation" component={EnableLocationScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />

        <Stack.Screen name="OnboardingMen" component={OnboardingScreenMen} />
        <Stack.Screen name="onboardingbus" component={onboardingbus} />
        <Stack.Screen name="buslogin" component={buslogin} />
        <Stack.Screen name="busacc" component={busacc} />
        <Stack.Screen name="BusinessProfile" component={BusinessProfile} />
        <Stack.Screen name="SuccessScreen" component={SuccessScreen} />
        <Stack.Screen name="busHome" component={busHome} />
        <Stack.Screen name="signin" component={signin} />
        <Stack.Screen name="buspassword" component={buspassword} />
        <Stack.Screen name="verify" component={verify} />
        <Stack.Screen name="resetbus" component={resetbus} />
        <Stack.Screen name="passok" component={passok} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}