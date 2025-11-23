// Debug utilities
// Control debug mode via VITE_DEBUG_MODE environment variable

const isDebugMode = () => {
    const debugEnv = import.meta.env.VITE_DEBUG_MODE;
    return debugEnv === 'true' || debugEnv === true;
};

export const DEBUG_MODE = isDebugMode();

// Debug log wrapper - only logs when debug mode is enabled
export const debugLog = (...args: unknown[]) => {
    if (DEBUG_MODE) {
        console.log(...args);
    }
};

// Debug warn wrapper
export const debugWarn = (...args: unknown[]) => {
    if (DEBUG_MODE) {
        console.warn(...args);
    }
};

// Debug error wrapper
export const debugError = (...args: unknown[]) => {
    if (DEBUG_MODE) {
        console.error(...args);
    }
};

// Debug info with emoji
export const debugInfo = (emoji: string, ...args: unknown[]) => {
    if (DEBUG_MODE) {
        console.log(emoji, ...args);
    }
};

// Always log (for critical errors/success)
export const alwaysLog = (...args: unknown[]) => {
    console.log(...args);
};
