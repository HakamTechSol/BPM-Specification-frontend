import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { ManagerLayout } from "@/components/manager-layout";
import { Card, SectionLabel, SwitchRow } from "@/components/bp";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSettings, updateSettings, type ManagerSettings, type Eigenaar } from "@/lib/api";
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
      { title: "Instellingen · BluePlug" },
      { name: "description", content: "Configure your campsite defaults and preferences." },
    ],
  }),
});


// Fully custom numeric option lists (any values, including decimals).
// Keeps the first string representation per numeric value, sorted ascending.
function normalizeValues(list: string[]): string[] {
  const seen = new Map<number, string>();
  for (const v of list) {
    const raw = String(v).trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    if (!seen.has(n)) seen.set(n, raw);
  }
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, raw]) => raw);
}

type SettingsShape = {
  naam: string;
  straat: string;
  nummer: string;
  postcode: string;
  plaats: string;
  land: string;
  telefoon: string;
  email: string;
  website: string;
  kvk: string;
  btwNummer: string;
  sessionDurationDays: number;
  stroominstelling: string[];
  vrijverbruikinstelling: string[];
};

// Stable key for change detection (array order does not matter).
function settingsKey(s: SettingsShape): string {
  return JSON.stringify({
    ...s,
    stroominstelling: [...s.stroominstelling].sort(),
    vrijverbruikinstelling: [...s.vrijverbruikinstelling].sort(),
  });
}

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Eigenaar fields
  const [naam, setNaam] = useState("");
  const [straat, setStraat] = useState("");
  const [nummer, setNummer] = useState("");
  const [postcode, setPostcode] = useState("");
  const [plaats, setPlaats] = useState("");
  const [land, setLand] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [kvk, setKvk] = useState("");
  const [btwNummer, setBtwNummer] = useState("");
  
  // System-wide option selections (interactive)
  const [stroominstelling, setStroominstelling] = useState<string[]>([]);
  const [vrijverbruikinstelling, setVrijverbruikinstelling] = useState<string[]>([]);
  const [sessionDurationDays, setSessionDurationDays] = useState(30);

  // Dirty tracking: the save button stays disabled until something changes.
  const initialKeyRef = useRef<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const shape: SettingsShape = {
    naam,
    straat,
    nummer,
    postcode,
    plaats,
    land,
    telefoon,
    email,
    website,
    kvk,
    btwNummer,
    sessionDurationDays,
    stroominstelling,
    vrijverbruikinstelling,
  };

  useEffect(() => {
    if (initialKeyRef.current === null) return;
    setIsDirty(settingsKey(shape) !== initialKeyRef.current);
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        const e = data.eigenaar || {};
        setNaam(e.naam || "");
        setStraat(e.straat || "");
        setNummer(e.nummer || "");
        setPostcode(e.postcode || "");
        setPlaats(e.plaats || "");
        setLand(e.land || "");
        setTelefoon(e.telefoon || "");
        setEmail(e.email || "");
        setWebsite(e.website || "");
        setKvk(e.kvk || "");
        setBtwNummer(e['btw-nummer'] || "");
        setStroominstelling(data.stroominstelling || []);
        setVrijverbruikinstelling(data.vrijverbruikinstelling || []);
        setSessionDurationDays(data.sessionDurationDays ?? 30);
        initialKeyRef.current = settingsKey({
          naam: e.naam || "",
          straat: e.straat || "",
          nummer: e.nummer || "",
          postcode: e.postcode || "",
          plaats: e.plaats || "",
          land: e.land || "",
          telefoon: e.telefoon || "",
          email: e.email || "",
          website: e.website || "",
          kvk: e.kvk || "",
          btwNummer: e['btw-nummer'] || "",
          sessionDurationDays: data.sessionDurationDays ?? 30,
          stroominstelling: data.stroominstelling || [],
          vrijverbruikinstelling: data.vrijverbruikinstelling || [],
        });
        setIsDirty(false);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    const stroomNorm = normalizeValues(stroominstelling);
    const vrijNorm = normalizeValues(vrijverbruikinstelling);
    setStroominstelling(stroomNorm);
    setVrijverbruikinstelling(vrijNorm);
    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");
    try {
      await updateSettings({
        eigenaar: {
          naam: naam || undefined,
          straat: straat || undefined,
          nummer: nummer || undefined,
          postcode: postcode || undefined,
          plaats: plaats || undefined,
          land: land || undefined,
          telefoon: telefoon || undefined,
          email: email || undefined,
          website: website || undefined,
          kvk: kvk || undefined,
          'btw-nummer': btwNummer || undefined,
        },
        sessionDurationDays,
        stroominstelling: stroomNorm,
        vrijverbruikinstelling: vrijNorm,
      });
      initialKeyRef.current = settingsKey(shape);
      setIsDirty(false);
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
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
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
                value={straat}
                onChange={(e) => setStraat(e.target.value)}
                placeholder="Straat"
                className="h-12 flex-1 min-w-0 rounded-lg border border-input bg-card px-3 text-[13.5px] outline-none focus:ring-2 focus:ring-ring"
                aria-label="Straat"
              />
              <input
                type="text"
                value={nummer}
                onChange={(e) => setNummer(e.target.value)}
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
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
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
              value={plaats}
              onChange={(e) => setPlaats(e.target.value)}
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
              value={land}
              onChange={(e) => setLand(e.target.value)}
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
              value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
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
              value={kvk}
              onChange={(e) => setKvk(e.target.value)}
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
              value={btwNummer}
              onChange={(e) => setBtwNummer(e.target.value)}
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
            values={stroominstelling}
            onChange={setStroominstelling}
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
            values={vrijverbruikinstelling}
            onChange={setVrijverbruikinstelling}
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
                value={sessionDurationDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setSessionDurationDays(Math.max(1, Math.min(365, v)));
                }}
                className="h-12 w-24 rounded-lg border border-input bg-card px-3 text-center text-[13.5px] font-semibold outline-none focus:ring-2 focus:ring-ring tabular-nums"
                aria-label="Sessieduur in dagen"
              />
              <span className="text-[13px] font-medium text-muted-foreground">dagen</span>
            </div>
          </div>
        </Card>

        {saveStatus === "success" && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-success-soft py-3 text-center">
            <Check className="h-5 w-5 text-success" />
            <span className="text-[14px] font-semibold text-success">
              Instellingen opgeslagen
            </span>
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
          <button
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
            className="bp-tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Bezig met opslaan..." : "Opslaan"}
          </button>
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
          <span className="w-10 shrink-0 text-[13px] font-medium text-muted-foreground">{unit}</span>
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
