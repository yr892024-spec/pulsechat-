// ============================================================
// BROWSER DESKTOP NOTIFICATIONS
// ============================================================

export const isNotificationSupported = () => {
    return typeof window !== "undefined" && "Notification" in window;
};

export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        return false;
    }

    try {
        if (Notification.permission === "granted") {
            return true;
        }

        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
    } catch (err) {
        console.warn("Error requesting notification permission:", err);
    }

    return false;
};

export const showDesktopNotification = ({ title, body, icon = "/favicon.svg", onClick }) => {
    if (!isNotificationSupported() || Notification.permission !== "granted") {
        return null;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon,
            silent: true // We use our own Web Audio chime
        });

        notification.onclick = () => {
            window.focus();
            if (onClick) {
                onClick();
            }
            notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);

        return notification;
    } catch (err) {
        console.warn("Could not display desktop notification:", err);
        return null;
    }
};
