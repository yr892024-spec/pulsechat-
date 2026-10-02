import React from "react";

export default function ChatHeader({
    selectedTarget,
    isGroupChat = false,
    groupMembers = [],
    isOnline = false,
    isTyping = false,
    showOnlyStarred = false,
    onToggleStarred,
    isChatSearchOpen = false,
    onToggleChatSearch,
    onToggleGroupInfo,
    headerClass = ""
}) {
    return (
        <header className={`h-14 shrink-0 flex items-center justify-between px-4 z-10 select-none backdrop-blur-xl ${headerClass}`}>
            {/* Target Avatar and Info */}
            <div
                onClick={() => {
                    if (isGroupChat && onToggleGroupInfo) onToggleGroupInfo();
                }}
                className={`flex items-center gap-3 ${isGroupChat ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
            >
                <div className="relative">
                    {isGroupChat ? (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-lg shadow-md shadow-indigo-600/25">
                            {selectedTarget?.group_image || "👥"}
                        </div>
                    ) : selectedTarget?.profile_image ? (
                        <img
                            src={selectedTarget.profile_image}
                            alt={selectedTarget.name}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/10 shadow-md"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-500/25">
                            {selectedTarget?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {!isGroupChat && (
                        <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-all ${
                                isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"
                            }`}
                        />
                    )}
                </div>

                <div>
                    <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{selectedTarget?.name}</span>
                    </h2>

                    <div className="flex items-center gap-1">
                        {isGroupChat ? (
                            <p className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors">
                                {groupMembers.length > 0 ? `${groupMembers.length} members` : "Group details ℹ️"}
                            </p>
                        ) : isTyping ? (
                            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                                <span>typing</span>
                                <span className="inline-flex gap-0.5">
                                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
                                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                                </span>
                            </p>
                        ) : isOnline ? (
                            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                                <span>online</span>
                            </p>
                        ) : (
                            <p className="text-[11px] text-slate-400">{selectedTarget?.bio || "last seen recently"}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1">
                {/* Starred Filter Toggle */}
                <button
                    onClick={onToggleStarred}
                    title={showOnlyStarred ? "Show all messages" : "Show starred messages only"}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all duration-150 hover:scale-105 active:scale-95 ${
                        showOnlyStarred
                            ? "bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]"
                            : "hover:bg-white/10 text-slate-400 hover:text-white"
                    }`}
                >
                    ⭐
                </button>

                {/* In-chat Search Toggle */}
                <button
                    onClick={onToggleChatSearch}
                    title="Search in chat"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all duration-150 hover:scale-105 active:scale-95 ${
                        isChatSearchOpen
                            ? "bg-blue-600/25 text-cyan-300 border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]"
                            : "hover:bg-white/10 text-slate-400 hover:text-white"
                    }`}
                >
                    🔍
                </button>

                {/* Group Info Drawer (If Group) */}
                {isGroupChat && (
                    <button
                        onClick={onToggleGroupInfo}
                        title="Group Details"
                        className="w-9 h-9 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center text-xs text-slate-400 hover:text-white transition-all duration-150"
                    >
                        ℹ️
                    </button>
                )}
            </div>
        </header>
    );
}
