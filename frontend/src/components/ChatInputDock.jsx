import React from "react";

const POPULAR_EMOJIS = [
    "😀", "😂", "🤣", "😍", "🥰", "😎", "🤔", "🥳", "🤫", "😴",
    "👍", "👎", "👏", "🙌", "🙏", "❤️", "💖", "🔥", "✨", "🎉",
    "🚀", "💯", "🍕", "☕", "🎈", "👋", "🤝", "💪", "💡", "⭐"
];

export default function ChatInputDock({
    message,
    onMessageChange,
    onSubmit,
    fileInputRef,
    onImageSelect,
    selectedImagePreview,
    onClearImagePreview,
    replyingToMessage,
    onCancelReply,
    editingMessage,
    onCancelEdit,
    showEmojiPicker,
    onToggleEmojiPicker,
    onSelectEmoji,
    isRecording,
    recordingTime,
    onStartRecording,
    onCancelRecording,
    onStopAndSendRecording,
    targetName = "User",
    inputBarClass = "",
    searchInputClass = "",
    formatRecordTimer
}) {
    return (
        <div className="shrink-0 relative select-none">
            {/* Replying-To Bar with Cyan Accent */}
            {replyingToMessage && (
                <div className="px-6 py-2 bg-gradient-to-r from-blue-950/60 to-slate-900/60 border-t border-cyan-500/30 flex items-center justify-between text-xs text-blue-200 backdrop-blur-xl">
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-cyan-300">↩️ Replying to <span className="text-white">{replyingToMessage.senderName}</span>:</span>
                        <span className="italic truncate text-slate-300 max-w-md">"{replyingToMessage.message}"</span>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="text-slate-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 text-xs transition"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Editing Bar with Amber Accent */}
            {editingMessage && (
                <div className="px-6 py-2 bg-gradient-to-r from-amber-950/40 to-slate-900/60 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-200 backdrop-blur-xl">
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-amber-400">✏️ Editing message:</span>
                        <span className="italic truncate text-slate-300 max-w-md">"{editingMessage.message}"</span>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="text-slate-400 hover:text-white px-2.5 py-0.5 rounded-lg hover:bg-white/10 text-xs font-semibold transition"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Image Preview Bar with Glass Thumbnail */}
            {selectedImagePreview && (
                <div className="px-6 py-3 bg-slate-900/90 border-t border-inherit flex items-center gap-3 backdrop-blur-xl">
                    <div className="relative group">
                        <img
                            src={selectedImagePreview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-2xl border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                        />
                        <button
                            type="button"
                            onClick={onClearImagePreview}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-md hover:scale-110 active:scale-95 transition"
                        >
                            ✕
                        </button>
                    </div>
                    <span className="text-xs text-slate-300">Photo attached. Add a message or press Send.</span>
                </div>
            )}

            {/* Floating Glass Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-24 left-4 sm:left-6 z-30 p-3 bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl backdrop-blur-2xl grid grid-cols-6 gap-2 w-72 animate-in fade-in zoom-in-95 duration-150">
                    {POPULAR_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => onSelectEmoji && onSelectEmoji(emoji)}
                            className="text-xl p-1.5 hover:scale-130 hover:bg-white/10 rounded-xl transition-all duration-150 flex items-center justify-center active:scale-95"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form Bar */}
            <form
                onSubmit={onSubmit}
                className={`p-3 sm:p-4 backdrop-blur-xl shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.25)] ${inputBarClass}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onImageSelect}
                    className="hidden"
                />

                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    {/* Media Attach & Emoji Drawer Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => fileInputRef?.current?.click()}
                            title="Attach image"
                            className="w-10 h-10 rounded-2xl border border-inherit hover:border-cyan-500/50 bg-white/[0.04] hover:bg-white/[0.08] hover:scale-105 active:scale-95 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all duration-150 shadow-sm"
                        >
                            📎
                        </button>

                        <button
                            type="button"
                            onClick={onToggleEmojiPicker}
                            title="Emoji drawer"
                            className={`w-10 h-10 rounded-2xl border transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center text-base shadow-sm ${
                                showEmojiPicker
                                    ? "bg-blue-600/30 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                                    : "border-inherit hover:border-cyan-500/50 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300"
                            }`}
                        >
                            😊
                        </button>
                    </div>

                    {/* Recording Mode Bar vs Normal Text Input */}
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between bg-red-950/70 border border-red-500/60 rounded-2xl px-5 py-2.5 animate-pulse shadow-xl shadow-red-950/40">
                            <div className="flex items-center gap-2.5 text-red-400 text-xs font-bold">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                </span>
                                <span>Recording: {formatRecordTimer ? formatRecordTimer(recordingTime) : `${recordingTime}s`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onCancelRecording}
                                    className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onStopAndSendRecording}
                                    className="px-4 py-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold hover:scale-105 active:scale-95 shadow-md shadow-red-600/40 transition"
                                >
                                    Send ➤
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 relative flex items-center">
                            <input
                                value={message}
                                onChange={onMessageChange}
                                placeholder={
                                    editingMessage
                                        ? "Edit your message..."
                                        : replyingToMessage
                                        ? `Reply to ${replyingToMessage.senderName}...`
                                        : `Message ${targetName}...`
                                }
                                className={`w-full rounded-2xl pl-5 pr-5 py-3 text-xs sm:text-sm outline-none transition-all duration-200 shadow-sm ${searchInputClass}`}
                            />
                        </div>
                    )}

                    {/* Dynamic Action Button: Mic vs Glowing Send */}
                    {!isRecording && !message.trim() && !selectedImagePreview && !editingMessage && (
                        <button
                            type="button"
                            onClick={onStartRecording}
                            title="Record voice note"
                            className="w-10 h-10 shrink-0 rounded-2xl border border-inherit hover:border-cyan-500/50 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-base transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm text-slate-400 hover:text-cyan-300"
                        >
                            🎙️
                        </button>
                    )}

                    {(!isRecording && (message.trim() || selectedImagePreview || editingMessage)) && (
                        <button
                            type="submit"
                            title="Send message"
                            className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/35 hover:shadow-cyan-400/50 text-white transition-all duration-150 hover:scale-105 active:scale-95"
                        >
                            ➤
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
