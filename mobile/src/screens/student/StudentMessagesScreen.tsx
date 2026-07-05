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
import { getInstructorProfile } from "../../services/dataService";
import {
  getStudentMessageContext,
  markAsRead,
  sendMessage,
  softDeleteMessage,
  subscribeConversation,
  type StudentMessageContext,
} from "../../services/messagesService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Message } from "../../types";
import { hapticTap } from "../../utils/haptics";
import { describeFirestoreError } from "../../utils/firestoreError";

const GROUP_WINDOW_MS = 2 * 60_000;

type ChatItem =
  | { kind: "message"; message: Message; grouped: boolean; followedByGroup: boolean; isLastSent: boolean }
  | { kind: "date"; key: string; label: string };

function isInstructorMessage(message: Message, instructorId: string) {
  return message.sender === instructorId || message.sender === "instructor";
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const todayK = dayKey(now.getTime());
  const yK = dayKey(now.getTime() - 86_400_000);
  const k = dayKey(ts);
  if (k === todayK) return "Today";
  if (k === yK) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
}

function buildChatItems(messages: Message[], studentId: string): ChatItem[] {
  let lastSentIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === studentId && !messages[i].deleted) {
      lastSentIndex = i;
      break;
    }
  }
  const items: ChatItem[] = [];
  let prevDay = "";
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const k = dayKey(m.timestamp || Date.now());
    if (k !== prevDay) {
      items.push({ kind: "date", key: `date-${k}-${i}`, label: dateLabel(m.timestamp || Date.now()) });
      prevDay = k;
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

export function StudentMessagesScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [context, setContext] = useState<StudentMessageContext | null>(null);
  const [instructorPhone, setInstructorPhone] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!error) return;
    const handle = setTimeout(() => setRetryNonce((n) => n + 1), 30_000);
    return () => clearTimeout(handle);
  }, [error, retryNonce]);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setError("Sign in again to open messages.");
      return undefined;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    if (retryNonce === 0) setLoading(true);
    setError(null);

    void getStudentMessageContext(user.uid)
      .then(async (nextContext) => {
        if (!active) return;
        setContext(nextContext);
        if (!nextContext) {
          setMessages([]);
          setLoading(false);
          return;
        }

        // Pull instructor phone for WhatsApp / call buttons.
        try {
          const profile = await getInstructorProfile(nextContext.instructorId);
          if (active) setInstructorPhone(profile?.phone || undefined);
        } catch {
          // non-blocking
        }

        unsubscribe = subscribeConversation(
          nextContext.instructorId,
          nextContext.studentId,
          user.uid,
          (next) => {
            setMessages(next);
            setLoading(false);
            void Promise.all(
              next
                .filter((message) => !message.read && !message.deleted && isInstructorMessage(message, nextContext.instructorId))
                .map((message) => markAsRead(message.id).catch(() => {})),
            );
          },
          (err) => {
            setError(describeFirestoreError(err, { action: "subscribeConversation", mayBeUnverified: !user?.emailVerified }));
            setLoading(false);
          },
        );
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(describeFirestoreError(err, { action: "getStudentMessageContext", mayBeUnverified: !user?.emailVerified }));
        setLoading(false);
      });

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, retryNonce]);

  const items = useMemo(
    () => (context ? buildChatItems(messages, context.studentId) : []),
    [messages, context],
  );
  const listData = useMemo(() => [...items].reverse(), [items]);

  const submit = useCallback(async () => {
    if (!context || !draft.trim()) return;
    const text = draft.trim();
    hapticTap();
    setDraft("");
    setSending(true);
    try {
      await sendMessage({
        instructorId: context.instructorId,
        studentId: context.studentId,
        sender: context.studentId,
        receiver: "instructor",
        text,
      });
    } catch (err) {
      setDraft(text);
      Alert.alert(
        "Message did not send",
        describeFirestoreError(err, { action: "sendMessage", mayBeUnverified: !user?.emailVerified }),
      );
    } finally {
      setSending(false);
    }
  }, [context, draft, user?.emailVerified]);

  const confirmDeleteMessage = useCallback(
    (message: Message) => {
      if (!user?.uid || !context) return;
      if (message.sender !== context.studentId) return;
      if (message.deleted) return;

      Alert.alert(
        "Delete message?",
        "This replaces the message with 'Message deleted' for your instructor too. This can't be undone.",
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
    [user?.uid, user?.emailVerified, context],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ConversationHeader
        studentName={context?.instructorName || "Your instructor"}
        studentPhone={instructorPhone}
        subtitle={instructorPhone || "Your driving instructor"}
        onBack={() => {
          // No-op: this is a tab root for students, no back nav. Pressing the chevron does nothing.
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.flex}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={c.amber} />
            <Text style={styles.errorBannerText} numberOfLines={2}>
              Messages may be out of date. Retrying automatically.
            </Text>
            <Pressable
              onPress={() => setRetryNonce((n) => n + 1)}
              hitSlop={8}
              style={({ pressed }) => [styles.errorBannerBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.errorBannerBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !error ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.emerald} />
          </View>
        ) : !context ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              iconName="link-outline"
              title="You're nearly connected"
              message={`Ask your instructor to add you with ${user?.email || "this email"}. Messages open automatically after linking.`}
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
              <View style={styles.emptyInvert}>
                <EmptyState
                  iconName="chatbubble-ellipses-outline"
                  title="Say hello"
                  message="Send your instructor a quick note when you need help between lessons."
                />
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === "date") return <DateSeparator label={item.label} />;
              const mine = item.message.sender === context.studentId;
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
              editable={Boolean(context)}
              value={draft}
              onChangeText={setDraft}
              placeholder="Message"
              placeholderTextColor={c.slate500}
              multiline
              style={styles.input}
            />
            <Pressable
              disabled={sending || !draft.trim() || !context}
              onPress={submit}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || sending || !context) && styles.sendButtonDisabled,
                pressed && !sending && draft.trim() && context && styles.pressed,
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={!draft.trim() || sending || !context ? c.slate500 : c.white}
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
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyInvert: {
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
  },
  errorBannerText: {
    flex: 1,
    color: c.amber,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  errorBannerBtn: {
    backgroundColor: c.amber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  errorBannerBtnText: {
    color: c.white,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "600",
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
