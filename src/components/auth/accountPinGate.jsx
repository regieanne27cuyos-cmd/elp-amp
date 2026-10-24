import {
    useEffect,
    useState,
} from "react";
import {
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.45em] text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

async function callPinFunction(body) {
    const {
        data,
        error,
    } = await supabase.functions.invoke(
        "manage-account-pin",
        {
            body,
        },
    );

    if (error) {
        let message =
            error.message ||
            "Unable to process your PIN.";

        let responseData = null;

        try {
            responseData =
                await error.context?.json();

            if (responseData?.error) {
                message =
                    responseData.error;
            }
        } catch {
            // Use the original function error.
        }

        const functionError =
            new Error(message);

        functionError.details =
            responseData;

        throw functionError;
    }

    if (data?.error) {
        const functionError =
            new Error(data.error);

        functionError.details = data;

        throw functionError;
    }

    return data;
}

function cleanPin(value) {
    return value
        .replace(/\D/g, "")
        .slice(0, 6);
}

export default function AccountPinGate({
    accountType = "Account",
    onUnlocked,
}) {
    const [checking, setChecking] =
        useState(true);

    const [registered, setRegistered] =
        useState(false);

    const [pin, setPin] = useState("");

    const [
        confirmPin,
        setConfirmPin,
    ] = useState("");

    const [showPin, setShowPin] =
        useState(false);

    const [
        showConfirmPin,
        setShowConfirmPin,
    ] = useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [lockedUntil, setLockedUntil] =
        useState(null);

    const [secondsLeft, setSecondsLeft] =
        useState(0);

    useEffect(() => {
        let active = true;

        async function checkPinStatus() {
            setChecking(true);
            setError("");

            try {
                const {
                    data: {
                        user,
                    },
                    error: userError,
                } =
                    await supabase.auth.getUser();

                if (
                    userError ||
                    !user
                ) {
                    throw (
                        userError ||
                        new Error(
                            "Your session has expired.",
                        )
                    );
                }

                const result =
                    await callPinFunction({
                        action: "status",
                    });

                if (!active) return;

                const storageKey =
                    `elp_amp_pin_unlocked_${user.id}`;

                if (
                    result.mustReset ||
                    !result.registered
                ) {
                    sessionStorage.removeItem(
                        storageKey,
                    );

                    setRegistered(false);

                    if (
                        result.locked &&
                        result.lockedUntil
                    ) {
                        setLockedUntil(
                            result.lockedUntil,
                        );
                    }

                    return;
                }

                if (
                    sessionStorage.getItem(
                        storageKey,
                    ) === "true"
                ) {
                    onUnlocked?.();
                    return;
                }

                setRegistered(true);

                if (
                    result.locked &&
                    result.lockedUntil
                ) {
                    setLockedUntil(
                        result.lockedUntil,
                    );
                }

                setRegistered(
                    Boolean(result.registered),
                );

                if (
                    result.locked &&
                    result.lockedUntil
                ) {
                    setLockedUntil(
                        result.lockedUntil,
                    );
                }
            } catch (statusError) {
                console.error(
                    "PIN status check failed:",
                    statusError,
                );

                if (active) {
                    setError(
                        statusError.message ||
                        "Unable to check your PIN status.",
                    );
                }
            } finally {
                if (active) {
                    setChecking(false);
                }
            }
        }

        checkPinStatus();

        return () => {
            active = false;
        };
    }, [onUnlocked]);

    useEffect(() => {
        if (!lockedUntil) {
            setSecondsLeft(0);
            return undefined;
        }

        function updateCountdown() {
            const remaining =
                Math.max(
                    0,
                    Math.ceil(
                        (new Date(
                            lockedUntil,
                        ).getTime() -
                            Date.now()) /
                        1000,
                    ),
                );

            setSecondsLeft(remaining);

            if (remaining === 0) {
                setLockedUntil(null);
                setError("");
            }
        }

        updateCountdown();

        const timer = window.setInterval(
            updateCountdown,
            1000,
        );

        return () => {
            window.clearInterval(timer);
        };
    }, [lockedUntil]);

    async function unlockSession() {
        const {
            data: {
                user,
            },
        } =
            await supabase.auth.getUser();

        if (user) {
            sessionStorage.setItem(
                `elp_amp_pin_unlocked_${user.id}`,
                "true",
            );
        }

        onUnlocked?.();
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (pin.length !== 6) {
            setError(
                "Enter exactly 6 numbers.",
            );
            return;
        }

        if (
            !registered &&
            confirmPin.length !== 6
        ) {
            setError(
                "Confirm your 6-digit PIN.",
            );
            return;
        }

        if (
            !registered &&
            pin !== confirmPin
        ) {
            setError(
                "The PIN confirmation does not match.",
            );
            return;
        }

        setSubmitting(true);

        try {
            if (registered) {
                const result =
                    await callPinFunction({
                        action: "verify",
                        pin,
                    });

                if (!result?.verified) {
                    throw new Error(
                        "PIN verification failed.",
                    );
                }
            } else {
                const result =
                    await callPinFunction({
                        action: "register",
                        pin,
                        confirmPin,
                    });

                if (!result?.verified) {
                    throw new Error(
                        "PIN registration failed.",
                    );
                }
            }

            await unlockSession();

            setPin("");
            setConfirmPin("");
        } catch (submitError) {
            console.error(
                "PIN submission failed:",
                submitError,
            );

            const details =
                submitError.details;

            if (
                details?.requiresRegistration
            ) {
                setRegistered(false);
                setPin("");
                setConfirmPin("");
            }

            if (
                details?.lockedUntil
            ) {
                setLockedUntil(
                    details.lockedUntil,
                );
            }

            setError(
                submitError.message ||
                "Unable to verify your PIN.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    function formatRemainingTime() {
        const minutes = Math.floor(
            secondsLeft / 60,
        );

        const seconds =
            secondsLeft % 60;

        return `${minutes}:${String(
            seconds,
        ).padStart(2, "0")}`;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-7 text-center text-white">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                        {checking ? (
                            <LoaderCircle className="h-7 w-7 animate-spin" />
                        ) : registered ? (
                            <LockKeyhole className="h-7 w-7" />
                        ) : (
                            <ShieldCheck className="h-7 w-7" />
                        )}
                    </div>

                    <h1 className="mt-4 text-xl font-bold">
                        {checking
                            ? "Checking Security PIN"
                            : registered
                                ? "Enter Your Security PIN"
                                : "Register Your Security PIN"}
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-blue-100">
                        {checking
                            ? "Please wait while we check your account."
                            : registered
                                ? `Enter the 6-digit PIN registered to your ${accountType.toLowerCase()} account.`
                                : `Create a 6-digit PIN to protect your ${accountType.toLowerCase()} dashboard.`}
                    </p>
                </div>

                <div className="p-6">
                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {checking ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
                            Checking your PIN...
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                        >
                            <label
                                htmlFor="account-pin"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                {registered
                                    ? "Security PIN"
                                    : "Create PIN"}
                            </label>

                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                                <input
                                    id="account-pin"
                                    type={
                                        showPin
                                            ? "text"
                                            : "password"
                                    }
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={pin}
                                    onChange={(event) => {
                                        setPin(
                                            cleanPin(
                                                event.target.value,
                                            ),
                                        );
                                        setError("");
                                    }}
                                    maxLength={6}
                                    placeholder="••••••"
                                    disabled={
                                        submitting ||
                                        secondsLeft > 0
                                    }
                                    autoFocus
                                    className={`${inputClass} pl-12 pr-12`}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPin(
                                            (current) =>
                                                !current,
                                        )
                                    }
                                    aria-label={
                                        showPin
                                            ? "Hide PIN"
                                            : "Show PIN"
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                >
                                    {showPin ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>

                            {!registered && (
                                <div className="mt-4">
                                    <label
                                        htmlFor="confirm-account-pin"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Confirm PIN
                                    </label>

                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                                        <input
                                            id="confirm-account-pin"
                                            type={
                                                showConfirmPin
                                                    ? "text"
                                                    : "password"
                                            }
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            value={confirmPin}
                                            onChange={(
                                                event,
                                            ) => {
                                                setConfirmPin(
                                                    cleanPin(
                                                        event.target
                                                            .value,
                                                    ),
                                                );
                                                setError("");
                                            }}
                                            maxLength={6}
                                            placeholder="••••••"
                                            disabled={
                                                submitting
                                            }
                                            className={`${inputClass} pl-12 pr-12`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPin(
                                                    (current) =>
                                                        !current,
                                                )
                                            }
                                            aria-label={
                                                showConfirmPin
                                                    ? "Hide PIN confirmation"
                                                    : "Show PIN confirmation"
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            {showConfirmPin ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!registered && (
                                <div className="mt-4 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-700">
                                    Remember this PIN. You
                                    will need it whenever you
                                    sign in to your account.
                                    Avoid sequential or repeated
                                    numbers.
                                </div>
                            )}

                            {secondsLeft > 0 && (
                                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
                                    Try again in{" "}
                                    <strong>
                                        {formatRemainingTime()}
                                    </strong>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    secondsLeft > 0 ||
                                    pin.length !== 6 ||
                                    (!registered &&
                                        confirmPin.length !==
                                        6)
                                }
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4" />
                                )}

                                {submitting
                                    ? "Please wait..."
                                    : registered
                                        ? "Unlock Dashboard"
                                        : "Register PIN"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}