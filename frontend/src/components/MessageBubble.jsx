import React from "react";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "🎉"];

export default function MessageBubble({
    msg,
    currentUserId,
    isGroupChat = false,
    theme = "slate",
    isHovered = false,
    activeAudioId = null,
    onHover,
    onReaction,
    onReply,
    onTogglePin,
    onToggleStar,
    onEdit,
    onDelete,
    onPlayAudio,
    formatTime,
    getSenderColor
}) {
    const senderId = Number(msg.senderId ?? msg.sender_id);
    const isMine = senderId === Number(currentUserId);
    const isRead = Boolean(msg.is_read);
    const isDeleted = Boolean(msg.is_deleted);
    const isEdited = Boolean(msg.is_edited);
    const isPinned = Boolean(msg.is_pinned);
    const reactions = msg.reactions || {};
    const hasReactions = Object.keys(reactions).length > 0;
    const starredList = Array.isArray(msg.starred_by) ? msg.starred_by : [];
    const isStarred = starredList.includes(Number(currentUserId));

    return (
        <div
            id={`msg-${msg.id}`}
            onMouseEnter={() => onHover && onHover(msg.id)}
            onMouseLeave={() => onHover && onHover(null)}
            className={`group relative flex flex-col transition-all duration-150 ${isMine ? "items-end" : "items-start"}`}
        >
            {/* Sender Label for Group Chats */}
            {isGroupChat && !isMine && !isDeleted && (
                <div className="flex items-center gap-1.5 ml-2.5 mb-1">
                    <span className={`text-[11px] font-bold ${getSenderColor ? getSenderColor(msg.sender_name) : "text-cyan-400"}`}>
                        {msg.sender_name || "Member"}
                    </span>
                </div>
            )}

            {/* Hover Actions Menu with Glassmorphism */}
            {isHovered && !isDeleted && (
                <div
                    className={`absolute -top-9 z-20 flex items-center gap-1 bg-slate-900/95 border border-white/15 rounded-full px-2.5 py-1 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 ${
                        isMine ? "right-2" : "left-2"
                    }`}
                >
                    {/* Fast Reaction Emojis */}
                    {REACTION_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => onReaction && onReaction(msg.id, emoji)}
                            className="hover:scale-130 active:scale-95 transition-transform duration-150 px-1 py-0.5 text-xs rounded"
                        >
                            {emoji}
                        </button>
                    ))}

                    <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-white/15 text-xs">
                        {/* Reply / Quote Button */}
                        <button
                            onClick={() => onReply && onReply(msg)}
                            title="Reply / Quote"
                            className="text-slate-400 hover:text-white px-1 hover:scale-110 active:scale-95 transition-transform"
                        >
                            ↩️
                        </button>

                        {/* Pin Button */}
                        <button
                            onClick={() => onTogglePin && onTogglePin(msg.id)}
                            title={isPinned ? "Unpin message" : "Pin message"}
                            className={`px-1 hover:scale-110 active:scale-95 transition-transform ${isPinned ? "text-cyan-400" : "text-slate-400 hover:text-white"}`}
                        >
                            📌
                        </button>

                        {/* Star Button */}
                        <button
                            onClick={() => onToggleStar && onToggleStar(msg.id)}
                            title={isStarred ? "Unstar message" : "Star message"}
                            className={`px-1 hover:scale-110 active:scale-95 transition-transform ${isStarred ? "text-amber-400" : "text-slate-400 hover:text-white"}`}
                        >
                            {isStarred ? "⭐" : "☆"}
                        </button>

                        {/* Sender Edit & Delete */}
                        {isMine && (
                            <>
                                {msg.message_type !== "audio" && msg.message_type !== "image" && (
                                    <button
                                        onClick={() => onEdit && onEdit(msg)}
                                        title="Edit"
                                        className="text-slate-400 hover:text-white px-1 hover:scale-110 active:scale-95 transition-transform"
                                    >
                                        ✏️
                                    </button>
                                )}
                                <button
                                    onClick={() => onDelete && onDelete(msg.id)}
                                    title="Delete for everyone"
                                    className="text-red-400 hover:text-red-300 px-1 hover:scale-110 active:scale-95 transition-transform"
                                >
                                    🗑️
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Bubble Container */}
            <div
                className={`max-w-[78%] transition-all duration-200 ${
                    isDeleted
                        ? "rounded-2xl bg-slate-800/40 border border-white/5 text-slate-500 italic px-4 py-2"
                        : isMine
                        ? "rounded-[22px] rounded-br-[5px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-600/25 border border-blue-400/25 px-4 py-2.5"
                        : theme === "light"
                        ? "rounded-[22px] rounded-bl-[5px] bg-white border border-slate-200/90 text-slate-800 px-4 py-2.5 shadow-md shadow-slate-200/60"
                        : theme === "amoled"
                        ? "rounded-[22px] rounded-bl-[5px] bg-neutral-900 border border-neutral-800 text-neutral-100 px-4 py-2.5 shadow-lg shadow-black/40"
                        : "rounded-[22px] rounded-bl-[5px] bg-slate-800/90 backdrop-blur-xl border border-white/10 text-slate-100 px-4 py-2.5 shadow-xl shadow-black/25"
                }`}
            >
                {/* Quoted / Replying-to Preview */}
                {!isDeleted && msg.reply_to_text && (
                    <div
                        onClick={() => document.getElementById(`msg-${msg.reply_to_id}`)?.scrollIntoView({ behavior: "smooth" })}
                        className={`mb-2 p-2.5 rounded-xl text-xs cursor-pointer border-l-4 transition hover:opacity-90 ${
                            isMine ? "bg-black/30 border-cyan-300 text-blue-100" : "bg-black/20 border-cyan-500 text-slate-200"
                        }`}
                    >
                        <p className="font-bold text-[11px] opacity-90 truncate">
                            {msg.reply_to_sender || "Reply"}
                        </p>
                        <p className="truncate opacity-80 mt-0.5">
                            {msg.reply_to_text}
                        </p>
                    </div>
                )}

                {/* Image Attachment */}
                {!isDeleted && (msg.message_type === "image" || msg.file_url) && msg.file_url && msg.file_url.startsWith("data:image") && (
                    <div className="mb-2 overflow-hidden rounded-2xl bg-black/20 border border-white/10 shadow-inner">
                        <img
                            src={msg.file_url}
                            alt="Attached"
                            className="max-h-80 w-auto rounded-2xl object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                            onClick={() => window.open(msg.file_url, "_blank")}
                        />
                    </div>
                )}

                {/* Audio / Voice Note with Animated Waveform */}
                {!isDeleted && msg.message_type === "audio" && (msg.file_url || msg.fileUrl) && (
                    <div className="my-1 flex items-center gap-3 p-1 min-w-[230px]">
                        <button
                            type="button"
                            onClick={() => onPlayAudio && onPlayAudio(msg.id)}
                            className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center font-bold text-sm shadow-md hover:scale-110 active:scale-95 transition-transform shrink-0"
                        >
                            {activeAudioId === msg.id ? "⏸" : "▶"}
                        </button>

                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 h-6">
                                <div className={`w-1 rounded-full ${isMine ? "bg-cyan-200" : "bg-cyan-400"} ${activeAudioId === msg.id ? "animate-wave-1" : "h-3"}`}></div>
                                <div className={`w-1 rounded-full ${isMine ? "bg-cyan-200" : "bg-cyan-400"} ${activeAudioId === msg.id ? "animate-wave-2" : "h-5"}`}></div>
                                <div className={`w-1 rounded-full ${isMine ? "bg-cyan-200" : "bg-cyan-400"} ${activeAudioId === msg.id ? "animate-wave-3" : "h-2"}`}></div>
                                <div className={`w-1 rounded-full ${isMine ? "bg-cyan-200" : "bg-cyan-400"} ${activeAudioId === msg.id ? "animate-wave-4" : "h-4"}`}></div>
                                <div className={`w-1 rounded-full ${isMine ? "bg-cyan-200" : "bg-cyan-400"} ${activeAudioId === msg.id ? "animate-wave-5" : "h-3"}`}></div>
                            </div>
                            <span className="text-[10px] opacity-80 font-medium">
                                {activeAudioId === msg.id ? "Playing voice note..." : "Voice note"}
                            </span>
                        </div>

                        <audio
                            id={`audio-${msg.id}`}
                            src={msg.file_url || msg.fileUrl}
                            onEnded={() => onPlayAudio && onPlayAudio(null)}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Text Content */}
                {(!msg.message_type || msg.message_type === "text" || (msg.message && msg.message !== "Photo" && msg.message !== "Voice note")) && (
                    <p className="text-sm leading-6 break-words">
                        {msg.message}
                    </p>
                )}

                {/* Bubble Footer */}
                <div
                    className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 ${
                        isMine ? "text-blue-100/80" : "text-slate-400"
                    }`}
                >
                    {isPinned && <span>📌</span>}
                    {isStarred && <span className="text-amber-300">⭐</span>}
                    {isEdited && !isDeleted && <span className="italic opacity-80">edited</span>}
                    <span>{formatTime ? formatTime(msg.created_at ?? msg.createdAt) : ""}</span>

                    {isMine && !isDeleted && (
                        <span className={`ml-0.5 font-bold tracking-tighter ${isRead ? "text-cyan-200" : "opacity-70"}`}>
                            {isRead ? "✓✓" : "✓"}
                        </span>
                    )}
                </div>
            </div>

            {/* Reactions Pills */}
            {hasReactions && !isDeleted && (
                <div
                    className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${
                        isMine ? "justify-end" : "justify-start"
                    }`}
                >
                    {Object.entries(reactions).map(([emoji, userIds]) => {
                        const count = userIds.length;
                        if (count === 0) return null;
                        const hasMine = userIds.includes(Number(currentUserId));

                        return (
                            <button
                                key={emoji}
                                onClick={() => onReaction && onReaction(msg.id, emoji)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
                                    hasMine
                                        ? "bg-blue-600/35 border-blue-400/60 text-cyan-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                        : "bg-slate-800/90 border-white/10 text-slate-300 hover:bg-slate-700/90"
                                }`}
                            >
                                <span>{emoji}</span>
                                <span className="text-[10px] font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
