import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, SwitchRow } from "@/components/bp";
import {
  Mail,
  CreditCard,
  Building2,
  Clock,
  Zap,
  Languages,
  Moon,
  Wrench,
  Check,
  ChevronRight,
  Save,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings · BluePlug" },
      { name: "description", content: "Configure your campsite defaults and preferences." },
    ],
  }),
});

const DURATIONS = ["1 h", "4 h", "12 h", "1 day", "7 days"] as const;
const DEFAULT_AMPS = [4, 6, 10, 16] as const;
const LANGS = ["English", "Deutsch", "Nederlands", "Français"] as const;
const THEMES = ["Light", "Dark", "System"] as const;

function SettingsPage() {
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>("1 day");
  const [amp, setAmp] = useState<(typeof DEFAULT_AMPS)[number]>(10);
  const [lang, setLang] = useState<(typeof LANGS)[number]>("English");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("System");
  const [maintenance, setMaintenance] = useState(false);
  const [email, setEmail] = useState("jonas@duinrand.nl");
  const [bankAccount, setBankAccount] = useState("NL91 ABNA 0417 1643 00");
  const [paymentId, setPaymentId] = useState("STR_pi_3Qr...");

  return (
    <ManagerLayout title="Settings" subtitle="Configure your campsite defaults">
      <SectionLabel>Account</SectionLabel>
      <Card className="divide-y divide-border">
        <div className="flex items-center gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">Email</div>
            <div className="text-[12px] text-muted-foreground">E-mailadres</div>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
            aria-label="Email address"
          />
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">Bank account</div>
            <div className="text-[12px] text-muted-foreground">Bankrekening</div>
          </div>
          <input
            type="text"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
            aria-label="Bank account number"
          />
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">Payment ID</div>
            <div className="text-[12px] text-muted-foreground">Betaal-ID</div>
          </div>
          <input
            type="text"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] font-mono outline-none focus:ring-2 focus:ring-ring"
            aria-label="Payment ID"
          />
        </div>
      </Card>

      <SectionLabel>Session defaults (Standaardwaarden)</SectionLabel>
      <Card className="divide-y divide-border">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold">Session duration</div>
              <div className="text-[12px] text-muted-foreground">
                Default check-in length · Standaard duur
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`bp-tap h-12 rounded-lg text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  duration === d
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold">Default current</div>
              <div className="text-[12px] text-muted-foreground">
                Applied to new pitches · Nieuwe plaatsen
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DEFAULT_AMPS.map((a) => (
              <button
                key={a}
                onClick={() => setAmp(a)}
                className={`bp-tap h-12 rounded-lg text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  amp === a
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground"
                }`}
              >
                {a} A
              </button>
            ))}
          </div>
        </div>
      </Card>

      <SectionLabel>Preferences (Voorkeuren)</SectionLabel>
      <Card className="divide-y divide-border">
        <PickerRow
          icon={Languages}
          label="Language"
          value={lang}
          options={LANGS as unknown as readonly string[]}
          onChange={(v) => setLang(v as typeof lang)}
        />
        <PickerRow
          icon={Moon}
          label="Theme (Thema)"
          value={theme}
          options={THEMES as unknown as readonly string[]}
          onChange={(v) => setTheme(v as typeof theme)}
        />
        <SwitchRow
          icon={Wrench}
          label="Maintenance mode"
          description="Temporarily disable guest resets · Gast-reset uitschakelen"
          checked={maintenance}
          onCheckedChange={setMaintenance}
          iconBg="bg-warning-soft text-warning"
        />
      </Card>

      <button className="bp-tap mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Save className="h-4 w-4" /> Save settings (Opslaan)
      </button>
    </ManagerLayout>
  );
}

function SettingRow({
  icon: Icon,
  label,
  children,
  chevron,
}: {
  icon: typeof Mail;
  label: string;
  children?: ReactNode;
  chevron?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-[14px] font-semibold">{label}</div>
      <div className="flex min-w-0 items-center gap-2">
        {children}
        {chevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  );
}

function PickerRow({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 text-[14px] font-semibold">{label}</div>
        <span className="text-[13px] text-muted-foreground">{value}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="border-t border-border p-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={(e) => {
              onChange(o);
              (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
            }}
            className="bp-tap flex w-full items-center justify-between rounded-lg px-3 min-h-[44px] text-left text-[14px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>{o}</span>
            {value === o && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </div>
    </details>
  );
}
