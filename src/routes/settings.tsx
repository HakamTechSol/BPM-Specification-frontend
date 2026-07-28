import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
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
  Check,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
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
  
  // Settings arrays (read-only)
  const [stroominstelling, setStroominstelling] = useState<string[]>([]);
  const [vrijverbruikinstelling, setVrijverbruikinstelling] = useState<string[]>([]);

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
        setLoading(false);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");
    try {
      await updateSettings({
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
      });
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
            disabled={saving || loading}
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
          <div className="flex flex-wrap gap-2">
            {stroominstelling.map((amp) => (
              <span
                key={amp}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-[13px] font-semibold text-primary"
              >
                <Zap className="h-3.5 w-3.5" />
                {amp} A
              </span>
            ))}
          </div>
        </Card>

        <SectionLabel>Vrij verbruik</SectionLabel>
        <Card className="p-4">
          <div className="mb-3 text-[13px] text-muted-foreground">
            Dagelijkse gratis verbruiksopties (kWh)
          </div>
          <div className="flex flex-wrap gap-2">
            {vrijverbruikinstelling.map((kwh) => (
              <span
                key={kwh}
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-[13px] font-semibold text-foreground"
              >
                {kwh} kWh
              </span>
            ))}
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
            disabled={saving || loading}
            className="bp-tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Bezig met opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
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
