import React from "react";

export default function ConversationListItem({
    item,
    isGroup = false,
    isSelected = false,
    isOnline = false,
    isTyping = false,
    unreadCount = 0,
    timeString = "",
    onSelect
}) {
    return (
        <button
            onClick={() => onSelect(item)}
            className={`w-full relative flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all duration-200 select-none group ${
                isSelected
                    ? "bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/30 shadow-[0_0_20px_-4px_rgba(59,130,246,0.25)] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1.5 before:rounded-r-full before:bg-gradient-to-b before:from-cyan-400 before:to-blue-600"
                    : "hover:bg-white/[0.05] hover:translate-x-1"
            }`}
        >
            {/* Avatar with Glow and Online Indicator */}
            <div className="relative shrink-0">
                {isGroup ? (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-lg shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
                        {item.group_image || "👥"}
                    </div>
                ) : item.profile_image ? (
                    <img
                        src={item.profile_image}
                        alt={item.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-blue-500/50 group-hover:scale-105 transition-all duration-200 shadow-md"
                    />
                ) : (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 via-slate-800 to-blue-900 flex items-center justify-center font-bold text-white text-sm shadow-md group-hover:scale-105 transition-all duration-200">
                        {item.name?.charAt(0).toUpperCase()}
                    </div>
                )}

                {!isGroup && (
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-all ${
                            isOnline
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                : "bg-slate-500"
                        }`}
                    />
                )}
            </div>

            {/* Conversation Details */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <p className={`font-semibold text-sm truncate transition-colors ${
                        isSelected ? "text-cyan-300" : "text-slate-100 group-hover:text-white"
                    }`}>
                        {item.name}
                    </p>
                    {timeString && (
                        <span className={`text-[11px] shrink-0 font-medium ${
                            unreadCount > 0 ? "text-cyan-400 font-bold" : "text-slate-400"
                        }`}>
                            {timeString}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-1.5 mt-0.5">
                    {isTyping ? (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-pulse">
                            <span>typing</span>
                            <span className="inline-flex gap-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                            </span>
                        </span>
                    ) : (
                        <p className="text-xs text-slate-400 truncate flex-1 group-hover:text-slate-300 transition-colors">
                            {isGroup
                                ? item.last_message || `${item.member_count || 2} members`
                                : item.last_message || item.bio || item.email || "No messages yet"}
                        </p>
                    )}

                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shrink-0 shadow-md shadow-blue-500/35">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
