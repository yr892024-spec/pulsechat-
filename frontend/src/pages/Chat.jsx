import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import {
    connectWebSocket,
    sendWebSocketMessage,
    disconnectWebSocket,
    setMessageListener,
    sendTypingStatus,
    sendMessagesRead,
    sendEditMessage,
    sendDeleteMessage,
    sendToggleReaction,
    sendPinMessage
} from "../services/websocket";

import { playNotificationSound, playSentSound, unlockAudio } from "../services/sound";

import {
    isNotificationSupported,
    requestNotificationPermission,
    showDesktopNotification
} from "../services/notification";

import SidebarHeader from "../components/SidebarHeader";
import ConversationListItem from "../components/ConversationListItem";
import ChatHeader from "../components/ChatHeader";
import MessageBubble from "../components/MessageBubble";
import ChatInputDock from "../components/ChatInputDock";
import PulseLogo from "../components/PulseLogo";


const POPULAR_EMOJIS = [
    "😀", "😂", "🤣", "😍", "🥰", "😎", "🤔", "🥳", "🤫", "😴",
    "👍", "👎", "👏", "🙌", "🙏", "❤️", "💖", "🔥", "✨", "🎉",
    "🚀", "💯", "🍕", "☕", "🎈", "👋", "🤝", "💪", "💡", "⭐"
];

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "🎉"];

const PRESET_GROUP_ICONS = ["🚀", "💼", "🎮", "☕", "🎉", "🔥", "💻", "⚽", "🍕", "🎵"];

const SENDER_COLORS = [
    "text-amber-400",
    "text-emerald-400",
    "text-cyan-400",
    "text-purple-400",
    "text-pink-400",
    "text-orange-400"
];

function getSenderColor(name = "") {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}


function Chat() {

    const navigate = useNavigate();

    // ============================================================
    // THEME STATE ('slate' | 'amoled' | 'light')
    // ============================================================
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("chat_theme") || "slate";
    });

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "slate" ? "amoled" : prev === "amoled" ? "light" : "slate";
            localStorage.setItem("chat_theme", next);
            return next;
        });
    };

    // ============================================================
    // STATE & REFS
    // ============================================================
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [sidebarTab, setSidebarTab] = useState("all"); // 'all' | 'direct' | 'groups'

    const [selectedTarget, setSelectedTarget] = useState(null); // user object or group object
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const [showGroupInfoDrawer, setShowGroupInfoDrawer] = useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Live presence & Typing
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState({});

    // Notifications & Sound
    const [inAppToast, setInAppToast] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("chat_sound") !== "false";
    });
    const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
        return typeof window !== "undefined" && window.Notification?.permission === "granted";
    });

    // Advanced Features
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImagePreview, setSelectedImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    // Reply, Edit, Search, Star, Pin
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState("");
    const [showOnlyStarred, setShowOnlyStarred] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [activeAudioId, setActiveAudioId] = useState(null);

    // Modals
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupIcon, setNewGroupIcon] = useState("🚀");
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editProfileName, setEditProfileName] = useState("");
    const [editProfileBio, setEditProfileBio] = useState("");
    const [editProfileImage, setEditProfileImage] = useState("");

    // Refs
    const selectedConversationIdRef = useRef(null);
    const selectedTargetRef = useRef(null);
    const usersRef = useRef([]);
    const groupsRef = useRef([]);
    const typingTimeoutRef = useRef(null);
    const toastTimeoutRef = useRef(null);
    const soundEnabledRef = useRef(soundEnabled);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const profileImageInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Sync refs
    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    useEffect(() => {
        selectedTargetRef.current = selectedTarget;
    }, [selectedTarget]);

    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    useEffect(() => {
        groupsRef.current = groups;
    }, [groups]);

    useEffect(() => {
        soundEnabledRef.current = soundEnabled;
        localStorage.setItem("chat_sound", soundEnabled ? "true" : "false");
    }, [soundEnabled]);


    // ============================================================
    // CURRENT USER & AUTH GUARD
    // ============================================================
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || !currentUser?.id) {
            navigate("/login");
        }
    }, [navigate, currentUser?.id]);

    useEffect(() => {
        if (currentUser) {
            setEditProfileName(currentUser.name || "");
            setEditProfileBio(currentUser.bio || "Available");
            setEditProfileImage(currentUser.profile_image || "");
        }
    }, [currentUser]);


    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);


    // ============================================================
    // LOAD DATA (USERS & GROUPS)
    // ============================================================

    const loadUsers = async () => {
        try {
            const response = await api.get("/auth/users");
            setUsers(response.data.users || []);
        } catch (error) {
            console.error("Users loading error:", error);
        }
    };

    const loadGroups = async () => {
        try {
            const response = await api.get("/chat/groups");
            setGroups(response.data.groups || []);
        } catch (error) {
            console.error("Groups loading error:", error);
        }
    };


    // ============================================================
    // CONNECT WEBSOCKET (RUNS ONCE PER USER)
    // ============================================================

    useEffect(() => {

        if (!currentUser?.id) {
            return;
        }

        const handleWebSocketMessage = (data) => {

            console.log("WebSocket received:", data);

            // 1. ONLINE USERS
            if (data.type === "online_users" && Array.isArray(data.userIds)) {
                setOnlineUserIds(new Set(data.userIds.map(Number)));
                return;
            }

            // 2. USER PRESENCE
            if (data.type === "user_status") {
                const targetUserId = Number(data.userId);
                setOnlineUserIds((prev) => {
                    const next = new Set(prev);
                    if (data.status === "online") {
                        next.add(targetUserId);
                    } else {
                        next.delete(targetUserId);
                    }
                    return next;
                });
                return;
            }

            // 3. TYPING
            if (data.type === "typing") {
                const senderId = Number(data.senderId);
                const convId = Number(data.conversationId);
                if (Number(selectedConversationIdRef.current) === convId) {
                    setTypingUsers((prev) => ({
                        ...prev,
                        [senderId]: Boolean(data.isTyping)
                    }));
                }
                return;
            }

            // 4. READ RECEIPTS
            if (data.type === "messages_read") {
                const conversationId = Number(data.conversationId);
                if (Number(selectedConversationIdRef.current) === conversationId) {
                    setMessages((prev) =>
                        prev.map((msg) => ({
                            ...msg,
                            is_read: 1
                        }))
                    );
                }
                return;
            }

            // 5. MESSAGE EDITED
            if (data.type === "message_edited") {
                const { messageId, newText } = data;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? { ...msg, message: newText, is_edited: 1 }
                            : msg
                    )
                );
                return;
            }

            // 6. MESSAGE DELETED
            if (data.type === "message_deleted") {
                const { messageId } = data;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? { ...msg, is_deleted: 1, message: "This message was deleted", file_url: null, fileUrl: null }
                            : msg
                    )
                );
                return;
            }

            // 7. MESSAGE REACTION
            if (data.type === "message_reaction") {
                const { messageId, reactions } = data;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? { ...msg, reactions }
                            : msg
                    )
                );
                return;
            }

            // 8. MESSAGE PINNED
            if (data.type === "message_pinned") {
                const { messageId, is_pinned } = data;
                setMessages((prev) =>
                    prev.map((msg) => ({
                        ...msg,
                        is_pinned: msg.id === messageId ? is_pinned : 0
                    }))
                );
                return;
            }

            // 9. NEW MESSAGE
            if (data.type === "new_message") {

                const msgObj =
                    (typeof data.message === "object" && data.message !== null)
                        ? data.message
                        : data;

                const convId =
                    msgObj.conversationId ??
                    msgObj.conversation_id ??
                    data.conversationId;

                const senderId = Number(msgObj.senderId ?? msgObj.sender_id);
                const isFromMe = senderId === Number(currentUser.id);
                const isCurrentActiveChat =
                    Number(convId) === Number(selectedConversationIdRef.current);

                // Play sound chime if from someone else
                if (!isFromMe && soundEnabledRef.current) {
                    playNotificationSound();
                }

                // If in active view
                if (isCurrentActiveChat) {

                    setMessages((prev) => {
                        const exists = prev.some((m) => m.id && msgObj.id && m.id === msgObj.id);
                        if (exists) return prev;
                        return [...prev, msgObj];
                    });

                    if (!isFromMe) {
                        sendMessagesRead(convId, senderId);
                        api.post("/chat/messages/read", { conversationId: convId }).catch(console.error);
                    }

                } else if (!isFromMe) {

                    const senderName = msgObj.sender_name || "New Message";

                    showDesktopNotification({
                        title: senderName,
                        body: msgObj.message_type === "image" ? "📷 Sent an image" : (msgObj.message_type === "audio" ? "🎙️ Sent a voice note" : msgObj.message),
                        onClick: () => {
                            const foundUser = usersRef.current.find(u => Number(u.id) === senderId);
                            if (foundUser) handleSelectUser(foundUser);
                        }
                    });

                    setInAppToast({
                        id: msgObj.id || Date.now(),
                        senderId: senderId,
                        senderName: senderName,
                        message: msgObj.message_type === "image" ? "📷 Sent an image" : (msgObj.message_type === "audio" ? "🎙️ Sent a voice note" : msgObj.message),
                        conversationId: convId
                    });

                    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                    toastTimeoutRef.current = setTimeout(() => {
                        setInAppToast(null);
                    }, 5000);

                }

                // Clear typing indicator
                setTypingUsers((prev) => ({
                    ...prev,
                    [senderId]: false
                }));

                // Update sidebar preview
                const previewSnippet = msgObj.message_type === "image"
                    ? "📷 Photo"
                    : (msgObj.message_type === "audio" ? "🎙️ Voice note" : msgObj.message);

                setUsers((prevUsers) => {
                    const uIndex = prevUsers.findIndex(u => Number(u.id) === senderId);
                    if (uIndex === -1) return prevUsers;

                    const updated = {
                        ...prevUsers[uIndex],
                        last_message: previewSnippet,
                        last_message_time: msgObj.created_at || new Date().toISOString(),
                        unread_count: isCurrentActiveChat
                            ? 0
                            : (Number(prevUsers[uIndex].unread_count || 0) + (isFromMe ? 0 : 1))
                    };
                    return [updated, ...prevUsers.filter((_, i) => i !== uIndex)];
                });

                setGroups((prevGroups) => {
                    const gIndex = prevGroups.findIndex(g => Number(g.id) === Number(convId));
                    if (gIndex === -1) return prevGroups;

                    const updatedGroup = {
                        ...prevGroups[gIndex],
                        last_message: `${msgObj.sender_name || "User"}: ${previewSnippet}`,
                        last_message_time: msgObj.created_at || new Date().toISOString(),
                        unread_count: isCurrentActiveChat
                            ? 0
                            : (Number(prevGroups[gIndex].unread_count || 0) + (isFromMe ? 0 : 1))
                    };
                    return [updatedGroup, ...prevGroups.filter((_, i) => i !== gIndex)];
                });

            }

        };

        setMessageListener(handleWebSocketMessage);
        connectWebSocket(currentUser.id, handleWebSocketMessage);

    }, [currentUser?.id]);


    // Initial Data Fetch
    useEffect(() => {
        loadUsers();
        loadGroups();
    }, []);


    // ============================================================
    // SELECT 1-ON-1 USER
    // ============================================================

    const handleSelectUser = async (user) => {

        try {

            setLoading(true);
            setSelectedTarget(user);
            setIsGroupChat(false);
            setGroupMembers([]);
            setShowGroupInfoDrawer(false);
            setMessages([]);
            setReplyingToMessage(null);
            setEditingMessage(null);
            setShowEmojiPicker(false);
            setSelectedImagePreview(null);
            setIsChatSearchOpen(false);
            setChatSearchQuery("");
            setShowOnlyStarred(false);

            if (inAppToast && Number(inAppToast.senderId) === Number(user.id)) {
                setInAppToast(null);
            }

            setUsers((prev) =>
                prev.map((u) =>
                    Number(u.id) === Number(user.id)
                        ? { ...u, unread_count: 0 }
                        : u
                )
            );

            const convRes = await api.post("/chat/conversation", {
                userId: user.id
            });

            const conversationId = convRes.data.conversation.id;
            setSelectedConversationId(conversationId);

            const msgRes = await api.get(`/chat/messages/${conversationId}`);
            setMessages(msgRes.data.messages || []);

            sendMessagesRead(conversationId, user.id);
            api.post("/chat/messages/read", { conversationId }).catch(console.error);

        } catch (error) {
            console.error("Select user error:", error);
        } finally {
            setLoading(false);
        }

    };


    // ============================================================
    // SELECT GROUP CHAT
    // ============================================================

    const handleSelectGroup = async (group) => {

        try {

            setLoading(true);
            setSelectedTarget(group);
            setIsGroupChat(true);
            setShowGroupInfoDrawer(false);
            setMessages([]);
            setReplyingToMessage(null);
            setEditingMessage(null);
            setShowEmojiPicker(false);
            setSelectedImagePreview(null);
            setIsChatSearchOpen(false);
            setChatSearchQuery("");
            setShowOnlyStarred(false);

            const conversationId = group.id;
            setSelectedConversationId(conversationId);

            // Clear unread
            setGroups((prev) =>
                prev.map((g) =>
                    Number(g.id) === Number(group.id)
                        ? { ...g, unread_count: 0 }
                        : g
                )
            );

            // Load group messages
            const msgRes = await api.get(`/chat/messages/${conversationId}`);
            setMessages(msgRes.data.messages || []);

            // Load members
            const memRes = await api.get(`/chat/group/${conversationId}/members`);
            setGroupMembers(memRes.data.members || []);

            // Mark read
            api.post("/chat/messages/read", { conversationId }).catch(console.error);

        } catch (err) {
            console.error("Select group error:", err);
        } finally {
            setLoading(false);
        }

    };


    // ============================================================
    // CREATE GROUP ACTION
    // ============================================================

    const handleCreateGroup = async (e) => {
        e.preventDefault();

        if (!newGroupName.trim()) {
            alert("Please enter a group name.");
            return;
        }

        if (selectedMemberIds.length === 0) {
            alert("Please select at least 1 contact to join the group.");
            return;
        }

        try {
            const res = await api.post("/chat/group", {
                name: newGroupName.trim(),
                groupImage: newGroupIcon,
                memberIds: selectedMemberIds
            });

            const created = res.data.group;
            setShowCreateGroupModal(false);
            setNewGroupName("");
            setSelectedMemberIds([]);

            await loadGroups();
            handleSelectGroup(created);

        } catch (err) {
            console.error("Create group error:", err);
            alert("Failed to create group.");
        }
    };


    // ============================================================
    // UPDATE PROFILE ACTION
    // ============================================================

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        try {
            const res = await api.put("/auth/profile", {
                name: editProfileName.trim(),
                bio: editProfileBio.trim(),
                profile_image: editProfileImage
            });

            const updatedUser = res.data.user;
            setCurrentUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setShowProfileModal(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Update profile error:", err);
            alert("Failed to update profile.");
        }
    };

    const handleProfilePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setEditProfileImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };


    // ============================================================
    // INPUT CHANGE & TYPING
    // ============================================================

    const handleInputChange = (e) => {
        const val = e.target.value;
        setMessage(val);

        if (!selectedConversationId) return;

        sendTypingStatus(selectedTarget?.id || null, selectedConversationId, true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (selectedConversationId) {
                sendTypingStatus(selectedTarget?.id || null, selectedConversationId, false);
            }
        }, 1500);
    };


    // ============================================================
    // SEND MESSAGE
    // ============================================================

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();

        // If editing
        if (editingMessage) {
            const trimmed = message.trim();
            if (!trimmed) return;

            sendEditMessage(editingMessage.id, selectedConversationId, selectedTarget?.id || null, trimmed);

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === editingMessage.id
                        ? { ...m, message: trimmed, is_edited: 1 }
                        : m
                )
            );

            setEditingMessage(null);
            setMessage("");
            return;
        }

        const trimmed = message.trim();
        const hasImage = Boolean(selectedImagePreview);

        if (!trimmed && !hasImage) return;
        if (!selectedConversationId) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingStatus(selectedTarget?.id || null, selectedConversationId, false);

        try {

            const messageType = hasImage ? "image" : "text";
            const fileUrl = hasImage ? selectedImagePreview : null;

            const payload = {
                type: "chat_message",
                conversationId: selectedConversationId,
                receiverId: isGroupChat ? null : selectedTarget?.id,
                message: trimmed || (hasImage ? "Photo" : ""),
                messageType,
                fileUrl,
                replyToId: replyingToMessage ? replyingToMessage.id : null,
                replyToText: replyingToMessage ? replyingToMessage.message : null,
                replyToSender: replyingToMessage ? replyingToMessage.senderName : null
            };

            const sent = sendWebSocketMessage(payload);

            if (sent) {

                if (soundEnabledRef.current) {
                    playSentSound();
                }

                const nowIso = new Date().toISOString();

                const tempMessage = {
                    id: `temp-${Date.now()}`,
                    conversationId: selectedConversationId,
                    conversation_id: selectedConversationId,
                    senderId: currentUser.id,
                    sender_id: currentUser.id,
                    sender_name: currentUser.name,
                    sender_image: currentUser.profile_image,
                    message: trimmed || (hasImage ? "Photo" : ""),
                    message_type: messageType,
                    file_url: fileUrl,
                    fileUrl: fileUrl,
                    reply_to_id: replyingToMessage ? replyingToMessage.id : null,
                    reply_to_text: replyingToMessage ? replyingToMessage.message : null,
                    reply_to_sender: replyingToMessage ? replyingToMessage.senderName : null,
                    reactions: {},
                    is_pinned: 0,
                    starred_by: [],
                    is_edited: 0,
                    is_deleted: 0,
                    is_read: 0,
                    created_at: nowIso,
                    createdAt: nowIso
                };

                setMessages((prev) => [...prev, tempMessage]);
                setMessage("");
                setSelectedImagePreview(null);
                setShowEmojiPicker(false);
                setReplyingToMessage(null);

                const snippet = hasImage ? "📷 Photo" : trimmed;

                if (!isGroupChat) {
                    setUsers((prevUsers) => {
                        const idx = prevUsers.findIndex(u => Number(u.id) === Number(selectedTarget.id));
                        if (idx === -1) return prevUsers;
                        const updated = { ...prevUsers[idx], last_message: snippet, last_message_time: nowIso };
                        return [updated, ...prevUsers.filter((_, i) => i !== idx)];
                    });
                } else {
                    setGroups((prevGroups) => {
                        const idx = prevGroups.findIndex(g => Number(g.id) === Number(selectedConversationId));
                        if (idx === -1) return prevGroups;
                        const updated = { ...prevGroups[idx], last_message: `You: ${snippet}`, last_message_time: nowIso };
                        return [updated, ...prevGroups.filter((_, i) => i !== idx)];
                    });
                }

            }

        } catch (error) {
            console.error("Send message error:", error);
        }
    };


    // ============================================================
    // SEND VOICE NOTE
    // ============================================================

    const handleSendAudioMessage = async (base64Audio) => {
        if (!selectedConversationId) return;

        try {
            const nowIso = new Date().toISOString();

            const sent = sendWebSocketMessage({
                type: "chat_message",
                conversationId: selectedConversationId,
                receiverId: isGroupChat ? null : selectedTarget?.id,
                message: "Voice note",
                messageType: "audio",
                fileUrl: base64Audio,
                replyToId: replyingToMessage ? replyingToMessage.id : null,
                replyToText: replyingToMessage ? replyingToMessage.message : null,
                replyToSender: replyingToMessage ? replyingToMessage.senderName : null
            });

            if (sent) {

                if (soundEnabledRef.current) playSentSound();

                const tempAudioMsg = {
                    id: `temp-${Date.now()}`,
                    conversationId: selectedConversationId,
                    conversation_id: selectedConversationId,
                    senderId: currentUser.id,
                    sender_id: currentUser.id,
                    sender_name: currentUser.name,
                    sender_image: currentUser.profile_image,
                    message: "Voice note",
                    message_type: "audio",
                    file_url: base64Audio,
                    fileUrl: base64Audio,
                    reply_to_id: replyingToMessage ? replyingToMessage.id : null,
                    reply_to_text: replyingToMessage ? replyingToMessage.message : null,
                    reply_to_sender: replyingToMessage ? replyingToMessage.senderName : null,
                    reactions: {},
                    is_pinned: 0,
                    starred_by: [],
                    is_edited: 0,
                    is_deleted: 0,
                    is_read: 0,
                    created_at: nowIso,
                    createdAt: nowIso
                };

                setMessages((prev) => [...prev, tempAudioMsg]);
                setReplyingToMessage(null);

            }

        } catch (err) {
            console.error("Send audio error:", err);
        }
    };

    // Voice recording lifecycle
    const startRecording = async () => {
        try {
            unlockAudio();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone error:", err);
            alert("Microphone permission was denied.");
        }
    };

    const stopAndSendRecording = () => {
        if (!mediaRecorderRef.current || !isRecording) return;
        clearInterval(recordingTimerRef.current);
        setIsRecording(false);

        const rec = mediaRecorderRef.current;
        rec.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                handleSendAudioMessage(reader.result);
            };
        };
        rec.stop();
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            clearInterval(recordingTimerRef.current);
            setIsRecording(false);
            setRecordingTime(0);
            mediaRecorderRef.current.stop();
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };


    // ============================================================
    // PIN, STAR, EDIT, DELETE, REACTION
    // ============================================================

    const handleTogglePin = (msgId) => {
        sendPinMessage(msgId, selectedConversationId);
        api.put("/chat/messages/pin", { messageId: msgId, conversationId: selectedConversationId }).catch(console.error);

        setMessages((prev) =>
            prev.map((m) => ({
                ...m,
                is_pinned: m.id === msgId ? (m.is_pinned ? 0 : 1) : 0
            }))
        );
    };

    const handleToggleStar = async (msgId) => {
        try {
            const res = await api.put("/chat/messages/star", { messageId: msgId });
            const starredList = res.data.data.starred_by;

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId
                        ? { ...m, starred_by: starredList }
                        : m
                )
            );
        } catch (err) {
            console.error("Toggle star error:", err);
        }
    };

    const handleReaction = (msgId, emoji) => {
        sendToggleReaction(msgId, selectedConversationId, isGroupChat ? null : selectedTarget?.id, emoji);

        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== msgId) return m;

                const currentReactions = { ...(m.reactions || {}) };
                const userList = Array.isArray(currentReactions[emoji]) ? currentReactions[emoji] : [];
                const myId = Number(currentUser.id);

                if (userList.includes(myId)) {
                    currentReactions[emoji] = userList.filter((id) => id !== myId);
                    if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
                } else {
                    currentReactions[emoji] = [...userList, myId];
                }

                return { ...m, reactions: currentReactions };
            })
        );
    };

    const handleStartReply = (msg) => {
        setReplyingToMessage({
            id: msg.id,
            message: msg.message_type === "image" ? "Photo" : (msg.message_type === "audio" ? "Voice note" : msg.message),
            senderName: msg.sender_name || (msg.sender_id === currentUser.id ? "You" : selectedTarget?.name || "User")
        });
        setEditingMessage(null);
    };

    const handleStartEdit = (msg) => {
        setEditingMessage(msg);
        setMessage(msg.message);
        setReplyingToMessage(null);
        setShowEmojiPicker(false);
    };

    const handleDeleteMessage = (msgId) => {
        if (!window.confirm("Delete this message for everyone?")) return;
        sendDeleteMessage(msgId, selectedConversationId, isGroupChat ? null : selectedTarget?.id);

        setMessages((prev) =>
            prev.map((m) =>
                m.id === msgId
                    ? { ...m, is_deleted: 1, message: "This message was deleted", file_url: null, fileUrl: null }
                    : m
            )
        );
    };


    // ============================================================
    // HELPERS & FILTERING
    // ============================================================

    const handleTestSound = () => {
        unlockAudio();
        playNotificationSound();
    };

    const handleLogout = () => {
        disconnectWebSocket();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    // Filter users and groups
    const filteredUsers = users.filter((u) => {
        if (Number(u.id) === Number(currentUser?.id)) return false;
        const q = search.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const filteredGroups = groups.filter((g) => {
        const q = search.toLowerCase();
        return g.name?.toLowerCase().includes(q);
    });

    // Pinned Message in current conversation
    const pinnedMessage = messages.find(m => Boolean(m.is_pinned));

    // Display messages with in-chat search & starred filter
    const displayMessages = messages.filter((m) => {
        if (showOnlyStarred) {
            const starred = Array.isArray(m.starred_by) ? m.starred_by : [];
            if (!starred.includes(Number(currentUser?.id))) return false;
        }
        if (!chatSearchQuery.trim()) return true;
        return m.message?.toLowerCase().includes(chatSearchQuery.toLowerCase());
    });

    const formatMessageTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatSidebarTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const formatRecordTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const isCurrentContactOnline =
        !isGroupChat && selectedTarget ? onlineUserIds.has(Number(selectedTarget.id)) : false;

    const isCurrentContactTyping =
        !isGroupChat && selectedTarget ? Boolean(typingUsers[selectedTarget.id]) : false;


    // ============================================================
    // THEME-DEPENDENT CLASSES
    // ============================================================
    const themeWrapperClass =
        theme === "amoled"
            ? "bg-black text-white"
            : theme === "light"
            ? "bg-slate-100 text-slate-900"
            : "bg-[#0d141f] text-slate-100";

    const sidebarClass =
        theme === "amoled"
            ? "bg-[#0a0a0a] border-r border-neutral-800"
            : theme === "light"
            ? "bg-white border-r border-slate-200"
            : "bg-[#111927] border-r border-slate-800/80";

    const mainChatClass =
        theme === "amoled"
            ? "chat-pattern-amoled text-white"
            : theme === "light"
            ? "chat-pattern-light text-slate-900"
            : "chat-pattern text-slate-100";

    const headerClass =
        theme === "amoled"
            ? "bg-[#0a0a0a]/95 border-b border-neutral-800 backdrop-blur-md"
            : theme === "light"
            ? "bg-white/95 border-b border-slate-200 shadow-sm backdrop-blur-md"
            : "bg-[#111927]/95 border-b border-slate-800/80 backdrop-blur-md";

    const inputBarClass =
        theme === "amoled"
            ? "bg-[#0a0a0a]/95 border-t border-neutral-800 backdrop-blur-md"
            : theme === "light"
            ? "bg-white/95 border-t border-slate-200 backdrop-blur-md"
            : "bg-[#111927]/95 border-t border-slate-800/80 backdrop-blur-md";

    const searchInputClass =
        theme === "light"
            ? "bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500"
            : "bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50";


    return (

        <div className={`h-screen flex overflow-hidden relative ${themeWrapperClass}`}>

            {/* ====================================================
                IN-APP TOAST NOTIFICATION
            ==================================================== */}
            {inAppToast && (
                <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 border border-blue-500/40 backdrop-blur-2xl shadow-2xl shadow-blue-500/20 rounded-2xl p-4 flex items-start gap-3 transition-all animate-bounce-short">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold shrink-0 text-white shadow-md">
                        {inAppToast.senderName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-semibold text-white truncate">
                                {inAppToast.senderName}
                            </h4>
                            <span className="text-[10px] text-blue-400 font-medium">Just now</span>
                        </div>
                        <p className="text-xs text-slate-300 truncate mt-1">{inAppToast.message}</p>
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const targetUser = users.find(u => Number(u.id) === Number(inAppToast.senderId));
                                    if (targetUser) handleSelectUser(targetUser);
                                    setInAppToast(null);
                                }}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                            >
                                Reply
                            </button>
                            <button onClick={() => setInAppToast(null)} className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition">
                                Dismiss
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setInAppToast(null)} className="text-slate-400 hover:text-white text-xs p-1">
                        ✕
                    </button>
                </div>
            )}


            {/* ====================================================
                SIDEBAR
            ==================================================== */}

            <aside className={`w-[340px] shrink-0 flex flex-col z-20 select-none ${sidebarClass}`}>

                {/* SIDEBAR HEADER */}
                <SidebarHeader
                    currentUser={currentUser}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    soundEnabled={soundEnabled}
                    onToggleSound={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        if (next) handleTestSound();
                    }}
                    onOpenProfile={() => setShowProfileModal(true)}
                    onOpenCreateGroup={() => setShowCreateGroupModal(true)}
                    onLogout={handleLogout}
                    search={search}
                    onSearchChange={setSearch}
                    sidebarTab={sidebarTab}
                    onTabChange={setSidebarTab}
                    groupCount={groups.length}
                    searchInputClass={searchInputClass}
                />


                {/* CONVERSATIONS LIST */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">

                    {/* GROUPS SECTION (IF TAB IS 'all' OR 'groups') */}
                    {(sidebarTab === "all" || sidebarTab === "groups") && filteredGroups.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Groups
                            </div>

                            {filteredGroups.map((group) => {
                                const isSelected = isGroupChat && selectedConversationId === group.id;
                                const unread = Number(group.unread_count || 0);

                                return (
                                    <ConversationListItem
                                        key={`group-${group.id}`}
                                        item={group}
                                        isGroup={true}
                                        isSelected={isSelected}
                                        unreadCount={unread}
                                        timeString={group.last_message_time ? formatSidebarTime(group.last_message_time) : ""}
                                        onSelect={handleSelectGroup}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* DIRECT CONTACTS (IF TAB IS 'all' OR 'direct') */}
                    {(sidebarTab === "all" || sidebarTab === "direct") && (
                        <div>
                            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Direct Messages
                            </div>

                            {filteredUsers.length === 0 ? (
                                <div className="px-3 py-8 text-center text-xs text-slate-500">
                                    No contacts found
                                </div>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isOnline = onlineUserIds.has(Number(user.id));
                                    const isTyping = Boolean(typingUsers[user.id]);
                                    const isSelected = !isGroupChat && selectedTarget?.id === user.id;
                                    const unread = Number(user.unread_count || 0);

                                    return (
                                        <ConversationListItem
                                            key={`user-${user.id}`}
                                            item={user}
                                            isGroup={false}
                                            isSelected={isSelected}
                                            isOnline={isOnline}
                                            isTyping={isTyping}
                                            unreadCount={unread}
                                            timeString={user.last_message_time ? formatSidebarTime(user.last_message_time) : ""}
                                            onSelect={handleSelectUser}
                                        />
                                    );
                                })
                            )}
                        </div>
                    )}

                </div>


            </aside>


            {/* ====================================================
                MAIN CHAT AREA
            ==================================================== */}

            <main className={`min-w-0 flex-1 flex flex-col relative ${mainChatClass}`}>

                {!selectedConversationId ? (

                    <div className="flex-1 flex items-center justify-center relative p-6 overflow-hidden">
                        {/* Ambient background glow aura */}
                        <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-blue-600/15 via-cyan-500/15 to-indigo-600/10 blur-3xl pointer-events-none" />

                        <div className="text-center max-w-sm mx-auto select-none relative z-10 flex flex-col items-center">
                            {/* Animated Pulse Logo with glowing ring */}
                            <div className="relative mb-6">
                                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-full blur-xl opacity-50 animate-pulse" />
                                <PulseLogo size={76} animated={true} />
                            </div>

                            <h3 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                                PulseChat
                            </h3>
                            <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed max-w-xs">
                                Next-gen, ultra-fast real-time messenger. Select a conversation or group to start chatting.
                            </p>

                            {/* Modern Feature Pills */}
                            <div className="grid grid-cols-2 gap-2 mt-6 w-full text-left">
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.06] transition flex items-center gap-2.5">
                                    <span className="text-base">⚡</span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-200">WebSocket Live</p>
                                        <p className="text-[10px] text-slate-400">Instant delivery</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.06] transition flex items-center gap-2.5">
                                    <span className="text-base">🎙️</span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-200">Voice Notes</p>
                                        <p className="text-[10px] text-slate-400">HD audio recording</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.06] transition flex items-center gap-2.5">
                                    <span className="text-base">👥</span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-200">Group Spaces</p>
                                        <p className="text-[10px] text-slate-400">Collaborate easily</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.06] transition flex items-center gap-2.5">
                                    <span className="text-base">🎨</span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-200">3 Themes</p>
                                        <p className="text-[10px] text-slate-400">Slate, AMOLED, Light</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status connection pill */}
                            <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span>Connected to Real-Time Server</span>
                            </div>
                        </div>
                    </div>

                ) : (

                    <>

                        {/* CHAT HEADER (56px) */}
                        <ChatHeader
                            selectedTarget={selectedTarget}
                            isGroupChat={isGroupChat}
                            groupMembers={groupMembers}
                            isOnline={isCurrentContactOnline}
                            isTyping={isCurrentContactTyping}
                            showOnlyStarred={showOnlyStarred}
                            onToggleStarred={() => setShowOnlyStarred(prev => !prev)}
                            isChatSearchOpen={isChatSearchOpen}
                            onToggleChatSearch={() => {
                                setIsChatSearchOpen(prev => !prev);
                                if (isChatSearchOpen) setChatSearchQuery("");
                            }}
                            onToggleGroupInfo={() => setShowGroupInfoDrawer(prev => !prev)}
                            headerClass={headerClass}
                        />


                        {/* IN-CHAT SEARCH BAR */}
                        {isChatSearchOpen && (
                            <div className="px-6 py-2 bg-slate-900/90 border-b border-inherit flex items-center gap-3">
                                <span className="text-slate-400 text-xs">🔍</span>
                                <input
                                    type="text"
                                    autoFocus
                                    value={chatSearchQuery}
                                    onChange={(e) => setChatSearchQuery(e.target.value)}
                                    placeholder="Search in conversation..."
                                    className="flex-1 bg-transparent text-xs outline-none"
                                />
                                {chatSearchQuery && (
                                    <span className="text-[11px] text-slate-400">
                                        {displayMessages.length} found
                                    </span>
                                )}
                                <button onClick={() => { setIsChatSearchOpen(false); setChatSearchQuery(""); }} className="text-xs text-slate-400 hover:text-white">
                                    ✕
                                </button>
                            </div>
                        )}


                        {/* PINNED MESSAGE BANNER */}
                        {pinnedMessage && (
                            <div className="px-6 py-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-b border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
                                <div
                                    onClick={() => document.getElementById(`msg-${pinnedMessage.id}`)?.scrollIntoView({ behavior: "smooth" })}
                                    className="flex items-center gap-2 cursor-pointer truncate max-w-xl"
                                >
                                    <span>📌</span>
                                    <span className="font-semibold text-blue-300">Pinned:</span>
                                    <span className="truncate italic opacity-90">"{pinnedMessage.message}"</span>
                                </div>
                                <button
                                    onClick={() => handleTogglePin(pinnedMessage.id)}
                                    title="Unpin message"
                                    className="text-slate-400 hover:text-white ml-2 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        )}


                        {/* MESSAGES LIST CONTAINER */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">

                            {loading ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                    Loading messages...
                                </div>
                            ) : displayMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-center">
                                    <p className="text-xs text-slate-400">
                                        {showOnlyStarred
                                            ? "No starred messages in this conversation"
                                            : chatSearchQuery
                                            ? "No matching messages found"
                                            : "No messages yet. Send a message to start!"}
                                    </p>
                                </div>
                            ) : (
                                displayMessages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        currentUserId={currentUser?.id}
                                        isGroupChat={isGroupChat}
                                        theme={theme}
                                        isHovered={hoveredMessageId === msg.id}
                                        activeAudioId={activeAudioId}
                                        onHover={setHoveredMessageId}
                                        onReaction={handleReaction}
                                        onReply={handleStartReply}
                                        onTogglePin={handleTogglePin}
                                        onToggleStar={handleToggleStar}
                                        onEdit={handleStartEdit}
                                        onDelete={handleDeleteMessage}
                                        onPlayAudio={(msgId) => {
                                            if (msgId === null) {
                                                setActiveAudioId(null);
                                                return;
                                            }
                                            const audioElem = document.getElementById(`audio-${msgId}`);
                                            if (audioElem) {
                                                if (activeAudioId === msgId) {
                                                    audioElem.pause();
                                                    setActiveAudioId(null);
                                                } else {
                                                    audioElem.play();
                                                    setActiveAudioId(msgId);
                                                }
                                            }
                                        }}
                                        formatTime={formatMessageTime}
                                        getSenderColor={getSenderColor}
                                    />
                                ))
                            )}

                            {/* INCOMING TYPING BUBBLE */}
                            {isCurrentContactTyping && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1.5 py-2 px-4 bg-slate-800 border border-white/5 rounded-2xl rounded-bl-sm">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />

                        </div>


                        {/* INPUT DOCK */}
                        <ChatInputDock
                            message={message}
                            onMessageChange={handleInputChange}
                            onSubmit={handleSendMessage}
                            fileInputRef={fileInputRef}
                            onImageSelect={handleImageSelect}
                            selectedImagePreview={selectedImagePreview}
                            onClearImagePreview={() => setSelectedImagePreview(null)}
                            replyingToMessage={replyingToMessage}
                            onCancelReply={() => setReplyingToMessage(null)}
                            editingMessage={editingMessage}
                            onCancelEdit={() => {
                                setEditingMessage(null);
                                setMessage("");
                            }}
                            showEmojiPicker={showEmojiPicker}
                            onToggleEmojiPicker={() => setShowEmojiPicker(prev => !prev)}
                            onSelectEmoji={(emoji) => setMessage(prev => prev + emoji)}
                            isRecording={isRecording}
                            recordingTime={recordingTime}
                            onStartRecording={startRecording}
                            onCancelRecording={cancelRecording}
                            onStopAndSendRecording={stopAndSendRecording}
                            targetName={selectedTarget?.name || "User"}
                            inputBarClass={inputBarClass}
                            searchInputClass={searchInputClass}
                            formatRecordTimer={formatRecordTimer}
                        />

                    </>

                )}

                {/* ====================================================
                    GROUP INFO DRAWER
                ==================================================== */}
                {isGroupChat && showGroupInfoDrawer && (
                    <div className="absolute top-20 right-0 bottom-0 w-80 bg-slate-900/95 border-l border-white/10 p-5 backdrop-blur-2xl z-30 shadow-2xl flex flex-col animate-in slide-in-from-right">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h3 className="font-bold text-sm">Group Info</h3>
                            <button onClick={() => setShowGroupInfoDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="text-center py-5 border-b border-white/10">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg mb-3">
                                {selectedTarget?.group_image || "👥"}
                            </div>
                            <h4 className="font-bold text-base">{selectedTarget?.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{groupMembers.length} participants</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pt-4 space-y-2">
                            <p className="text-[11px] font-semibold uppercase text-slate-400">Members</p>
                            {groupMembers.map((m) => {
                                const isOnline = onlineUserIds.has(Number(m.id));
                                return (
                                    <div key={`member-${m.id}`} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                    {m.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`w-2 h-2 rounded-full absolute bottom-0 right-0 ${isOnline ? "bg-green-400" : "bg-slate-500"}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium truncate">{m.name} {m.id === currentUser.id && "(You)"}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{m.bio || m.email}</p>
                                            </div>
                                        </div>
                                        {m.role === "admin" && (
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">Admin</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </main>


            {/* ====================================================
                CREATE GROUP MODAL
            ==================================================== */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h3 className="font-bold text-base">Create New Group</h3>
                            <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Icon</label>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {PRESET_GROUP_ICONS.map((icon) => (
                                        <button
                                            type="button"
                                            key={icon}
                                            onClick={() => setNewGroupIcon(icon)}
                                            className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition ${
                                                newGroupIcon === icon ? "bg-blue-600 scale-110 shadow" : "bg-slate-800 hover:bg-slate-700"
                                            }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g. Design Team, Friends Squad"
                                    className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Select Members ({selectedMemberIds.length} selected)
                                </label>
                                <div className="max-h-48 overflow-y-auto space-y-1 p-1 bg-slate-800/50 rounded-xl border border-white/5">
                                    {users.filter(u => Number(u.id) !== Number(currentUser?.id)).map((u) => {
                                        const isChecked = selectedMemberIds.includes(Number(u.id));
                                        return (
                                            <label
                                                key={`invite-${u.id}`}
                                                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                                                    isChecked ? "bg-blue-600/20 text-white" : "hover:bg-white/5 text-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                                                        {u.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-medium">{u.name}</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const uid = Number(u.id);
                                                        if (e.target.checked) {
                                                            setSelectedMemberIds(prev => [...prev, uid]);
                                                        } else {
                                                            setSelectedMemberIds(prev => prev.filter(id => id !== uid));
                                                        }
                                                    }}
                                                    className="w-4 h-4 accent-blue-600 rounded"
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateGroupModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* ====================================================
                PROFILE SETTINGS MODAL
            ==================================================== */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h3 className="font-bold text-base">Edit Profile</h3>
                            <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">

                            {/* AVATAR PICKER */}
                            <div className="flex flex-col items-center gap-3">
                                <input
                                    ref={profileImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePhotoSelect}
                                    className="hidden"
                                />

                                <div className="relative group cursor-pointer" onClick={() => profileImageInputRef.current?.click()}>
                                    {editProfileImage ? (
                                        <img
                                            src={editProfileImage}
                                            alt="Profile"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                                            {currentUser?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                                        📷 Change
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => profileImageInputRef.current?.click()}
                                    className="text-xs text-blue-400 hover:underline"
                                >
                                    Upload new avatar photo
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editProfileName}
                                    onChange={(e) => setEditProfileName(e.target.value)}
                                    className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Status</label>
                                <input
                                    type="text"
                                    value={editProfileBio}
                                    onChange={(e) => setEditProfileBio(e.target.value)}
                                    placeholder="e.g. Available, In a meeting, Busy"
                                    className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>

    );

}


export default Chat;