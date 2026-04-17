import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // Query custom "users" table — no Supabase Auth used
      const { data, error } = await supabase
        .from("users")
        .select("id,email,password,role,hospital_id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error("DB query error:", error);
        toast.error("Database error — check console");
        return;
      }

      if (!data) {
        toast.error("Account not found");
        return;
      }

      // Plain-text password comparison (hash in production)
      if (data.password !== password) {
        toast.error("Incorrect password");
        return;
      }

      // ── Store full session in localStorage ─────────────────────────────────
      localStorage.setItem("user_id", data.id ?? "");
      localStorage.setItem("user_email", data.email ?? "");
      localStorage.setItem("user_role", String(data.role ?? ""));
      localStorage.setItem("hospital_id", data.hospital_id ?? "");

      toast.success("Login successful");

      // ── Role-based redirect ────────────────────────────────────────────────
      const role = String(data.role ?? "").toLowerCase();
      if (role === "patient" || role === "0") navigate("/patient");
      else if (role === "doctor" || role === "3") navigate("/doctor");
      else if (role === "reception" || role === "2") navigate("/reception");
      else if (role === "queue_admin") navigate("/queue-admin");
      else navigate("/super-admin"); // admin / unknown

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Connection failure — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-6">
            <span className="text-white font-black text-3xl">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to your InclusyQ account</p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hospital.com"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <Link to="/forgot-password" title="Forgot Password" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base font-bold shadow-lg shadow-primary/20"
                disabled={loading}
                onClick={() => console.log("Login form button clicked")}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          Don't have an account? <Link to="/support" className="font-bold text-primary hover:underline">Contact sales</Link>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mocked for custom table implementation
      console.log(`Reset requested for: ${email}`);
      toast.info("Password reset instructions have been sent to your administrator.");
    } catch (error: any) {
      toast.error("Could not process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-6">
            <span className="text-white font-black text-3xl">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-slate-500 mt-2">Enter your email and contact your admin to reset password</p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardContent className="pt-6">
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hospital.com"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base font-bold shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Reset"}
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-11 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Back to Login
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}