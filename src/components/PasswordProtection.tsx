import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle } from "lucide-react";

interface PasswordProtectionProps {
    children: React.ReactNode;
}

// Cek apakah password protection diaktifkan via .env
const isPasswordProtectionEnabled = () => {
    const envValue = import.meta.env.VITE_ENABLE_PASSWORD_PROTECTION;

    // Jika tidak di-set, default adalah true (enabled)
    if (envValue === undefined || envValue === null || envValue === "") {
        return true;
    }

    // Parse string ke boolean
    if (typeof envValue === "string") {
        return envValue.toLowerCase() === "true" || envValue === "1";
    }

    return Boolean(envValue);
};

// Konstanta keamanan
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 menit dalam milliseconds
const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 menit dalam milliseconds
const STORAGE_KEY_PREFIX = "__hc_auth_";
const ATTEMPT_KEY = `${STORAGE_KEY_PREFIX}attempts`;
const LOCKOUT_KEY = `${STORAGE_KEY_PREFIX}lockout`;
const SESSION_KEY = `${STORAGE_KEY_PREFIX}session`;
const TIMESTAMP_KEY = `${STORAGE_KEY_PREFIX}timestamp`;
const TOKEN_KEY = `${STORAGE_KEY_PREFIX}token`;

// Hash function dengan fallback untuk kompatibilitas
async function hashPassword(password: string): Promise<string> {
    // Cek apakah Web Crypto API tersedia
    if (typeof crypto !== "undefined" && crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        } catch (error) {
            console.warn("Web Crypto API failed, using fallback hash");
        }
    }

    // Fallback: Simple hash untuk development/compatibility
    // NOTE: Ini tidak seaman SHA-256, tapi cukup untuk basic protection
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Tambahkan salt sederhana
    const salted = hash.toString(16) + password.length.toString(16);
    return salted.padStart(16, "0");
}

// Generate random token untuk session validation
function generateToken(): string {
    // Cek apakah crypto.getRandomValues tersedia
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        try {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, (byte) =>
                byte.toString(16).padStart(2, "0"),
            ).join("");
        } catch (error) {
            console.warn("crypto.getRandomValues failed, using fallback");
        }
    }

    // Fallback: Generate pseudo-random token
    let token = "";
    const chars =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token + Date.now().toString(36);
}

// Enkripsi sederhana untuk menyimpan data di storage
function encryptData(data: string, salt: string): string {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
            data.charCodeAt(i) ^ salt.charCodeAt(i % salt.length),
        );
    }
    return btoa(result);
}

function decryptData(encrypted: string, salt: string): string {
    try {
        const data = atob(encrypted);
        let result = "";
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(
                data.charCodeAt(i) ^ salt.charCodeAt(i % salt.length),
            );
        }
        return result;
    } catch {
        return "";
    }
}

export const PasswordProtection = ({ children }: PasswordProtectionProps) => {
    // Cek apakah password protection aktif
    const passwordEnabled = isPasswordProtectionEnabled();

    // Jika disabled, langsung render children
    if (!passwordEnabled) {
        console.log("🔓 Password protection disabled via .env");
        return <>{children}</>;
    }

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [attempts, setAttempts] = useState(0);

    // Fungsi untuk membersihkan semua data autentikasi
    const clearAuthData = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(TIMESTAMP_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
    }, []);

    // Cek lockout status
    const checkLockout = useCallback(() => {
        const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
        if (lockoutTime) {
            const lockoutTimestamp = parseInt(lockoutTime, 10);
            const now = Date.now();

            if (now < lockoutTimestamp) {
                setIsLocked(true);
                setRemainingTime(Math.ceil((lockoutTimestamp - now) / 1000));
                return true;
            } else {
                // Lockout expired, reset
                localStorage.removeItem(LOCKOUT_KEY);
                localStorage.removeItem(ATTEMPT_KEY);
                setIsLocked(false);
                setAttempts(0);
            }
        }
        return false;
    }, []);

    // Update countdown timer untuk lockout
    useEffect(() => {
        if (isLocked && remainingTime > 0) {
            const timer = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        localStorage.removeItem(LOCKOUT_KEY);
                        localStorage.removeItem(ATTEMPT_KEY);
                        setAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isLocked, remainingTime]);

    // Validasi session yang ada
    const validateSession = useCallback(() => {
        try {
            const sessionData = sessionStorage.getItem(SESSION_KEY);
            const timestamp = sessionStorage.getItem(TIMESTAMP_KEY);
            const token = sessionStorage.getItem(TOKEN_KEY);

            if (!sessionData || !timestamp || !token) {
                return false;
            }

            // Cek timeout session
            const sessionTime = parseInt(timestamp, 10);
            const now = Date.now();

            if (now - sessionTime > SESSION_TIMEOUT) {
                clearAuthData();
                return false;
            }

            // Validasi integritas token
            const decrypted = decryptData(sessionData, token);
            if (decrypted !== "authenticated") {
                clearAuthData();
                return false;
            }

            // Update timestamp untuk extend session
            sessionStorage.setItem(TIMESTAMP_KEY, now.toString());
            return true;
        } catch {
            clearAuthData();
            return false;
        }
    }, [clearAuthData]);

    // Cek autentikasi saat mount dan setup interval check
    useEffect(() => {
        checkLockout();

        if (validateSession()) {
            setIsAuthenticated(true);
        }

        // Periodic session validation
        const interval = setInterval(() => {
            if (isAuthenticated && !validateSession()) {
                setError("Sesi Anda telah berakhir. Silakan login kembali.");
            }
        }, 60000); // Check setiap 1 menit

        return () => clearInterval(interval);
    }, [validateSession, checkLockout, isAuthenticated]);

    // Proteksi terhadap manipulasi console
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (
                e.key?.startsWith(STORAGE_KEY_PREFIX) &&
                e.newValue !== e.oldValue
            ) {
                // Detect manual manipulation
                clearAuthData();
                window.location.reload();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [clearAuthData]);

    // Anti-debug protection (opsional, bisa di-comment jika mengganggu development)
    useEffect(() => {
        const detectDevTools = () => {
            const threshold = 160;
            if (
                window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold
            ) {
                // DevTools mungkin terbuka, tambahkan log saja
                console.warn(
                    "Development tools detected. Please use the app as intended.",
                );
            }
        };

        const interval = setInterval(detectDevTools, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) {
            return;
        }

        if (checkLockout()) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Simulasi delay untuk mencegah timing attacks
            const startTime = Date.now();

            // Get password dari environment variable
            const correctPassword =
                import.meta.env.VITE_APP_PASSWORD || "test123";

            // Hash password untuk perbandingan yang lebih aman
            const inputHash = await hashPassword(password);
            const correctHash = await hashPassword(correctPassword);

            // Ensure minimum processing time untuk mencegah timing attacks
            const processingTime = Date.now() - startTime;
            if (processingTime < 300) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 300 - processingTime),
                );
            }

            if (inputHash === correctHash) {
                // Password benar - setup secure session
                const token = generateToken();
                const encryptedSession = encryptData("authenticated", token);

                sessionStorage.setItem(SESSION_KEY, encryptedSession);
                sessionStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
                sessionStorage.setItem(TOKEN_KEY, token);

                // Reset attempts
                localStorage.removeItem(ATTEMPT_KEY);

                setIsAuthenticated(true);
                setError("");
                setPassword("");
                setAttempts(0);
            } else {
                // Password salah - increment attempts
                const currentAttempts = parseInt(
                    localStorage.getItem(ATTEMPT_KEY) || "0",
                    10,
                );
                const newAttempts = currentAttempts + 1;

                localStorage.setItem(ATTEMPT_KEY, newAttempts.toString());
                setAttempts(newAttempts);

                if (newAttempts >= MAX_ATTEMPTS) {
                    // Lock akun
                    const lockoutUntil = Date.now() + LOCKOUT_DURATION;
                    localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
                    setIsLocked(true);
                    setRemainingTime(Math.ceil(LOCKOUT_DURATION / 1000));
                    setError(
                        `Terlalu banyak percobaan gagal. Akun dikunci selama ${LOCKOUT_DURATION / 60000} menit.`,
                    );
                } else {
                    const remainingAttempts = MAX_ATTEMPTS - newAttempts;
                    setError(
                        `Password salah. ${remainingAttempts} percobaan tersisa sebelum akun dikunci.`,
                    );
                }

                setPassword("");
            }
        } catch (err) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
            console.error("Authentication error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[hsl(var(--background))] px-4 py-12">
            <div
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%)]"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(21,128,61,0.22),_transparent_70%)] blur-3xl"
                aria-hidden="true"
            />

            <div className="relative w-full max-w-md">
                <div
                    className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-600/40 via-green-500/20 to-lime-500/40 opacity-90 blur-3xl"
                    aria-hidden="true"
                />

                <div className="relative overflow-hidden rounded-[32px] border border-emerald-400/15 bg-[rgba(7,22,14,0.92)] shadow-[0_24px_70px_rgba(6,24,14,0.55)] backdrop-blur-2xl">
                    <div
                        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
                        aria-hidden="true"
                    />

                    <div className="space-y-8 p-8 sm:p-10">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <span
                                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_18px_52px_rgba(34,197,94,0.35)] ${
                                    isLocked
                                        ? "bg-gradient-to-tr from-rose-500 via-red-500 to-orange-400"
                                        : "bg-gradient-to-tr from-emerald-500 via-green-500 to-lime-400"
                                }`}
                            >
                                {isLocked ? (
                                    <AlertTriangle
                                        className="h-8 w-8 text-white"
                                        strokeWidth={1.5}
                                    />
                                ) : (
                                    <Lock
                                        className="h-8 w-8 text-white"
                                        strokeWidth={1.5}
                                    />
                                )}
                            </span>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-white">
                                    HadesChat
                                </h1>
                                <p className="text-base text-emerald-100/70">
                                    {isLocked
                                        ? "Akun dikunci sementara karena terlalu banyak percobaan gagal."
                                        : "Masukkan kata sandi untuk melanjutkan ke ruang obrolan Anda."}
                                </p>
                            </div>
                        </div>

                        {isLocked ? (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-rose-400/30 bg-rose-500/20 px-4 py-6 text-center">
                                    <p className="text-sm font-medium text-rose-100">
                                        Akun Anda dikunci
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-white">
                                        {formatTime(remainingTime)}
                                    </p>
                                    <p className="mt-1 text-xs text-rose-100/70">
                                        Waktu tersisa sebelum dapat mencoba lagi
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/80">
                                    <p>
                                        Terlalu banyak percobaan login gagal.
                                        Silakan tunggu hingga timer selesai.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <label
                                        htmlFor="password"
                                        className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100/60"
                                    >
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="w-full border border-emerald-400/30 bg-[rgba(3,12,7,0.95)] px-4 py-3 text-base text-white placeholder:text-emerald-100/40 focus-visible:border-emerald-400 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-0"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                    {error && (
                                        <p className="text-sm font-medium text-rose-300">
                                            {error}
                                        </p>
                                    )}
                                    {attempts > 0 &&
                                        attempts < MAX_ATTEMPTS && (
                                            <p className="text-xs text-amber-300/80">
                                                Percobaan gagal: {attempts}/
                                                {MAX_ATTEMPTS}
                                            </p>
                                        )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-300 py-5 text-base font-semibold text-emerald-950 shadow-[0_22px_55px_rgba(34,197,94,0.35)] transition-transform hover:-translate-y-[1px] hover:shadow-[0_28px_62px_rgba(74,222,128,0.45)] disabled:translate-y-0 disabled:shadow-none"
                                    disabled={isLoading || !password}
                                >
                                    {isLoading ? "Memverifikasi..." : "Masuk"}
                                </Button>
                            </form>
                        )}

                        <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-100/70">
                            <p className="flex items-center justify-center gap-2">
                                <Lock className="h-4 w-4" />
                                Akses dilindungi dengan enkripsi untuk menjaga
                                keamanan
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
