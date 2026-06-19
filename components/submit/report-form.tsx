"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle, ChevronRight, ChevronLeft, ChevronDown, Loader2, MapPin, Upload, X,
  CircleDot, Waves, Milestone, Mountain, ShieldOff, AlertTriangle, Wrench, HelpCircle,
  AlertCircle, XCircle, Star, TrendingUp, Minus, TrendingDown, Building2,
  Layers, Moon, Droplets, ShoppingBag, Heart, GraduationCap, Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LIBERIA_COUNTIES } from "@/lib/counties";
import { cn } from "@/lib/utils";
import type { ConditionType, ReportSeverity } from "@/lib/types";

/* ── Shared option type ── */
interface SelectOption {
  value: string;
  label: string;
  icon?: React.ElementType;
}
interface CheckOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

/* ── Option definitions ── */

const CONDITION_OPTIONS: SelectOption[] = [
  { value: "pothole",           label: "Pothole",           icon: CircleDot },
  { value: "flooding",          label: "Flooding",          icon: Waves },
  { value: "bridge_damage",     label: "Bridge Damage",     icon: Milestone },
  { value: "road_erosion",      label: "Road Erosion",      icon: Mountain },
  { value: "missing_guardrail", label: "Missing Guardrail", icon: ShieldOff },
  { value: "landslide",         label: "Landslide",         icon: AlertTriangle },
  { value: "damaged_culvert",   label: "Damaged Culvert",   icon: Wrench },
  { value: "other",             label: "Other",             icon: HelpCircle },
];

const SEVERITY_OPTIONS: (SelectOption & { desc: string; banner: string })[] = [
  { value: "low",      label: "Low",      desc: "Minor issue, not urgent",             icon: CheckCircle,  banner: "border-green-200 bg-green-50 text-green-800" },
  { value: "medium",   label: "Medium",   desc: "Noticeable, needs attention",         icon: AlertCircle,  banner: "border-yellow-200 bg-yellow-50 text-yellow-800" },
  { value: "high",     label: "High",     desc: "Dangerous, urgent repair needed",     icon: AlertTriangle, banner: "border-orange-200 bg-orange-50 text-orange-800" },
  { value: "critical", label: "Critical", desc: "Impassable or life-threatening",      icon: XCircle,      banner: "border-red-200 bg-red-50 text-red-800" },
];

const RATING_OPTIONS: SelectOption[] = [
  { value: "1", label: "1 — Very Poor / Very Unsafe",  icon: Star },
  { value: "2", label: "2 — Poor / Unsafe",            icon: Star },
  { value: "3", label: "3 — Fair / Neutral",           icon: Star },
  { value: "4", label: "4 — Good / Safe",              icon: Star },
  { value: "5", label: "5 — Very Good / Very Safe",    icon: Star },
];

const SATISFACTION_OPTIONS: SelectOption[] = [
  { value: "1", label: "1 — Very Dissatisfied", icon: Star },
  { value: "2", label: "2 — Dissatisfied",      icon: Star },
  { value: "3", label: "3 — Neutral",           icon: Star },
  { value: "4", label: "4 — Satisfied",         icon: Star },
  { value: "5", label: "5 — Very Satisfied",    icon: Star },
];

const MAINT_DONE_OPTIONS: SelectOption[] = [
  { value: "yes",    label: "Yes",      icon: CheckCircle },
  { value: "no",     label: "No",       icon: XCircle },
  { value: "unsure", label: "Not sure", icon: HelpCircle },
];

const MAINT_DELIVERED_OPTIONS: SelectOption[] = [
  { value: "yes",       label: "Yes, fully", icon: CheckCircle },
  { value: "partially", label: "Partially",  icon: AlertCircle },
  { value: "no",        label: "No",         icon: XCircle },
];

const TRANSPORT_OPTIONS: SelectOption[] = [
  { value: "increased", label: "Increased",       icon: TrendingUp },
  { value: "same",      label: "Stayed the same", icon: Minus },
  { value: "decreased", label: "Decreased",       icon: TrendingDown },
];

const NRF_AWARE_OPTIONS: SelectOption[] = [
  { value: "yes", label: "Yes", icon: Building2 },
  { value: "no",  label: "No",  icon: HelpCircle },
];

const ROAD_PROBLEM_OPTIONS: CheckOption[] = [
  { value: "Potholes",         label: "Potholes",         icon: CircleDot },
  { value: "Uneven surface",   label: "Uneven surface",   icon: Layers },
  { value: "Flooding",         label: "Flooding",         icon: Waves },
  { value: "No lighting",      label: "No lighting",      icon: Moon },
  { value: "Damaged bridges",  label: "Damaged bridges",  icon: Milestone },
  { value: "Poor drainage",    label: "Poor drainage",    icon: Droplets },
  { value: "Road erosion",     label: "Road erosion",     icon: Mountain },
  { value: "Other",            label: "Other",            icon: HelpCircle },
];

const IMPACT_AREA_OPTIONS: CheckOption[] = [
  { value: "Markets",               label: "Markets",               icon: ShoppingBag },
  { value: "Health facilities",     label: "Health facilities",     icon: Heart },
  { value: "Schools",               label: "Schools",               icon: GraduationCap },
  { value: "Workplaces",            label: "Workplaces",            icon: Briefcase },
  { value: "No significant impact", label: "No significant impact", icon: CheckCircle },
];

const STEP_LABELS = ["Location", "Condition", "Road", "Impact", "Feedback"] as const;

/* ── SelectField — styled trigger + native select overlay ── */
function SelectField({
  id, label, value, onChange, options, placeholder, required,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
}) {
  const selected = options.find((o) => o.value === value);
  const Icon = selected?.icon;
  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id}>
          {label}{required && " *"}
        </Label>
      )}
      <div className="relative rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className={cn(
          "flex h-11 cursor-pointer select-none items-center gap-2.5 px-3 py-2 text-sm pointer-events-none",
          !value && "text-muted-foreground",
        )}>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <span className="flex-1 truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground/60" />
        </div>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer rounded-md opacity-0"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── CheckList — checkboxes with icon, highlights when checked ── */
function CheckList({ options, values, onChange }: {
  options: CheckOption[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map(({ value: opt, label, icon: Icon }) => (
        <label key={opt} className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors",
          values.includes(opt)
            ? "border-[var(--nrf-blue)]/50 bg-[var(--nrf-blue)]/5 text-[var(--nrf-blue)]"
            : "border-border hover:bg-muted/30",
        )}>
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--nrf-blue)]"
            checked={values.includes(opt)}
            onChange={() => toggle(opt)}
          />
          <Icon className={cn("size-4 shrink-0", values.includes(opt) ? "text-[var(--nrf-blue)]" : "text-muted-foreground")} />
          {label}
        </label>
      ))}
    </div>
  );
}

/* ── Types ── */

interface ReportData {
  title: string;
  county: string;
  community: string;
  latitude: number | null;
  longitude: number | null;
  conditionType: ConditionType | "";
  severity: ReportSeverity | "";
  description: string;
  photos: File[];
}

interface SurveyData {
  roadRating: string;
  safetyRating: string;
  roadProblems: string[];
  maintenanceDone: string;
  maintSatisfaction: string;
  maintDelivered: string;
  impactAreas: string[];
  transportCost: string;
  nrfAware: string;
  nrfSatisfaction: string;
  feedback: string;
}

const INITIAL_REPORT: ReportData = {
  title: "", county: "", community: "",
  latitude: null, longitude: null,
  conditionType: "", severity: "", description: "", photos: [],
};

const INITIAL_SURVEY: SurveyData = {
  roadRating: "", safetyRating: "", roadProblems: [],
  maintenanceDone: "", maintSatisfaction: "", maintDelivered: "",
  impactAreas: [], transportCost: "",
  nrfAware: "", nrfSatisfaction: "", feedback: "",
};

type Step = 1 | 2 | 3 | 4 | 5;

/* ── Component ── */

export function ReportForm() {
  const [step, setStep]         = useState<Step>(1);
  const [form, setForm]         = useState<ReportData>(INITIAL_REPORT);
  const [survey, setSurvey]     = useState<SurveyData>(INITIAL_SURVEY);
  const [detecting, setDetect]  = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [submitted, setDone]    = useState(false);

  type PhotoCheck = { status: "idle" | "checking" | "ok" | "warn"; message: string };
  const [photoPreviewUrls, setPreviewUrls] = useState<string[]>([]);
  const [photoChecks, setPhotoChecks]      = useState<PhotoCheck[]>([]);

  const update    = (patch: Partial<ReportData>) => setForm((p) => ({ ...p, ...patch }));
  const upSurvey  = (patch: Partial<SurveyData>) => setSurvey((p) => ({ ...p, ...patch }));

  /* ── Photo AI check ── */
  const classifyPhoto = async (file: File, index: number, conditionType: ConditionType) => {
    if (conditionType === "other") {
      setPhotoChecks((prev) => { const n = [...prev]; n[index] = { status: "ok", message: "" }; return n; });
      return;
    }
    setPhotoChecks((prev) => { const n = [...prev]; n[index] = { status: "checking", message: "" }; return n; });
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("condition_type", conditionType);
      const res = await fetch("/api/classify-image", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { matches, message } = await res.json();
      setPhotoChecks((prev) => { const n = [...prev]; n[index] = { status: matches ? "ok" : "warn", message: message ?? "" }; return n; });
    } catch {
      setPhotoChecks((prev) => { const n = [...prev]; n[index] = { status: "idle", message: "" }; return n; });
    }
  };

  /* ── Geolocation ── */
  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }
    setDetect(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setDetect(false);
        toast.success("Location detected.");
      },
      () => {
        setDetect(false);
        toast.error("Could not detect location. Please allow location access and try again.");
      },
      { timeout: 10000 },
    );
  };

  /* ── Photos ── */
  const addPhotos = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = 5 - form.photos.length;
      if (remaining <= 0) { toast.error("Maximum 5 photos allowed."); return; }
      const newFiles = Array.from(files).slice(0, remaining);
      const newUrls  = newFiles.map((f) => URL.createObjectURL(f));
      const startIdx = form.photos.length;
      update({ photos: [...form.photos, ...newFiles] });
      setPreviewUrls((prev) => [...prev, ...newUrls]);
      setPhotoChecks((prev) => [...prev, ...newFiles.map(() => ({ status: "idle" as const, message: "" }))]);
      if (form.conditionType) {
        newFiles.forEach((file, i) => classifyPhoto(file, startIdx + i, form.conditionType as ConditionType));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.photos, form.conditionType],
  );

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    update({ photos: form.photos.filter((_, i) => i !== index) });
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setPhotoChecks((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Validation per step ── */
  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return (
        form.title.trim().length >= 5 && form.county !== "" &&
        form.community.trim() !== "" && form.latitude !== null
      );
      case 2: return (
        form.conditionType !== "" && form.severity !== "" &&
        form.description.trim().length >= 10 && form.photos.length > 0 &&
        !photoChecks.some((c) => c?.status === "checking" || c?.status === "warn")
      );
      case 3: return !!survey.roadRating && !!survey.safetyRating;
      case 4: {
        if (!survey.maintenanceDone || !survey.transportCost) return false;
        if (survey.maintenanceDone === "yes" && (!survey.maintSatisfaction || !survey.maintDelivered)) return false;
        return true;
      }
      case 5: return !!survey.nrfAware;
      default: return false;
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmit(true);
    try {
      const body = new FormData();
      body.append("title",          form.title);
      body.append("county",         form.county);
      body.append("community",      form.community);
      body.append("latitude",       String(form.latitude));
      body.append("longitude",      String(form.longitude));
      body.append("condition_type", form.conditionType);
      body.append("severity",       form.severity);
      body.append("description",    form.description);
      form.photos.forEach((photo) => body.append("photos", photo));

      const res  = await fetch("/api/reports", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");

      // Survey submitted silently — failure here must not break the report success
      fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county: form.county, community: form.community,
          reportReference: json.reference_number,
          roadRating:        Number(survey.roadRating),
          safetyRating:      Number(survey.safetyRating),
          roadProblems:      survey.roadProblems,
          maintenanceDone:   survey.maintenanceDone,
          maintSatisfaction: survey.maintSatisfaction ? Number(survey.maintSatisfaction) : null,
          maintDelivered:    survey.maintDelivered || null,
          impactAreas:       survey.impactAreas,
          transportCost:     survey.transportCost,
          nrfAware:          survey.nrfAware,
          nrfSatisfaction:   survey.nrfSatisfaction ? Number(survey.nrfSatisfaction) : null,
          feedback:          survey.feedback,
        }),
      }).catch(() => {});

      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmit(false);
    }
  };

  const isChecking  = photoChecks.some((c) => c?.status === "checking");
  const hasWarn     = photoChecks.some((c) => c?.status === "warn");
  const submitLabel = submitting ? "Submitting…" : isChecking ? "Verifying photos…" : hasWarn ? "Fix photo mismatch" : "Submit";

  /* ── Reset ── */
  const reset = () => {
    setForm(INITIAL_REPORT);
    setSurvey(INITIAL_SURVEY);
    setPreviewUrls([]);
    setPhotoChecks([]);
    setDone(false);
    setStep(1);
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-14 text-center sm:px-8 sm:py-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <h2 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-semibold">
            Thank you for taking action!
          </h2>
          <p className="mt-3 mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your report has been received. Together we can keep Liberia&apos;s roads safe.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={reset} className="btn btn-secondary">Submit another report</button>
            <a href="/" className="btn btn-outline-blue">Back to home</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step indicator ── */
  const selectedSeverity  = SEVERITY_OPTIONS.find((o) => o.value === form.severity);
  const SelectedSevIcon   = selectedSeverity?.icon;

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">

      {/* Step indicator */}
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center">
          {([1, 2, 3, 4, 5] as const).map((n, i) => (
            <div key={n} className="flex min-w-0 items-center">
              {i > 0 && (
                <div className={cn("h-px flex-1 mx-1 bg-border sm:mx-2", step > i && "bg-[var(--nrf-blue)]")} />
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                <div className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors sm:size-7 sm:text-xs",
                  step === n ? "bg-[var(--nrf-blue)] text-white"
                    : step > n ? "bg-[var(--nrf-blue)]/20 text-[var(--nrf-blue)]"
                    : "bg-muted text-muted-foreground",
                )}>
                  {step > n ? "✓" : n}
                </div>
                <span className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  step >= n ? "text-foreground" : "text-muted-foreground",
                )}>
                  {STEP_LABELS[i]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 sm:p-6">

        {/* ── STEP 1: Location ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Deep pothole near Total station on Tubman Blvd"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={120}
                className="h-11"
              />
              <p className="text-right text-xs text-muted-foreground">{form.title.length}/120</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="county" label="County" value={form.county} required
                onChange={(v) => update({ county: v })}
                placeholder="Select county…"
                options={LIBERIA_COUNTIES.map((c) => ({ value: c, label: c }))}
              />
              <div className="space-y-1.5">
                <Label htmlFor="community">Community / Area *</Label>
                <Input
                  id="community"
                  placeholder="e.g. Paynesville, Red Light"
                  value={form.community}
                  onChange={(e) => update({ community: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>GPS Location *</Label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detecting}
                className={cn("btn w-full sm:w-auto", form.latitude !== null ? "btn-secondary" : "btn-outline-blue")}
              >
                {detecting ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                {detecting ? "Detecting…" : form.latitude !== null ? "Location detected ✓" : "Detect my location"}
              </button>
              {form.latitude !== null
                ? <p className="text-xs text-muted-foreground">{form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}</p>
                : <p className="text-xs text-muted-foreground">GPS is required so your report appears on the road conditions map.</p>
              }
            </div>
          </div>
        )}

        {/* ── STEP 2: Condition ── */}
        {step === 2 && (
          <div className="space-y-5">
            <SelectField
              id="condition-type" label="Condition Type" value={form.conditionType} required
              onChange={(v) => {
                const newType = v as ConditionType;
                update({ conditionType: newType });
                if (newType && form.photos.length > 0)
                  form.photos.forEach((photo, i) => classifyPhoto(photo, i, newType));
              }}
              placeholder="Select condition type…"
              options={CONDITION_OPTIONS}
            />

            <div className="space-y-1.5">
              <SelectField
                id="severity" label="Severity" value={form.severity} required
                onChange={(v) => update({ severity: v as ReportSeverity })}
                placeholder="Select severity…"
                options={SEVERITY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: `${o.label} — ${o.desc}`,
                  icon: o.icon,
                }))}
              />
              {selectedSeverity && (
                <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium", selectedSeverity.banner)}>
                  {SelectedSevIcon && <SelectedSevIcon className="size-4 shrink-0" />}
                  {selectedSeverity.label} — {selectedSeverity.desc}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description" rows={4} maxLength={500}
                placeholder="Describe the condition — size, hazards, traffic impact, any landmarks nearby."
                value={form.description} onChange={(e) => update({ description: e.target.value })}
              />
              <p className="text-right text-xs text-muted-foreground">{form.description.length}/500</p>
            </div>

            {/* Photo upload */}
            <div className="space-y-2">
              <Label>Photos * <span className="font-normal text-muted-foreground">(at least 1, up to 5)</span></Label>
              <div
                className={cn(
                  "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                  form.photos.length === 0
                    ? "border-[var(--nrf-red)]/40 bg-red-50/30 hover:border-[var(--nrf-red)]/60"
                    : "border-border hover:border-[var(--nrf-blue)]/50 hover:bg-muted/30",
                )}
                onClick={() => document.getElementById("photo-upload")?.click()}
              >
                <Upload className={cn("size-7", form.photos.length === 0 ? "text-[var(--nrf-red)]/60" : "text-muted-foreground")} />
                <div>
                  <p className="text-sm font-medium text-foreground/80">
                    {form.photos.length === 0 ? "Tap to add photos" : `${form.photos.length}/5 photos — tap to add more`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">JPG, PNG, WebP · max 10 MB each</p>
                </div>
                {form.photos.length === 0 && (
                  <p className="text-xs font-medium text-[var(--nrf-red)]/70">At least one photo is required</p>
                )}
                <input id="photo-upload" type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
              </div>

              {photoPreviewUrls.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-5">
                    {photoPreviewUrls.map((url, i) => {
                      const check = photoChecks[i];
                      return (
                        <div key={i} className="relative aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className={cn("size-full rounded-md object-cover ring-2", check?.status === "warn" ? "ring-amber-400" : "ring-border")} />
                          <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--nrf-red)] text-white shadow">
                            <X className="size-3" />
                          </button>
                          {check?.status === "checking" && (
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5">
                              <Loader2 className="size-2.5 animate-spin text-white" />
                              <span className="text-[9px] text-white">Checking…</span>
                            </div>
                          )}
                          {check?.status === "ok" && (
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-green-600/80 px-1.5 py-0.5">
                              <CheckCircle className="size-2.5 text-white" />
                              <span className="text-[9px] text-white">Looks good</span>
                            </div>
                          )}
                          {check?.status === "warn" && (
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5">
                              <AlertCircle className="size-2.5 text-white" />
                              <span className="text-[9px] text-white">Review</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {photoChecks.some((c) => c?.status === "warn") && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                      {photoChecks.map((check, i) =>
                        check?.status === "warn" ? (
                          <div key={i} className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                            <p className="text-xs text-amber-800">
                              <span className="font-medium">Photo {i + 1}:</span>{" "}
                              {check.message || "This image may not match the selected condition type."}
                            </p>
                          </div>
                        ) : null,
                      )}
                      <p className="text-[10px] text-amber-700 pt-0.5">
                        Please remove the flagged photo and upload one that matches the selected condition type.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Road Condition & Safety ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-md border border-[var(--nrf-blue)]/20 bg-[var(--nrf-blue)]/5 px-4 py-3 text-sm text-[var(--nrf-blue)]">
              A few quick questions about road conditions in <strong>{form.community}, {form.county}</strong>.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="road-rating" label="Overall road condition" value={survey.roadRating} required
                onChange={(v) => upSurvey({ roadRating: v })}
                placeholder="Select rating…"
                options={RATING_OPTIONS}
              />
              <SelectField
                id="safety-rating" label="Safety on this road" value={survey.safetyRating} required
                onChange={(v) => upSurvey({ safetyRating: v })}
                placeholder="Select rating…"
                options={RATING_OPTIONS}
              />
            </div>

            <div className="space-y-2">
              <Label>Road problems observed <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <CheckList values={survey.roadProblems} onChange={(v) => upSurvey({ roadProblems: v })} options={ROAD_PROBLEM_OPTIONS} />
            </div>
          </div>
        )}

        {/* ── STEP 4: Maintenance & Impact ── */}
        {step === 4 && (
          <div className="space-y-5">
            <SelectField
              id="maint-done" label="Road maintenance done in the last 12 months?" value={survey.maintenanceDone} required
              onChange={(v) => upSurvey({ maintenanceDone: v, maintSatisfaction: "", maintDelivered: "" })}
              placeholder="Select…"
              options={MAINT_DONE_OPTIONS}
            />

            {survey.maintenanceDone === "yes" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="maint-sat" label="Satisfaction with maintenance" value={survey.maintSatisfaction} required
                  onChange={(v) => upSurvey({ maintSatisfaction: v })}
                  placeholder="Select rating…"
                  options={SATISFACTION_OPTIONS}
                />
                <SelectField
                  id="maint-delivered" label="Maintenance matched promises?" value={survey.maintDelivered} required
                  onChange={(v) => upSurvey({ maintDelivered: v })}
                  placeholder="Select…"
                  options={MAINT_DELIVERED_OPTIONS}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Road condition affected access to: <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <CheckList values={survey.impactAreas} onChange={(v) => upSurvey({ impactAreas: v })} options={IMPACT_AREA_OPTIONS} />
            </div>

            <SelectField
              id="transport-cost" label="Effect on transport costs" value={survey.transportCost} required
              onChange={(v) => upSurvey({ transportCost: v })}
              placeholder="Select…"
              options={TRANSPORT_OPTIONS}
            />
          </div>
        )}

        {/* ── STEP 5: NRF & Feedback ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className={cn("grid gap-4", survey.nrfAware === "yes" ? "sm:grid-cols-2" : "")}>
              <SelectField
                id="nrf-aware" label="Are you aware of the National Road Fund (NRF)?" value={survey.nrfAware} required
                onChange={(v) => upSurvey({ nrfAware: v, nrfSatisfaction: "" })}
                placeholder="Select…"
                options={NRF_AWARE_OPTIONS}
              />
              {survey.nrfAware === "yes" && (
                <SelectField
                  id="nrf-sat" label="Satisfaction with NRF road interventions" value={survey.nrfSatisfaction}
                  onChange={(v) => upSurvey({ nrfSatisfaction: v })}
                  placeholder="Select rating…"
                  options={SATISFACTION_OPTIONS}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback">
                Additional comments <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="feedback" rows={4} maxLength={500}
                placeholder="Any other feedback on road conditions, safety, or NRF performance…"
                value={survey.feedback} onChange={(e) => upSurvey({ feedback: e.target.value })} />
              <p className="text-right text-xs text-muted-foreground">{survey.feedback.length}/500</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="btn btn-outline-blue">
            <ChevronLeft className="size-4" /> Back
          </button>
        ) : (
          <span />
        )}

        {step < 5 ? (
          <button type="button" disabled={!canGoNext()} onClick={() => setStep((s) => (s + 1) as Step)}
            className="btn btn-secondary disabled:opacity-40">
            Continue <ChevronRight className="size-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting || !canGoNext()}
            className="btn btn-primary disabled:opacity-40">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
