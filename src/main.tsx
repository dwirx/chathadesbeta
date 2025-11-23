import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
    debugLog,
    debugInfo,
    debugError,
    debugWarn,
    alwaysLog,
} from "@/lib/debug";

// Debug environment variables
debugInfo("🔍", "Environment Variables Check:");
debugLog("POE:", import.meta.env.VITE_POE_API_KEY ? "✅" : "❌");
debugLog("TOGETHER:", import.meta.env.VITE_TOGETHER_API_KEY ? "✅" : "❌");
debugLog("GROQ:", import.meta.env.VITE_GROQ_API_KEY ? "✅" : "❌");
debugLog("OPENROUTER:", import.meta.env.VITE_OPENROUTER_API_KEY ? "✅" : "❌");

if (import.meta.env.VITE_GROQ_API_KEY) {
    debugLog(
        "✅ GROQ KEY LOADED:",
        import.meta.env.VITE_GROQ_API_KEY.substring(0, 15) + "...",
    );
} else {
    alwaysLog("❌ GROQ KEY NOT LOADED! Check .env file and restart server!");
}

if (import.meta.env.VITE_OPENROUTER_API_KEY) {
    debugLog(
        "✅ OPENROUTER KEY LOADED:",
        import.meta.env.VITE_OPENROUTER_API_KEY.substring(0, 15) + "...",
    );
} else {
    debugWarn(
        "⚠️ OPENROUTER KEY NOT LOADED! Add to .env file if you want to use OpenRouter.",
    );
}

createRoot(document.getElementById("root")!).render(<App />);
