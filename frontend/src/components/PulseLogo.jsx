import React from "react";

export default function PulseLogo({
    size = 36,
    animated = true,
    showText = false,
    className = ""
}) {
    return (
        <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
            <div
                className="relative shrink-0 flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* Ambient glow effect */}
                {animated && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 opacity-40 blur-md animate-pulse" />
                )}

                {/* Vector SVG */}
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10 drop-shadow-md"
                >
                    <defs>
                        <linearGradient id="compPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient id="compWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#6ee7b7" />
                        </linearGradient>
                    </defs>

                    {/* Chat Bubble Body */}
                    <rect
                        x="10"
                        y="10"
                        width="80"
                        height="74"
                        rx="22"
                        fill="url(#compPulseGrad)"
                    />

                    {/* Chat Tail */}
                    <path
                        d="M 26 82 L 15 93 C 13.5 94.5 11 93.5 11 91.2 L 11 80 Z"
                        fill="url(#compPulseGrad)"
                    />

                    {/* Inner highlight sheen */}
                    <path
                        d="M 16 28 C 16 18, 24 14, 38 12 C 60 10, 80 16, 84 32 C 78 20, 60 16, 40 18 C 24 20, 18 24, 16 28 Z"
                        fill="#ffffff"
                        opacity="0.25"
                    />

                    {/* ECG Pulse Heartbeat line */}
                    <path
                        d="M 22 48 L 35 48 L 42 28 L 51 68 L 59 38 L 66 52 L 71 48 L 78 48"
                        stroke="url(#compWaveGrad)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Glowing Live Signal Dot */}
                    <circle cx="78" cy="48" r="3.5" fill="#ffffff" />
                </svg>

                {/* Live pulsing dot overlay */}
                {animated && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                )}
            </div>

            {/* Brand text title */}
            {showText && (
                <div className="flex flex-col">
                    <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent flex items-center gap-1">
                        Pulse<span className="text-cyan-400 font-black">Chat</span>
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-400/80 -mt-0.5">
                        Real-time
                    </span>
                </div>
            )}
        </div>
    );
}
