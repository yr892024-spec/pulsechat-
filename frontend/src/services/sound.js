// ============================================================
// WEB AUDIO API NOTIFICATION & SOUND ENGINE
// Includes browser interaction unlock, incoming chime,
// outgoing message pop, and audio testing
// ============================================================

let audioCtx = null;
let isAudioUnlocked = false;

export const getAudioContext = () => {
    if (!audioCtx && typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    return audioCtx;
};

// Automatically unlock AudioContext on first user interaction anywhere on page
export const unlockAudio = () => {
    if (isAudioUnlocked) return;
    try {
        const ctx = getAudioContext();
        if (ctx) {
            if (ctx.state === "suspended") {
                ctx.resume().then(() => {
                    isAudioUnlocked = true;
                    console.log("AudioContext unlocked successfully");
                }).catch(err => console.warn("Audio unlock pending gesture:", err));
            } else {
                isAudioUnlocked = true;
            }
        }
    } catch (e) {
        console.warn("AudioContext error:", e);
    }
};

// Attach listeners for initial user gesture
if (typeof window !== "undefined") {
    const handleGesture = () => {
        unlockAudio();
        window.removeEventListener("click", handleGesture);
        window.removeEventListener("keydown", handleGesture);
        window.removeEventListener("touchstart", handleGesture);
    };
    window.addEventListener("click", handleGesture, { once: true });
    window.addEventListener("keydown", handleGesture, { once: true });
    window.addEventListener("touchstart", handleGesture, { once: true });
}

// ------------------------------------------------------------
// INCOMING MESSAGE CHIME (Harmonic 2-tone chime)
// ------------------------------------------------------------
export const playNotificationSound = async () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === "suspended") {
            await ctx.resume();
        }

        const now = ctx.currentTime;

        // Note 1: E5 (659.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(659.25, now);

        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Note 2: B5 (987.77 Hz) slightly delayed
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(987.77, now + 0.1);

        gain2.gain.setValueAtTime(0.25, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.6);

    } catch (err) {
        console.warn("Could not play notification sound:", err);
    }
};

// ------------------------------------------------------------
// OUTGOING MESSAGE POP (Subtle confirmation click)
// ------------------------------------------------------------
export const playSentSound = async () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === "suspended") {
            await ctx.resume();
        }

        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        // Frequency sweep from 440 Hz down to 220 Hz
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

    } catch (err) {
        console.warn("Could not play sent sound:", err);
    }
};
