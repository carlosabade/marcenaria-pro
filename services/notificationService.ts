
// Short beep for notifications (Syntax safe)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated/Dummy for safety, replaced with real sound logic below if needed or browser default

export const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) return;

    const show = () => {
        new Notification(title, { ...options, icon: '/favicon.ico' });
        
        // Simple Beep using AudioContext (Better than Base64 string for stability)
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            console.log("Audio error", e);
        }
    };

    if (Notification.permission === "granted") {
        show();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                show();
            }
        });
    }
};

export const checkAppointments = () => {
    // Logic checked in App.tsx interval
};
