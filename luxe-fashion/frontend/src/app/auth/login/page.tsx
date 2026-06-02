"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import {
  getDefaultAdminLanding,
  isStaffRole,
} from "@/lib/rbac/permissions";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const registerSchema = loginSchema
  .extend({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const [mode, setMode] = useState<"login" | "register">(
    searchParams?.get("mode") === "register" ? "register" : "login",
  );
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const regForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      const redirect = searchParams?.get("redirect");
      const me = await authApi.getMe();
      const role = me.data?.role;
      if (redirect && redirect.startsWith("/admin") && isStaffRole(role)) {
        router.push(redirect);
      } else if (isStaffRole(role)) {
        router.push(getDefaultAdminLanding(role));
      } else {
        router.push("/profile");
      }
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { data: res } = await authApi.register(data);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      toast.success("Account created! Please verify your email.");
      router.push("/profile");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="label-small block mb-2">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-950 dark:bg-brand-900 items-center justify-center p-16">
        <div className="text-center">
          <Link
            href="/"
            className="font-serif text-5xl font-light tracking-[0.3em] uppercase text-white block mb-8"
          >
            ZANE
          </Link>
          <p className="text-brand-400 text-lg leading-relaxed max-w-xs">
            Premium contemporary fashion for the modern individual.
          </p>
          <div className="mt-12 w-16 h-0.5 bg-brand-600 mx-auto" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <Link
            href="/"
            className="font-serif text-3xl font-light tracking-[0.3em] uppercase text-brand-900 dark:text-white block mb-10 lg:hidden text-center"
          >
            ZANE
          </Link>

          {/* Tabs */}
          <div className="flex mb-8 border-b border-brand-200 dark:border-brand-700">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 pb-3 text-sm tracking-widest uppercase transition-all ${mode === m ? "text-brand-900 dark:text-white border-b-2 border-brand-900 dark:border-white -mb-px" : "text-brand-400 hover:text-brand-700 dark:hover:text-brand-200"}`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-5"
            >
              <Field
                label="Email"
                error={loginForm.formState.errors.email?.message}
              >
                <input
                  {...loginForm.register("email")}
                  type="email"
                  className="input-field"
                  placeholder="your@email.com"
                />
              </Field>
              <Field
                label="Password"
                error={loginForm.formState.errors.password?.message}
              >
                <div className="relative">
                  <input
                    {...loginForm.register("password")}
                    type={showPw ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-0 top-3 text-brand-400 hover:text-brand-700 dark:hover:text-white transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={regForm.handleSubmit(onRegister)}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First Name"
                  error={regForm.formState.errors.firstName?.message}
                >
                  <input
                    {...regForm.register("firstName")}
                    className="input-field"
                  />
                </Field>
                <Field
                  label="Last Name"
                  error={regForm.formState.errors.lastName?.message}
                >
                  <input
                    {...regForm.register("lastName")}
                    className="input-field"
                  />
                </Field>
              </div>
              <Field
                label="Email"
                error={regForm.formState.errors.email?.message}
              >
                <input
                  {...regForm.register("email")}
                  type="email"
                  className="input-field"
                  placeholder="your@email.com"
                />
              </Field>
              <Field
                label="Password"
                error={regForm.formState.errors.password?.message}
              >
                <div className="relative">
                  <input
                    {...regForm.register("password")}
                    type={showPw ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-0 top-3 text-brand-400 hover:text-brand-700 dark:hover:text-white transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field
                label="Confirm Password"
                error={regForm.formState.errors.confirmPassword?.message}
              >
                <input
                  {...regForm.register("confirmPassword")}
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                />
              </Field>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
              <p className="text-xs text-brand-500 text-center">
                By registering you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline hover:text-brand-900 dark:hover:text-white transition-colors"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-brand-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
