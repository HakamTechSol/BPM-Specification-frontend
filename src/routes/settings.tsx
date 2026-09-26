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
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full flex-1 overflow-y-auto pb-24 pt-5">
        <SectionLabel>Bedrijfsgegevens</SectionLabel>
        <Card className="divide-y divide-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Bedrijfsnaam</div>
            </div>
            <input
              type="text"
              value={draft.naam}
              onChange={(e) => updateDraft({ naam: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="Bedrijfsnaam"
            />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">Adres</div>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={draft.straat}
                onChange={(e) => updateDraft({ straat: e.target.value })}
                placeholder="Straat"
                className="h-12 flex-1 min-w-0 rounded-lg border border-input bg-card px-3 text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
                aria-label="Straat"
              />
              <input
                type="text"
                value={draft.nummer}
                onChange={(e) => updateDraft({ nummer: e.target.value })}
                placeholder="Nr"
                className="h-12 w-20 rounded-lg border border-input bg-card px-3 text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
                aria-label="Huisnummer"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Postcode</div>
            </div>
            <input
              type="text"
              value={draft.postcode}
              onChange={(e) => updateDraft({ postcode: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="Postcode"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Plaats</div>
            </div>
            <input
              type="text"
              value={draft.plaats}
              onChange={(e) => updateDraft({ plaats: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="Plaats"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Land</div>
            </div>
            <input
              type="text"
              value={draft.land}
              onChange={(e) => updateDraft({ land: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="Land"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Telefoon</div>
            </div>
            <input
              type="tel"
              value={draft.telefoon}
              onChange={(e) => updateDraft({ telefoon: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="Telefoon"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">E-mailadres</div>
            </div>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => updateDraft({ email: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="E-mailadres"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Website</div>
              <div className="text-[12px] text-muted-foreground">Website</div>
            </div>
            <input
              type="url"
              value={draft.website}
              onChange={(e) => updateDraft({ website: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="Website"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">KVK-nummer</div>
            </div>
            <input
              type="text"
              value={draft.kvk}
              onChange={(e) => updateDraft({ kvk: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="KVK-nummer"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">BTW-nummer</div>
            </div>
            <input
              type="text"
              value={draft.btwNummer}
              onChange={(e) => updateDraft({ btwNummer: e.target.value })}
              className="h-12 w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-card px-3 text-right text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
              aria-label="BTW-nummer"
            />
          </div>
        </Card>

        <SectionLabel>Stroom overschrijding</SectionLabel>
        <Card className="p-4">
          <div className="mb-3 text-[13px] text-muted-foreground">
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
        <Card className="p-4">
          <div className="mb-3 text-[13px] text-muted-foreground">
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
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Onthoud apparaat duur</div>
              <div className="text-[12px] text-muted-foreground">
                Aantal dagen dat een ingelogd apparaat onthouden wordt
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                className="h-12 w-24 rounded-lg border border-input bg-card px-3 text-center text-[13.5px] font-semibold outline-none focus:ring-2 focus:ring-ring tabular-nums"
                aria-label="Sessieduur in dagen"
              />
              <span className="text-[13px] font-medium text-muted-foreground">dagen</span>
            </div>
          </div>
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
    <div className="space-y-2">
      {values.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-3 py-3 text-[13px] text-muted-foreground">
          Geen waarden ingesteld
        </div>
      )}

      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <input
            type="number"
            min={0}
            step={0.1}
            value={value}
            onChange={(e) => editValue(index, e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-center text-[13.5px] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring"
            aria-label={`${rowLabel} ${index + 1}`}
          />
          <span className="w-10 shrink-0 text-[13px] font-medium text-muted-foreground">
            {unit}
          </span>
          <button
            type="button"
            onClick={() => removeValue(index)}
            aria-label={`Verwijder ${rowLabel} ${value} ${unit}`}
            className="bp-tap grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
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
          className="h-12 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-center text-[13.5px] font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring"
          aria-label={newLabel}
        />
        <span className="w-10 shrink-0 text-[13px] font-medium text-muted-foreground">{unit}</span>
        <button
          type="button"
          onClick={addValue}
          disabled={addDisabled}
          className="bp-tap inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Toevoegen
        </button>
      </div>
    </div>
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
