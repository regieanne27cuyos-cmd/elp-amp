// src/pages/school-login.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import loginBg from "../assets/school-login-bg.jpg";
import logo from "../assets/ejist-primary-logo.png";

const roleRoutes = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
};

export default function SchoolLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function getUserProfile(userId) {
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, email, role, status")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      throw new Error(
        "Unable to check your school account.",
      );
    }

    if (!profile) {
      throw new Error(
        "Your account profile was not found. Please contact the school administrator.",
      );
    }

    return profile;
  }

  async function redirectByRole(userId) {
    const profile = await getUserProfile(userId);

    if (profile.status !== "active") {
      await supabase.auth.signOut({
        scope: "local",
      });

      throw new Error(
        "Your account is inactive. Please contact the school administrator.",
      );
    }

    const destination = roleRoutes[profile.role];

    if (!destination) {
      await supabase.auth.signOut({
        scope: "local",
      });

      if (
        profile.role === "admin" ||
        profile.role === "super_admin"
      ) {
        throw new Error(
          "Administrator accounts must use the Admin Console.",
        );
      }

      throw new Error(
        "Your account does not have a valid student or teacher role.",
      );
    }

    navigate(destination, {
      replace: true,
    });
  }

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!active) return;

        if (session?.user) {
          await redirectByRole(session.user.id);
        }
      } catch (sessionCheckError) {
        console.error(
          "Session check failed:",
          sessionCheckError,
        );

        if (active) {
          setError(
            sessionCheckError.message ||
              "Unable to check your current session.",
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const {
        data: signInData,
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!signInData.user) {
        throw new Error(
          "The login did not return a user account.",
        );
      }

      await redirectByRole(signInData.user.id);
    } catch (loginError) {
      console.error("School login failed:", loginError);

      const message =
        loginError.message?.toLowerCase() || "";

      if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
      ) {
        setError("Incorrect email or password.");
      } else if (
        message.includes("email not confirmed")
      ) {
        setError(
          "Your email address has not been confirmed.",
        );
      } else {
        setError(
          loginError.message ||
            "Unable to sign in. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgotPassword() {
    setError(
      "Please contact your school administrator to reset your password.",
    );
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage: `url(${loginBg})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <button
        type="button"
        onClick={() => navigate("/admin/login")}
        className="absolute right-6 top-6 z-10 text-sm text-white underline underline-offset-4 transition-colors hover:text-gray-200"
      >
        Admin Console
      </button>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <img
            src={logo}
            alt="EJIST logo"
            className="mb-3 h-36 w-36 object-contain"
          />

          <h1 className="text-2xl font-bold text-white">
            ELP-AMP
          </h1>

          <p className="mt-1 text-sm text-gray-200">
            Sign in to your school account
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="school-email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                School email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="school-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="student@ejist.edu.ph"
                  autoComplete="email"
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-transparent bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-blue-200 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="school-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={submitting}
                  className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="school-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-transparent bg-gray-50 py-2.5 pl-9 pr-10 text-sm outline-none transition-colors focus:border-blue-200 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  disabled={submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-60"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}

              {submitting
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() =>
                setError(
                  "Please contact your school administrator to request an account.",
                )
              }
              className="font-medium text-blue-600 hover:underline"
            >
              Contact your school admin
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}