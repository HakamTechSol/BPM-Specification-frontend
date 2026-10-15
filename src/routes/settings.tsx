import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, SwitchRow } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSettings, updateSettings, type ManagerSettings, type Eigenaar } from "@/lib/api";
import {
  changeLabels,
  hasChanges as settingsHaveChanges,
  normalizeSettings,
  normalizeValues,
  settingsFromApi,
  type SettingsShape,
} from "@/lib/settingsDraft";
import {
  Mail,
  Building2,
  MapPin,
  Phone,
  Globe,
  FileText,
  Zap,
  ShieldCheck,
  Check,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Instellingen Â· BluePlug" },
      { name: "description", content: "Configure your campsite defaults and preferences." },
    ],
  }),
});

const EMPTY_SETTINGS: SettingsShape = {
  naam: "",
  straat: "",
  nummer: "",
  postcode: "",
  plaats: "",
  land: "",
  telefoon: "",
  email: "",
  website: "",
  kvk: "",
  btwNummer: "",
  sessionDurationDays: 30,
  stroominstelling: [],
  vrijverbruikinstelling: [],
};

/**
 * Compact form row: icon, label and control on a single line, also on mobile,
 * so a long form needs far less scrolling. The control keeps a 40px height so
 * it stays comfortable to tap.
 */
function FieldRow({
  icon: Icon,
  label,
  hint,
  labelClassName = "min-w-0 flex-1",
  children,
}: {
  icon: typeof Mail;
  label: string;
  hint?: string;
  /** Narrow the label column when the control needs the extra width. */
  labelClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className={labelClassName}>
        <div className="text-[13.5px] font-semibold leading-tight">{label}</div>
        {hint && <div className="text-[11.5px] leading-tight text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

/** Text/number field sized for the compact rows: 40px tall, fixed width on mobile. */
const FIELD_INPUT =
  "h-10 rounded-lg border border-input bg-card px-2.5 text-[14px] outline-none focus:ring-2 focus:ring-ring";
/** Single-line field that sits at the right of a row. */
const ROW_INPUT = `${FIELD_INPUT} w-32 shrink-0 text-right sm:w-auto sm:flex-1`;

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // "saved" is the last value confirmed with the backend; "draft" is what the
  // form currently shows. Every edit touches only the draft, Opslaan sends
  // just the changed fields, and Annuleren throws the draft away.
  const [saved, setSaved] = useState<SettingsShape>(EMPTY_SETTINGS);
  const [draft, setDraft] = useState<SettingsShape>(EMPTY_SETTINGS);

  const isDirty = settingsHaveChanges(saved, draft);
  const pendingChanges = changeLabels(saved, draft);

  function updateDraft(patch: Partial<SettingsShape>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleCancel() {
    setDraft(saved);
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        const loaded = settingsFromApi(data);
        setSaved(loaded);
        setDraft(loaded);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    // Normalize first, then persist the normalized shape as the new saved
    // state, so the comparison stays stable and Opslaan greys out again.
    const next = normalizeSettings(draft);
    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");
    try {
      await updateSettings({
        eigenaar: {
          naam: next.naam || undefined,
          straat: next.straat || undefined,
          nummer: next.nummer || undefined,
          postcode: next.postcode || undefined,
          plaats: next.plaats || undefined,
          land: next.land || undefined,
          telefoon: next.telefoon || undefined,
          email: next.email || undefined,
          website: next.website || undefined,
          kvk: next.kvk || undefined,
          "btw-nummer": next.btwNummer || undefined,
        },
        sessionDurationDays: next.sessionDurationDays,
        stroominstelling: next.stroominstelling,
        vrijverbruikinstelling: next.vrijverbruikinstelling,
      });
      setSaved(next);
      setDraft(next);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerLayout
      title="Instellingen"
      subtitle="Configureer uw standaardinstellingen"
      right={
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={saving || loading || !isDirty}
            className="bp-tap flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
            aria-label="Annuleren"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
            className="bp-tap flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
            aria-label="Opslaan"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </button>
          <ThemeToggle />
        </div>
      }
      noScroll={true}
    >
      <div className="flex flex-col gap-2 max-w-4xl mx-auto w-full flex-1 overflow-y-auto pb-24 pt-3">
        <SectionLabel>Bedrijfsgegevens</SectionLabel>
        <Card className="divide-y divide-border">
          <FieldRow icon={Building2} label="Bedrijfsnaam">
            <input
              type="text"
              value={draft.naam}
              onChange={(e) => updateDraft({ naam: e.target.value })}
              className={ROW_INPUT}
              aria-label="Bedrijfsnaam"
            />
          </FieldRow>

          <FieldRow icon={MapPin} label="Adres" labelClassName="w-12 shrink-0">
            <div className="flex min-w-0 flex-1 gap-2">
              <input
                type="text"
                value={draft.straat}
                onChange={(e) => updateDraft({ straat: e.target.value })}
                placeholder="Straat"
                className={`${FIELD_INPUT} min-w-0 flex-1`}
                aria-label="Straat"
              />
              <input
                type="text"
                value={draft.nummer}
                onChange={(e) => updateDraft({ nummer: e.target.value })}
                placeholder="Nr"
                className={`${FIELD_INPUT} w-16 shrink-0 text-center`}
                aria-label="Huisnummer"
              />
            </div>
          </FieldRow>

          <FieldRow icon={MapPin} label="Postcode">
            <input
              type="text"
              value={draft.postcode}
              onChange={(e) => updateDraft({ postcode: e.target.value })}
              className={ROW_INPUT}
              aria-label="Postcode"
            />
          </FieldRow>

          <FieldRow icon={MapPin} label="Plaats">
            <input
              type="text"
              value={draft.plaats}
              onChange={(e) => updateDraft({ plaats: e.target.value })}
              className={ROW_INPUT}
              aria-label="Plaats"
            />
          </FieldRow>

          <FieldRow icon={MapPin} label="Land">
            <input
              type="text"
              value={draft.land}
              onChange={(e) => updateDraft({ land: e.target.value })}
              className={ROW_INPUT}
              aria-label="Land"
            />
          </FieldRow>

          <FieldRow icon={Phone} label="Telefoon">
            <input
              type="tel"
              value={draft.telefoon}
              onChange={(e) => updateDraft({ telefoon: e.target.value })}
              className={ROW_INPUT}
              aria-label="Telefoon"
            />
          </FieldRow>

          <FieldRow icon={Mail} label="E-mailadres">
            <input
              type="email"
              value={draft.email}
              onChange={(e) => updateDraft({ email: e.target.value })}
              className={ROW_INPUT}
              aria-label="E-mailadres"
            />
          </FieldRow>

          <FieldRow icon={Globe} label="Website">
            <input
              type="url"
              value={draft.website}
              onChange={(e) => updateDraft({ website: e.target.value })}
              className={ROW_INPUT}
              aria-label="Website"
            />
          </FieldRow>

          <FieldRow icon={FileText} label="KVK-nummer">
            <input
              type="text"
              value={draft.kvk}
              onChange={(e) => updateDraft({ kvk: e.target.value })}
              className={ROW_INPUT}
              aria-label="KVK-nummer"
            />
          </FieldRow>

          <FieldRow icon={FileText} label="BTW-nummer">
            <input
              type="text"
              value={draft.btwNummer}
              onChange={(e) => updateDraft({ btwNummer: e.target.value })}
              className={ROW_INPUT}
              aria-label="BTW-nummer"
            />
          </FieldRow>
        </Card>

        <SectionLabel>Stroom overschrijding</SectionLabel>
        <Card className="p-3">
          <div className="mb-2 text-[12.5px] text-muted-foreground">
            Beschikbare stroomopties systeembreed
          </div>
          <ValueListEditor
            values={draft.stroominstelling}
            onChange={(next) => updateDraft({ stroominstelling: next })}
            unit="A"
            rowLabel="Stroomwaarde"
            newLabel="Nieuwe stroomwaarde"
            icon={Zap}
          />
        </Card>

        <SectionLabel>Vrij verbruik</SectionLabel>
        <Card className="p-3">
          <div className="mb-2 text-[12.5px] text-muted-foreground">
            Dagelijkse gratis verbruiksopties (kWh)
          </div>
          <ValueListEditor
            values={draft.vrijverbruikinstelling}
            onChange={(next) => updateDraft({ vrijverbruikinstelling: next })}
            unit="kWh"
            rowLabel="Verbruikswaarde"
            newLabel="Nieuwe verbruikswaarde"
            icon={ShieldCheck}
          />
        </Card>

        <SectionLabel>Sessieduur</SectionLabel>
        <Card className="p-3">
          <FieldRow
            icon={ShieldCheck}
            label="Onthoud apparaat duur"
            hint="Aantal dagen dat een apparaat onthouden wordt"
          >
            <div className="flex shrink-0 items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={365}
                step={1}
                value={draft.sessionDurationDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v))
                    updateDraft({ sessionDurationDays: Math.max(1, Math.min(365, v)) });
                }}
                className={`${FIELD_INPUT} w-16 text-center font-semibold tabular-nums`}
                aria-label="Sessieduur in dagen"
              />
              <span className="text-[13px] font-medium text-muted-foreground">dagen</span>
            </div>
          </FieldRow>
        </Card>

        {isDirty && (
          <div className="flex items-start justify-center gap-2 rounded-2xl bg-warning-soft px-3 py-2.5 text-center">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span className="text-[13px] font-medium text-warning">
              Niet opgeslagen: {pendingChanges.join(", ")}
            </span>
          </div>
        )}

        {saveStatus === "success" && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-success-soft py-3 text-center">
            <Check className="h-5 w-5 text-success" />
            <span className="text-[14px] font-semibold text-success">Instellingen opgeslagen</span>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-destructive-soft py-3 text-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-[14px] font-semibold text-destructive">
              {errorMessage || "Opslaan mislukt"}
            </span>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 sm:px-5 lg:px-8 shrink-0 hidden lg:block">
        <div className="mx-auto max-w-4xl w-full">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancel}
              disabled={saving || loading || !isDirty}
              className="bp-tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" /> Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !isDirty}
              className="bp-tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
              {saving ? "Bezig met opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}

function ValueListEditor({
  values,
  onChange,
  unit,
  rowLabel,
  newLabel,
  icon: Icon,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  unit: string;
  rowLabel: string;
  newLabel: string;
  icon: typeof Zap;
}) {
  const [draft, setDraft] = useState("");

  const editValue = (index: number, raw: string) => {
    const next = [...values];
    next[index] = raw;
    onChange(next);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const addValue = () => {
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(n)) return;
    if (!values.some((v) => Number(v) === n)) {
      onChange([...values, String(n)]);
    }
    setDraft("");
  };

  const addDisabled = draft.trim() === "" || !Number.isFinite(Number(draft));

  return (
    <div className="space-y-1.5">
      {values.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground">
          Geen waarden ingesteld
        </div>
      )}

      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <input
            type="number"
            min={0}
            step={0.1}
            value={value}
            onChange={(e) => editValue(index, e.target.value)}
            className={`${FIELD_INPUT} min-w-0 flex-1 text-center font-semibold tabular-nums`}
            aria-label={`${rowLabel} ${index + 1}`}
          />
          <span className="w-8 shrink-0 text-[12.5px] font-medium text-muted-foreground">
            {unit}
          </span>
          <button
            type="button"
            onClick={() => removeValue(index)}
            aria-label={`Verwijder ${rowLabel} ${value} ${unit}`}
            className="bp-tap grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 border-t border-border pt-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Plus className="h-4 w-4" />
        </div>
        <input
          type="number"
          min={0}
          step={0.1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={`${newLabel} (bijv. 6.5)`}
          className={`${FIELD_INPUT} min-w-0 flex-1 text-center font-semibold tabular-nums placeholder:font-normal placeholder:text-muted-foreground/70`}
          aria-label={newLabel}
        />
        <span className="w-8 shrink-0 text-[12.5px] font-medium text-muted-foreground">{unit}</span>
        <button
          type="button"
          onClick={addValue}
          disabled={addDisabled}
          className="bp-tap inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Toevoegen
        </button>
      </div>
    </div>
  );
}
