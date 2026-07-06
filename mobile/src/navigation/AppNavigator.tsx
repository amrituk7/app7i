import { ComponentType, useCallback, useEffect, useMemo, useRef } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
  type NavigationState,
} from "@react-navigation/native";
import { subscribeToNotificationTaps } from "../services/pushService";
import { markBootSuccessful } from "../services/bootRecovery";
import { urlToNavigationTarget } from "./notificationRouting";
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { useColors } from "../theme/ThemeContext";
import { AuthNavigator } from "./AuthNavigator";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { InstructorOnboardingScreen } from "../screens/onboarding/InstructorOnboardingScreen";
import { VerifyEmailScreen } from "../screens/auth/VerifyEmailScreen";
import { InstructorDashboardScreen } from "../screens/instructor/InstructorDashboardScreen";
import { TodayLessonsScreen } from "../screens/instructor/TodayLessonsScreen";
import { LessonsCalendarScreen } from "../screens/instructor/LessonsCalendarScreen";
import { StudentsScreen } from "../screens/instructor/StudentsScreen";
import { MessagesScreen } from "../screens/instructor/MessagesScreen";
import { ConversationScreen } from "../screens/instructor/ConversationScreen";
import { AddStudentScreen } from "../screens/instructor/AddStudentScreen";
import { EditStudentScreen } from "../screens/instructor/EditStudentScreen";
import { StudentProfileScreen } from "../screens/instructor/StudentProfileScreen";
import { StudentLessonsListScreen } from "../screens/instructor/StudentLessonsListScreen";
import { ProgressTrackerScreen } from "../screens/instructor/ProgressTrackerScreen";
import { EarningsScreen } from "../screens/instructor/EarningsScreen";
import { InvoicesScreen } from "../screens/instructor/InvoicesScreen";
import { BookLessonScreen } from "../screens/instructor/BookLessonScreen";
import { EditLessonScreen } from "../screens/instructor/EditLessonScreen";
import { LessonDetailScreen } from "../screens/instructor/LessonDetailScreen";
import { SettingsScreen } from "../screens/instructor/SettingsScreen";
import { RemindersSettingsScreen } from "../screens/instructor/RemindersSettingsScreen";
import { MyProfileScreen } from "../screens/instructor/MyProfileScreen";
import { StudentDashboardScreen } from "../screens/student/StudentDashboardScreen";
import { StudentLessonsScreen } from "../screens/student/StudentLessonsScreen";
import { StudentProgressScreen } from "../screens/student/StudentProgressScreen";
import { StudentNotesScreen } from "../screens/student/StudentNotesScreen";
import { StudentMessagesScreen } from "../screens/student/StudentMessagesScreen";
import { StudentInstructorScreen } from "../screens/student/StudentInstructorScreen";
import { LessonFeedbackScreen } from "../screens/student/LessonFeedbackScreen";
import { StudentLibraryScreen } from "../screens/student/StudentLibraryScreen";
import { StudentResourcesScreen } from "../screens/student/StudentResourcesScreen";
import { StudentImportantNotesScreen } from "../screens/student/StudentImportantNotesScreen";
import { StudentRateInstructorScreen } from "../screens/student/StudentRateInstructorScreen";
import { StudentTestReadinessScreen } from "../screens/student/StudentTestReadinessScreen";
import { FeedbackSummaryScreen } from "../screens/instructor/FeedbackSummaryScreen";
import { CalendarSyncScreen } from "../screens/instructor/CalendarSyncScreen";
import { TestReadinessScreen } from "../screens/instructor/TestReadinessScreen";
import { CarHealthScreen } from "../screens/instructor/CarHealthScreen";
import { TipsScreen } from "../screens/instructor/TipsScreen";
import { StudentTipsScreen } from "../screens/student/StudentTipsScreen";
import { ExpensesScreen } from "../screens/instructor/ExpensesScreen";
import { MileageScreen } from "../screens/instructor/MileageScreen";
import { NotificationsScreen } from "../screens/shared/NotificationsScreen";
import { PrivacyPolicyScreen } from "../screens/shared/PrivacyPolicyScreen";
import { TermsScreen } from "../screens/shared/TermsScreen";

const Stack = createNativeStackNavigator();
const InstructorTabs = createBottomTabNavigator();
const StudentTabs = createBottomTabNavigator();

function useNavTheme() {
  const c = useColors();
  return useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: c.background,
        card: c.surface,
        text: c.slate900,
        border: c.border,
        primary: c.emerald,
      },
    }),
    [c],
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Ionicons name={focused ? filled : outline} size={26} color={color} />
  );
}

function TabBarButton({
  children,
  href: _href,
  onPress,
  ref: _ref,
  style,
  ...props
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      onPress={onPress as PressableProps["onPress"]}
      style={({ pressed }) => [style, pressed && styles.tabButtonPressed]}
    >
      {children}
    </Pressable>
  );
}

// Wrap any screen so a thrown error inside it shows a friendly fallback
// (instead of crashing the whole navigation tree). Also logs every mount.
function safeScreen(
  Component: ComponentType<any>,
  screenName: string,
): ComponentType<any> {
  function MountLogger() {
    useEffect(() => {
      console.log("[Screen] mounted", screenName);
    }, []);
    return null;
  }
  function Wrapped(props: any) {
    return (
      <ErrorBoundary screenName={screenName}>
        <MountLogger />
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  Wrapped.displayName = `Safe(${screenName})`;
  return Wrapped;
}

// Cache wrapped components at module scope so React Navigation gets stable refs.
const SafeInstructorDashboard = safeScreen(InstructorDashboardScreen, "Dashboard");
const SafeNotifications = safeScreen(NotificationsScreen, "Notifications");
const SafeTodayLessons = safeScreen(TodayLessonsScreen, "Lessons");
const SafeLessonsCalendar = safeScreen(LessonsCalendarScreen, "Calendar");
const SafeStudents = safeScreen(StudentsScreen, "Students");
const SafeMessages = safeScreen(MessagesScreen, "Messages");
const SafeEarnings = safeScreen(EarningsScreen, "Earnings");
const SafeStudentProfile = safeScreen(StudentProfileScreen, "StudentProfile");
const SafeAddStudent = safeScreen(AddStudentScreen, "AddStudent");
const SafeEditStudent = safeScreen(EditStudentScreen, "EditStudent");
const SafeStudentLessonsList = safeScreen(StudentLessonsListScreen, "StudentLessonsList");
const SafeConversation = safeScreen(ConversationScreen, "Conversation");
const SafeLessonDetail = safeScreen(LessonDetailScreen, "LessonDetail");
const SafeBookLesson = safeScreen(BookLessonScreen, "BookLesson");
const SafeEditLesson = safeScreen(EditLessonScreen, "EditLesson");
const SafeProgressTracker = safeScreen(ProgressTrackerScreen, "ProgressTracker");
const SafeInvoices = safeScreen(InvoicesScreen, "Invoices");
const SafeExpenses = safeScreen(ExpensesScreen, "Expenses");
const SafeMileage = safeScreen(MileageScreen, "Mileage");
const SafePrivacy = safeScreen(PrivacyPolicyScreen, "PrivacyPolicy");
const SafeTerms = safeScreen(TermsScreen, "Terms");
const SafeSettings = safeScreen(SettingsScreen, "Settings");
const SafeRemindersSettings = safeScreen(RemindersSettingsScreen, "RemindersSettings");
const SafeMyProfile = safeScreen(MyProfileScreen, "MyProfile");
const SafeStudentDashboard = safeScreen(StudentDashboardScreen, "StudentHome");
const SafeStudentLessons = safeScreen(StudentLessonsScreen, "StudentLessons");
const SafeStudentProgress = safeScreen(StudentProgressScreen, "StudentProgress");
const SafeStudentMessages = safeScreen(StudentMessagesScreen, "StudentMessages");
const SafeStudentInstructor = safeScreen(StudentInstructorScreen, "StudentInstructor");
const SafeStudentNotes = safeScreen(StudentNotesScreen, "StudentNotes");
const SafeLessonFeedback = safeScreen(LessonFeedbackScreen, "LessonFeedback");
const SafeStudentLibrary = safeScreen(StudentLibraryScreen, "StudentLibrary");
const SafeStudentResources = safeScreen(StudentResourcesScreen, "StudentResources");
const SafeStudentImportantNotes = safeScreen(StudentImportantNotesScreen, "StudentImportantNotes");
const SafeStudentRateInstructor = safeScreen(StudentRateInstructorScreen, "StudentRateInstructor");
const SafeStudentTestReadiness = safeScreen(StudentTestReadinessScreen, "StudentTestReadiness");
const SafeFeedbackSummary = safeScreen(FeedbackSummaryScreen, "FeedbackSummary");
const SafeCalendarSync = safeScreen(CalendarSyncScreen, "CalendarSync");
const SafeTestReadiness = safeScreen(TestReadinessScreen, "TestReadiness");
const SafeCarHealth = safeScreen(CarHealthScreen, "CarHealth");
const SafeTips = safeScreen(TipsScreen, "Tips");
const SafeStudentTips = safeScreen(StudentTipsScreen, "StudentTips");
const SafeInstructorOnboarding = safeScreen(InstructorOnboardingScreen, "InstructorOnboarding");
const SafeVerifyEmail = safeScreen(VerifyEmailScreen, "VerifyEmail");

function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  return useMemo(
    () => ({
      height: 56 + insets.bottom,
      paddingTop: 6,
      paddingBottom: Math.max(insets.bottom, 6),
      backgroundColor: c.navBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.navBorder,
      elevation: 0,
    }),
    [insets.bottom, c],
  );
}

function useSharedTabOptions() {
  const tabBarStyle = useTabBarStyle();
  const c = useColors();
  return useMemo(
    () => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarActiveTintColor: c.navActive,
      tabBarInactiveTintColor: c.slate500,
      tabBarHideOnKeyboard: true,
      tabBarStyle,
      tabBarItemStyle: styles.tabItem,
      tabBarLabelStyle: styles.tabLabel,
      tabBarButton: TabBarButton,
    }),
    [tabBarStyle, c],
  );
}

function InstructorTabNavigator() {
  const screenOptions = useSharedTabOptions();
  return (
    <InstructorTabs.Navigator screenOptions={screenOptions}>
      <InstructorTabs.Screen
        name="Dashboard"
        component={SafeInstructorDashboard}
        options={{ tabBarIcon: tabIcon("home-outline", "home") }}
      />
      <InstructorTabs.Screen
        name="Lessons"
        component={SafeTodayLessons}
        options={{ tabBarIcon: tabIcon("car-outline", "car") }}
      />
      <InstructorTabs.Screen
        name="Calendar"
        component={SafeLessonsCalendar}
        options={{ tabBarIcon: tabIcon("calendar-outline", "calendar") }}
      />
      <InstructorTabs.Screen
        name="Students"
        component={SafeStudents}
        options={{ tabBarIcon: tabIcon("people-outline", "people") }}
      />
      <InstructorTabs.Screen
        name="CarHealth"
        component={SafeCarHealth}
        options={{
          tabBarLabel: "Car",
          tabBarIcon: tabIcon("shield-checkmark-outline", "shield-checkmark"),
        }}
      />
      <InstructorTabs.Screen
        name="Earnings"
        component={SafeEarnings}
        options={{ tabBarIcon: tabIcon("wallet-outline", "wallet") }}
      />
    </InstructorTabs.Navigator>
  );
}

function StudentTabNavigator() {
  const screenOptions = useSharedTabOptions();
  return (
    <StudentTabs.Navigator screenOptions={screenOptions}>
      <StudentTabs.Screen
        name="Home"
        component={SafeStudentDashboard}
        options={{ tabBarIcon: tabIcon("home-outline", "home") }}
      />
      <StudentTabs.Screen
        name="Lessons"
        component={SafeStudentLessons}
        options={{ tabBarIcon: tabIcon("car-outline", "car") }}
      />
      <StudentTabs.Screen
        name="Progress"
        component={SafeStudentProgress}
        options={{ tabBarIcon: tabIcon("trending-up-outline", "trending-up") }}
      />
      <StudentTabs.Screen
        name="Instructor"
        component={SafeStudentInstructor}
        options={{ tabBarIcon: tabIcon("person-outline", "person") }}
      />
      <StudentTabs.Screen
        name="Library"
        component={SafeStudentLibrary}
        options={{ tabBarIcon: tabIcon("library-outline", "library") }}
      />
    </StudentTabs.Navigator>
  );
}

function readActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (!route) return undefined;
  const child = route.state as NavigationState | undefined;
  return child ? readActiveRouteName(child) : route.name;
}

const navigationRef = createNavigationContainerRef();

export function AppNavigator() {
  const { user } = useAuth();
  const navTheme = useNavTheme();
  const stackOptions = useStackOptions();
  const lastRouteRef = useRef<string | undefined>(undefined);
  const bootMarkedRef = useRef(false);

  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    const next = readActiveRouteName(state);
    if (next && next !== lastRouteRef.current) {
      console.log("[Navigation] opening tab", next);
      lastRouteRef.current = next;
    }
    // First real route render is the semantic "app is stable" signal — clear
    // the boot-in-progress flag immediately so a brief root remount (e.g.
    // NavigationContainer init) can't trip the 5-second fallback timer and
    // leave a false-positive crash marker behind.
    if (next && !bootMarkedRef.current) {
      bootMarkedRef.current = true;
      void markBootSuccessful();
    }
  }, []);

  // Push-notification tap → deep-link via navigationRef. We subscribe once on
  // mount and rely on the ref to be ready. Failed targets log and no-op so
  // unknown URLs never crash the app.
  useEffect(() => {
    const unsub = subscribeToNotificationTaps((url) => {
      const target = urlToNavigationTarget(url);
      if (!target) {
        console.log("[Notification tap] no route for", url);
        return;
      }
      if (!navigationRef.isReady()) {
        console.log("[Notification tap] navigationRef not ready, dropping", target);
        return;
      }
      try {
        // @ts-expect-error — navigationRef.navigate is loosely typed
        navigationRef.navigate(target.screen, target.params);
      } catch (err) {
        console.warn("[Notification tap] navigate failed", err);
      }
    });
    return unsub;
  }, []);

  if (!user) {
    return (
      <ErrorBoundary screenName="AuthRoot">
        <NavigationContainer ref={navigationRef} theme={navTheme} onStateChange={handleStateChange}>
          <AuthNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    );
  }

  // Email verification gate — Firestore rules require email_verified == true
  // for every protected write. Without this gate, signed-up users hit
  // permission-denied on every action and the app appears broken.
  if (!user.emailVerified) {
    return (
      <ErrorBoundary screenName="VerifyEmailRoot">
        <NavigationContainer ref={navigationRef} theme={navTheme} onStateChange={handleStateChange}>
          <Stack.Navigator screenOptions={stackOptions}>
            <Stack.Screen
              name="VerifyEmail"
              component={SafeVerifyEmail}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    );
  }

  if (user.role === "instructor" && !user.onboardingComplete) {
    return (
      <ErrorBoundary screenName="OnboardingRoot">
        <NavigationContainer ref={navigationRef} theme={navTheme} onStateChange={handleStateChange}>
          <Stack.Navigator screenOptions={stackOptions}>
            <Stack.Screen name="InstructorOnboarding" component={SafeInstructorOnboarding} />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary screenName="AppRoot">
      <NavigationContainer ref={navigationRef} theme={navTheme} onStateChange={handleStateChange}>
        <Stack.Navigator screenOptions={stackOptions}>
          {user.role === "instructor" ? (
            <>
              <Stack.Screen name="InstructorTabs" component={InstructorTabNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="StudentProfile" component={SafeStudentProfile} options={{ headerShown: false }} />
              <Stack.Screen name="AddStudent" component={SafeAddStudent} options={{ headerShown: false }} />
              <Stack.Screen name="EditStudent" component={SafeEditStudent} options={{ headerShown: false }} />
              <Stack.Screen name="StudentLessonsList" component={SafeStudentLessonsList} options={{ headerShown: false }} />
              <Stack.Screen name="Conversation" component={SafeConversation} options={{ headerShown: false }} />
              <Stack.Screen name="LessonDetail" component={SafeLessonDetail} options={{ headerShown: false }} />
              <Stack.Screen name="BookLesson" component={SafeBookLesson} options={{ headerShown: false }} />
              <Stack.Screen name="EditLesson" component={SafeEditLesson} options={{ headerShown: false }} />
              <Stack.Screen name="ProgressTracker" component={SafeProgressTracker} options={{ title: "Progress" }} />
              <Stack.Screen name="Invoices" component={SafeInvoices} options={{ title: "Invoices" }} />
              <Stack.Screen name="Expenses" component={SafeExpenses} options={{ headerShown: false }} />
              <Stack.Screen name="Mileage" component={SafeMileage} options={{ headerShown: false }} />
              <Stack.Screen name="PrivacyPolicy" component={SafePrivacy} options={{ headerShown: false }} />
              <Stack.Screen name="Terms" component={SafeTerms} options={{ headerShown: false }} />
              <Stack.Screen name="Settings" component={SafeSettings} options={{ title: "Settings" }} />
              <Stack.Screen name="RemindersSettings" component={SafeRemindersSettings} options={{ headerShown: false }} />
              <Stack.Screen name="MyProfile" component={SafeMyProfile} options={{ headerShown: false }} />
              <Stack.Screen name="FeedbackSummary" component={SafeFeedbackSummary} options={{ title: "Student feedback" }} />
              <Stack.Screen name="CalendarSync" component={SafeCalendarSync} options={{ title: "Calendar sync" }} />
              <Stack.Screen name="TestReadiness" component={SafeTestReadiness} options={{ title: "Test readiness" }} />
              <Stack.Screen name="InstructorMessages" component={SafeMessages} options={{ headerShown: false }} />
              <Stack.Screen name="Tips" component={SafeTips} options={{ headerShown: false }} />
              <Stack.Screen name="Notifications" component={SafeNotifications} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="StudentTabs" component={StudentTabNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="StudentNotes" component={SafeStudentNotes} options={{ title: "Lesson notes" }} />
              <Stack.Screen name="LessonFeedback" component={SafeLessonFeedback} options={{ title: "Lesson feedback" }} />
              <Stack.Screen name="StudentResources" component={SafeStudentResources} options={{ title: "DVLA resources" }} />
              <Stack.Screen name="StudentImportantNotes" component={SafeStudentImportantNotes} options={{ title: "Important notes" }} />
              <Stack.Screen name="StudentRateInstructor" component={SafeStudentRateInstructor} options={{ title: "Rate your instructor" }} />
              <Stack.Screen name="StudentTestReadiness" component={SafeStudentTestReadiness} options={{ title: "My test" }} />
              <Stack.Screen name="StudentTips" component={SafeStudentTips} options={{ title: "Tips from instructor" }} />
              <Stack.Screen name="PrivacyPolicy" component={SafePrivacy} options={{ headerShown: false }} />
              <Stack.Screen name="Terms" component={SafeTerms} options={{ headerShown: false }} />
              <Stack.Screen name="Notifications" component={SafeNotifications} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

function useStackOptions() {
  const c = useColors();
  return useMemo(
    () => ({
      headerStyle: { backgroundColor: c.background },
      headerShadowVisible: false,
      headerTitleStyle: { color: c.slate900, fontWeight: "600" as const },
      headerTintColor: c.emerald,
    }),
    [c],
  );
}

const styles = StyleSheet.create({
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  tabButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
