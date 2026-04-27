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

import HomeScreen from "./Screens/HomeScreen";
import Womanservicehome from "./Screens/Womanservicehome";
import NotificationScreen from "./Screens/NotificationScreen"; 
import FavoritesScreen from "./Screens/FavoritesScreen";
import SearchScreen from "./Screens/SearchScreen";
import Bookingscreenwoman from "./Screens/Bookingscreenwoman";
import InboxScreen from "./Screens/Inboxscreen";
import Chatscreen from "./Screens/Chatscreen";
import Profilescreen from "./Screens/Profilescreen";
import Pointsscreen from "./Screens/Pointsscreen";
import Rewardscreen from "./Screens/Rewardscreen";


import OnboardingScreenMen from "./Screens/OnboardingScreenMen";
import onboardingbus from "./Screens/onboardingbus";
import Buslogin from "./Screens/Buslogin";
import busacc from "./Screens/busacc";
import bussacc2 from "./Screens/bussacc2";
import BusinessProfile from "./Screens/BusinessProfile";
import busHome from "./Screens/busHome";
import buspassword from "./Screens/buspassword";
import verify from "./Screens/verify";
import resetbus from "./Screens/resetbus";
import passok from "./Screens/passok";

import EditProfile from "./Screens/EditProfile";
import Notifications from "./Screens/Notifications";
import paymentmethod from "./Screens/paymentmethod";
import Languages from "./Screens/Languages";
import PrivacyPolicy from "./Screens/PrivacyPolicy";
import InviteFriends from "./Screens/InviteFriends";
import CancelBookingScreen from "./Screens/CancelBookingScreen";
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
              <Stack.Screen name="OnboardingMen"component={OnboardingScreenMen} />
              <Stack.Screen name="onboardingbus"component={onboardingbus} />

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
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen}/>
              <Stack.Screen name="Otp" component={OtpScreen} />
              <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
              <Stack.Screen name="Success" component={PasswordResetSuccess} />
              <Stack.Screen name="CreateAccount"component={CreateAccountScreen}/>
              <Stack.Screen name="FillProfile1" component={FillProfile1} />
              <Stack.Screen name="Congratulations" component={CongratulationsScreen}/>
              <Stack.Screen name="Home" component={HomeScreen}/>
               <Stack.Screen name="Womanhome" component={Womanservicehome}/>
              <Stack.Screen name="Notificationshome" component={NotificationScreen} />
              <Stack.Screen name="Favorites" component={FavoritesScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="Booking" component={Bookingscreenwoman} />
              <Stack.Screen name="CancelBookingScreen" component={CancelBookingScreen} />
              <Stack.Screen name="Inbox" component={InboxScreen} />
              <Stack.Screen name="Chatscreen" component={Chatscreen} />
              <Stack.Screen name="Profile" component={Profilescreen} />
              <Stack.Screen name="Points" component={Pointsscreen} />
              <Stack.Screen name="Rewards" component={Rewardscreen} />
             

              <Stack.Screen name="Buslogin" children={() => { return <Buslogin signIn={authContext.signIn} />  }}
                options={{
                  title: "Sign in",
                  animationTypeForReplace: state.isSignout ? "pop" : "push",
                }}
              />

             <Stack.Screen name="busacc" component={busacc}/> 
             <Stack.Screen name="bussacc2" component={bussacc2}/> 
             <Stack.Screen name="BusinessProfile" component={BusinessProfile}/>
             <Stack.Screen name="bushome" component={busHome}/>
             <Stack.Screen name="buspassword" component={buspassword}/>
             <Stack.Screen name="verify" component={verify}/> 
             <Stack.Screen name="passok" component={passok}/> 
             <Stack.Screen name="resetbus" component={resetbus}/> 

            <Stack.Screen name="EditProfile" component={EditProfile} />     
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="Languages" component={Languages} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="InviteFriends" component={InviteFriends} />
            <Stack.Screen name="paymentmethod" component={paymentmethod} />
            </>
          ) : (
            <>
               
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
