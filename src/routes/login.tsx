import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Mail, KeyRound, ArrowRight, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { login, setToken } from "@/lib/api";

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
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Vul uw gebruikersnaam en wachtwoord in");
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(email, password, remember);
      setToken(res.token);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login mislukt");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8 sm:max-w-lg md:max-w-xl lg:max-w-2xl lg:px-12 lg:py-16">
        <Link
          to="/"
          className="flex items-center gap-2.5 p-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">BluePlug</span>
        </Link>

        <div className="mt-10 lg:mt-16">
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px] lg:text-[36px]">Welkom terug</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground sm:text-[15px] lg:text-[16px]">
            Log in om uw kampeerplaatsen te beheren.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive-soft px-4 py-3 text-[13px] font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form
          className="mt-5 space-y-3 w-full"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
              Gebruikersnaam
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 focus-within:ring-2 focus-within:ring-ring">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
              Wachtwoord
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 focus-within:ring-2 focus-within:ring-ring">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full bg-transparent text-[15px] outline-none"
              />
            </div>
          </label>

          <div className="mt-1 flex items-center gap-2.5">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked as boolean)}
              className="h-5 w-5"
            />
            <label
              htmlFor="remember"
              className="flex items-center gap-2.5 cursor-pointer text-[14px] font-medium"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Onthoud dit apparaat
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bp-tap mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Inloggen
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-auto pt-8 text-center text-[12px] text-muted-foreground">
          Gast? Scan de QR-code op uw plaats — geen login nodig.
        </p>
      </div>
    </div>
  );
}
