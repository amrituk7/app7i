import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConversationHeader } from "../../components/messaging/ConversationHeader";
import { DateSeparator } from "../../components/messaging/DateSeparator";
import { MessageBubble } from "../../components/messaging/MessageBubble";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { getStudent } from "../../services/dataService";
import {
  deleteConversation,
  markAsRead,
  sendMessage,
  softDeleteMessage,
  subscribeConversation,
} from "../../services/messagesService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Message, Student } from "../../types";
import { hapticTap } from "../../utils/haptics";
import { describeFirestoreError } from "../../utils/firestoreError";

type Nav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

type Route = {
  params?: {
    studentId?: string;
    studentName?: string;
  };
};

// 2-minute window groups consecutive messages from the same sender — iMessage default.
const GROUP_WINDOW_MS = 2 * 60_000;

type ChatItem =
  | { kind: "message"; message: Message; grouped: boolean; followedByGroup: boolean; isLastSent: boolean }
  | { kind: "date"; key: string; label: string };

function isMine(message: Message, instructorUid: string) {
  return message.sender === instructorUid || message.sender === "instructor";
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const todayKey = dayKey(now.getTime());
  const yKey = dayKey(now.getTime() - 86_400_000);
  const k = dayKey(ts);
  if (k === todayKey) return "Today";
  if (k === yKey) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
}

function buildChatItems(messages: Message[], currentUid: string): ChatItem[] {
  // Find the last sent message id by `mine` for the "Delivered"/"Read" tag.
  let lastSentIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (isMine(messages[i], currentUid) && !messages[i].deleted) {
      lastSentIndex = i;
      break;
    }
  }

  const items: ChatItem[] = [];
  let prevDayKey = "";
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const k = dayKey(m.timestamp || Date.now());
    if (k !== prevDayKey) {
      items.push({ kind: "date", key: `date-${k}-${i}`, label: dateLabel(m.timestamp || Date.now()) });
      prevDayKey = k;
    }
    const prev = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;
    const grouped = !!prev
      && prev.sender === m.sender
      && Math.abs((m.timestamp || 0) - (prev.timestamp || 0)) < GROUP_WINDOW_MS
      && dayKey(prev.timestamp || 0) === k;
    const followedByGroup = !!next
      && next.sender === m.sender
      && Math.abs((next.timestamp || 0) - (m.timestamp || 0)) < GROUP_WINDOW_MS
      && dayKey(next.timestamp || 0) === k;
    items.push({
      kind: "message",
      message: m,
      grouped,
      followedByGroup,
      isLastSent: i === lastSentIndex,
    });
  }
  return items;
}

export function ConversationScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: Route;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const studentId = route.params?.studentId || "";
  const studentName = route.params?.studentName || "Student";
  const [student, setStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch student details (for phone → WhatsApp / call) once.
  useEffect(() => {
    if (!studentId) return;
    getStudent(studentId).then(setStudent).catch(() => {});
  }, [studentId]);

  useEffect(() => {
    if (!user?.uid || !studentId) {
      setLoading(false);
      setError("Missing conversation reference.");
      return undefined;
    }

    setError(null);
    setLoading(true);
    const unsubscribe = subscribeConversation(
      user.uid,
      studentId,
      user.uid,
      (next) => {
        setMessages(next);
        setLoading(false);
        void Promise.all(
          next
            .filter((message) => !message.read && !message.deleted && !isMine(message, user.uid))
            .map((message) => markAsRead(message.id).catch(() => {})),
        );
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [studentId, user?.uid]);

  const confirmDeleteChat = useCallback(() => {
    if (!user?.uid || !studentId) return;
    Alert.alert(
      "Delete chat?",
      `Permanently remove your conversation with ${studentName}. This can't be undone.`,
      [
        { text: "Keep chat", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(user.uid, studentId);
              navigation.goBack();
            } catch (err) {
              Alert.alert(
                "Couldn't delete chat",
                describeFirestoreError(err, { action: "deleteConversation", mayBeUnverified: !user?.emailVerified }),
              );
            }
          },
        },
      ],
    );
  }, [navigation, studentId, studentName, user?.emailVerified, user?.uid]);

  const items = useMemo(() => buildChatItems(messages, user?.uid || ""), [messages, user?.uid]);
  const listData = useMemo(() => [...items].reverse(), [items]);

  const confirmDeleteMessage = useCallback(
    (message: Message) => {
      if (!user?.uid) return;
      if (!isMine(message, user.uid)) return;
      if (message.deleted) return;

      Alert.alert(
        "Delete message?",
        "This replaces the message with 'Message deleted' for both of you. This can't be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await softDeleteMessage(message.id, user.uid);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === message.id
                      ? { ...m, text: "", deleted: true, deletedAt: Date.now(), deletedBy: user.uid }
                      : m,
                  ),
                );
              } catch (err) {
                Alert.alert(
                  "Couldn't delete",
                  describeFirestoreError(err, { action: "softDeleteMessage", mayBeUnverified: !user?.emailVerified }),
                );
              }
            },
          },
        ],
      );
    },
    [user?.uid, user?.emailVerified],
  );

  const submit = useCallback(async () => {
    if (!user?.uid || !studentId || !draft.trim()) return;
    const text = draft.trim();
    hapticTap();
    setDraft("");
    setSending(true);
    try {
      await sendMessage({
        instructorId: user.uid,
        studentId,
        sender: "instructor",
        receiver: studentId,
        text,
      });
    } catch (err) {
      setDraft(text);
      Alert.alert(
        "Couldn't send message",
        describeFirestoreError(err, { action: "sendMessage", mayBeUnverified: !user?.emailVerified }),
      );
    } finally {
      setSending(false);
    }
  }, [draft, studentId, user?.uid]);

  const subtitle = student?.phone
    ? student.phone
    : student?.email
      ? student.email
      : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ConversationHeader
        studentName={studentName}
        studentPhone={student?.phone}
        subtitle={subtitle}
        onBack={() => navigation.goBack()}
        onDelete={confirmDeleteChat}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.flex}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.emerald} />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <EmptyState
              iconName="alert-circle-outline"
              title="Couldn't load messages"
              message={error}
              actionLabel="Go back"
              onAction={() => navigation.goBack()}
            />
          </View>
        ) : (
          <FlatList
            data={listData}
            inverted
            keyExtractor={(item) => (item.kind === "message" ? item.message.id : item.key)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <EmptyState
                  iconName="chatbubble-ellipses-outline"
                  title="Say hello"
                  message={`Start the conversation with ${studentName}.`}
                />
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === "date") {
                return <DateSeparator label={item.label} />;
              }
              const mine = isMine(item.message, user?.uid || "");
              return (
                <MessageBubble
                  message={item.message}
                  mine={mine}
                  grouped={item.grouped}
                  isFollowedByGroup={item.followedByGroup}
                  isLastSent={item.isLastSent}
                  onLongPress={
                    mine && !item.message.deleted ? () => confirmDeleteMessage(item.message) : undefined
                  }
                />
              );
            }}
          />
        )}

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message"
              placeholderTextColor={c.slate500}
              multiline
              style={styles.input}
            />
            <Pressable
              disabled={sending || !draft.trim()}
              onPress={submit}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || sending) && styles.sendButtonDisabled,
                pressed && !sending && draft.trim() && styles.pressed,
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={!draft.trim() || sending ? c.slate500 : c.white}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyWrap: {
    transform: [{ scaleY: -1 }],
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  messageList: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  composerWrap: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 6 : 10,
    backgroundColor: c.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    minHeight: 40,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: c.surfaceMuted,
    color: c.slate900,
    fontSize: 16,
    lineHeight: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emerald,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: c.surfaceMuted,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
