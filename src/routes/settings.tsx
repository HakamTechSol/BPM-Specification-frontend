import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel } from "@/components/bp";
import {
  Mail,
  CreditCard,
  Clock,
  Zap,
  Languages,
  Moon,
  Wrench,
  Check,
  ChevronRight,
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

  return (
    <ManagerLayout
      title="Settings"
      subtitle="Configure your campsite defaults"
    >
      <SectionLabel>Account</SectionLabel>
      <Card className="divide-y divide-border">
        <SettingRow icon={Mail} label="Email">
          <input
            type="email"
            defaultValue="jonas@duinrand.nl"
            className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
          />
        </SettingRow>
        <SettingRow icon={CreditCard} label="Payment settings" chevron>
          <span className="text-[13px] text-muted-foreground">Stripe · Live</span>
        </SettingRow>
      </Card>

      <SectionLabel>Session defaults</SectionLabel>
      <Card className="divide-y divide-border">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold">Session duration</div>
              <div className="text-[12px] text-muted-foreground">
                Default check-in length
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`bp-tap h-11 rounded-lg text-[12.5px] font-semibold ${
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
                Applied to new pitches
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DEFAULT_AMPS.map((a) => (
              <button
                key={a}
                onClick={() => setAmp(a)}
                className={`bp-tap h-12 rounded-lg text-[14px] font-semibold ${
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

      <SectionLabel>Preferences</SectionLabel>
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
          label="Theme"
          value={theme}
          options={THEMES as unknown as readonly string[]}
          onChange={(v) => setTheme(v as typeof theme)}
        />
        <div className="flex items-center gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning-soft text-warning">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">Maintenance mode</div>
            <div className="text-[12px] text-muted-foreground">
              Temporarily disable guest resets
            </div>
          </div>
          <button
            role="switch"
            aria-checked={maintenance}
            onClick={() => setMaintenance(!maintenance)}
            className={`bp-tap relative h-7 w-12 rounded-full transition-colors ${
              maintenance ? "bg-warning" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                maintenance ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </Card>

      <button className="bp-tap mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow">
        <Check className="h-4 w-4" /> Save settings
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
            className="bp-tap flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-[14px] hover:bg-muted"
          >
            <span>{o}</span>
            {value === o && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </div>
    </details>
  );
}
