import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Mail, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in · BluePlug" },
      { name: "description", content: "Sign in to the BluePlug manager console." },
    ],
  }),
});

function LoginPage() {
  const [method, setMethod] = useState<"otp" | "password">("otp");
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-70"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">BluePlug</span>
        </Link>

        <div className="mt-10">
          <h1 className="text-[28px] font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Sign in to manage your campsite pitches.
          </p>
        </div>

        {/* Segmented */}
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-secondary p-1">
          {(["otp", "password"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`bp-tap rounded-lg py-2.5 text-[13.5px] font-medium ${
                method === m
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground"
              }`}
            >
              {m === "otp" ? "Email code" : "Password"}
            </button>
          ))}
        </div>

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Email
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 focus-within:ring-2 focus-within:ring-ring">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@campsite.com"
                className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </label>

          {method === "password" && (
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 focus-within:ring-2 focus-within:ring-ring">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full bg-transparent text-[15px] outline-none"
                />
              </div>
            </label>
          )}

          <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[13.5px] font-medium">Remember this device</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={remember}
              onClick={() => setRemember(!remember)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                remember ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  remember ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>

          <button
            type="submit"
            className="bp-tap mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow"
          >
            {method === "otp" ? "Send code" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-auto pt-8 text-center text-[11.5px] text-muted-foreground">
          Guest? Just scan the QR on your pitch — no login needed.
        </p>
      </div>
    </div>
  );
}
