import React from "react";
import PulseLogo from "./PulseLogo";

export default function SidebarHeader({
    currentUser,
    theme,
    onToggleTheme,
    soundEnabled,
    onToggleSound,
    onOpenProfile,
    onOpenCreateGroup,
    onLogout,
    search,
    onSearchChange,
    sidebarTab,
    onTabChange,
    groupCount = 0,
    searchInputClass = ""
}) {
    return (
        <div className="p-3.5 border-b border-inherit space-y-3 select-none">
            {/* Top Brand Bar: Prominently Visible Glowing PulseChat Logo */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                <PulseLogo size={28} showText={true} animated={true} />

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-semibold text-emerald-400 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Live</span>
                </div>
            </div>

            {/* User Profile Pill & Top Controls */}
            <div className="flex items-center justify-between pt-0.5">
                {/* Profile Pill */}
                <button
                    onClick={onOpenProfile}
                    title="Edit Profile & Avatar"
                    className="flex items-center gap-2.5 hover:bg-white/[0.04] transition-all duration-200 p-1.5 -ml-1 rounded-2xl text-left group"
                >
                    <div className="relative shrink-0">
                        {currentUser?.profile_image ? (
                            <img
                                src={currentUser.profile_image}
                                alt={currentUser.name}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-500/25">
                                {currentUser?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="font-semibold text-xs sm:text-sm truncate text-slate-100 max-w-[130px] group-hover:text-cyan-300 transition">
                            {currentUser?.name}
                        </h1>
                        <p className="text-[11px] text-slate-400 truncate max-w-[130px] -mt-0.5">
                            {currentUser?.bio || "Available"}
                        </p>
                    </div>
                </button>

                {/* Control Action Icons with Glow & Micro-interactions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onOpenCreateGroup}
                        title="New Group Chat"
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center text-sm transition-all duration-150"
                    >
                        👥
                    </button>
                    <button
                        onClick={onToggleTheme}
                        title={`Theme: ${theme.toUpperCase()}`}
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center text-xs transition-all duration-150"
                    >
                        {theme === "slate" ? "🌙" : theme === "amoled" ? "🌑" : "☀️"}
                    </button>
                    <button
                        onClick={onToggleSound}
                        title={soundEnabled ? "Sound enabled (Click to mute)" : "Sound muted (Click to unmute)"}
                        className={`w-8 h-8 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center text-xs transition-all duration-150 ${
                            soundEnabled ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" : "text-slate-500"
                        }`}
                    >
                        {soundEnabled ? "🔔" : "🔕"}
                    </button>
                    <button
                        onClick={onLogout}
                        title="Log Out"
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/15 hover:scale-105 active:scale-95 flex items-center justify-center text-xs transition-all duration-150"
                    >
                        🚪
                    </button>
                </div>
            </div>

            {/* Search Input with Neon Accent */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search contacts & groups..."
                    className={`w-full rounded-xl py-2 pl-8 pr-7 text-xs outline-none transition-all duration-200 ${searchInputClass}`}
                />
                {search && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Filter Tabs with Pill Transition */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 backdrop-blur-md text-xs font-medium border border-white/5">
                <button
                    onClick={() => onTabChange("all")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all duration-200 ${
                        sidebarTab === "all"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => onTabChange("direct")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all duration-200 ${
                        sidebarTab === "direct"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    Direct
                </button>
                <button
                    onClick={() => onTabChange("groups")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all duration-200 ${
                        sidebarTab === "groups"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    Groups {groupCount > 0 && `(${groupCount})`}
                </button>
            </div>
        </div>
    );
}
