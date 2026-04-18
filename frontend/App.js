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
import SuccessScreen from "./Screens/SuccessScreen";
import busHome from "./Screens/busHome";
import signin from "./Screens/signin";
import buspassword from "./Screens/buspassword";
import verify from "./Screens/verify";
import resetbus from "./Screens/resetbus";
import passok from "./Screens/passok";
import * as SecureStore from "expo-secure-store";

const Stack = createNativeStackNavigator();
const AuthContext = React.createContext();

export default function App() {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "RESTORE_TOKEN":
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case "SIGN_IN":
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case "SIGN_OUT":
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    },
  );

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await SecureStore.getItemAsync("userToken");
      } catch (e) {}

      dispatch({ type: "RESTORE_TOKEN", token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async data => {
        dispatch({ type: "SIGN_IN", token: "dummy-auth-token" });
      },
      signOut: () => dispatch({ type: "SIGN_OUT" }),
      signUp: async data => {
        dispatch({ type: "SIGN_IN", token: "dummy-auth-token" });
      },
    }),
    [],
  );

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {state.isLoading ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : state.userToken == null ? (
            <>
              <Stack.Screen name="AccountType" component={AccountTypeScreen} />
              <Stack.Screen name="ServiceType" component={ServiceTypeScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen
                name="OnboardingMen"
                component={OnboardingScreenMen}
              />

              <Stack.Screen
                name="Login"
                children={() => {
                  return <LoginScreen signIn={authContext.signIn} />;
                }}
                options={{
                  title: "Sign in",
                  animationTypeForReplace: state.isSignout ? "pop" : "push",
                }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
              />
              <Stack.Screen name="Otp" component={OtpScreen} />
              <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
              <Stack.Screen name="Success" component={PasswordResetSuccess} />

              <Stack.Screen
                name="CreateAccount"
                component={CreateAccountScreen}
              />
              <Stack.Screen name="FillProfile1" component={FillProfile1} />
              <Stack.Screen
                name="Congratulations"
                component={CongratulationsScreen}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Home"
                children={() => <HomeScreen logout={authContext.signOut} />}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
