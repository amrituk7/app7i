import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.emeraldDark,
        headerTitleStyle: { color: colors.slate900, fontWeight: "900" },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Sign in" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Create account" }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Reset password" }} />
    </Stack.Navigator>
  );
}
