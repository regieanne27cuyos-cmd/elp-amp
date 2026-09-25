import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import loginBg from "../assets/school-login-bg.jpg";
import logo from "../assets/ejist-primary-logo.png";
import { supabase } from "../lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError("Incorrect email or password.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("id", data.user.id)
        .single();

      const allowedRoles = ["admin", "super_admin"];

      if (
        profileError ||
        !profile ||
        !allowedRoles.includes(profile.role) ||
        profile.status !== "active"
      ) {
        await supabase.auth.signOut();
        setError("This account does not have administrator access.");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      console.error("Admin login failed:", error);
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-6 right-6 text-sm text-white underline underline-offset-4 hover:text-gray-200 transition-colors"
      >
        Back to student login
      </button>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Ejist logo" className="w-100 h-100 object-contain mb-3" />
          <div className="flex items-center gap-1.5 bg-slate-800/80 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Access
          </div>
          <h1 className="text-2xl font-bold text-white">ELP-AMP</h1>
          <p className="text-sm text-gray-200 mt-1">
            Sign in to the admin console
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Admin email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ejist.edu.ph"
                  className="w-full bg-gray-50 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-xs text-slate-600 font-medium hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-gray-50 rounded-lg pl-9 pr-10 py-2.5 text-sm outline-none border border-transparent focus:border-slate-300 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Not an admin?{" "}
            <a href="/" className="text-slate-700 font-medium hover:underline">
              Go to student/teacher login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}