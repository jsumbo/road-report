"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CheckCircle, ChevronRight, ChevronLeft, Loader2, MapPin, Upload, X, ClipboardList,
  CircleDot, Waves, Milestone, Mountain, ShieldOff, AlertTriangle, Wrench, HelpCircle,
  AlertCircle, XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LIBERIA_COUNTIES, type LiberiaCounty } from "@/lib/counties";
import { countyAt, OUTSIDE_LIBERIA_MESSAGE } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { ConditionType, ReportSeverity } from "@/lib/types";
import { SelectField, StepIndicator, type SelectOption } from "@/components/form/fields";
import { SurveyForm } from "@/components/survey/survey-form";

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

const STEP_LABELS = ["Location", "Condition"] as const;

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

const INITIAL_REPORT: ReportData = {
  title: "", county: "", community: "",
  latitude: null, longitude: null,
  conditionType: "", severity: "", description: "", photos: [],
};

type Step = 1 | 2;
type SurveyPrompt = "offered" | "open" | "done" | "skipped";

/* ── Component ── */

export function ReportForm() {
  const [step, setStep]         = useState<Step>(1);
  const [form, setForm]         = useState<ReportData>(INITIAL_REPORT);
  const [detecting, setDetect]  = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsCounty, setGpsCounty] = useState<LiberiaCounty | null>(null);
  const [submitting, setSubmit] = useState(false);
  const [reference, setRef]     = useState<string | null>(null);
  const [surveyPrompt, setSurveyPrompt] = useState<SurveyPrompt>("offered");
  const watchIdRef = useRef<number | null>(null);

  type PhotoCheck = { status: "idle" | "checking" | "ok" | "warn"; message: string };
  const [photoPreviewUrls, setPreviewUrls] = useState<string[]>([]);
  const [photoChecks, setPhotoChecks]      = useState<PhotoCheck[]>([]);

  const update    = (patch: Partial<ReportData>) => setForm((p) => ({ ...p, ...patch }));

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
  // A cold GPS fix can take several seconds to converge on an accurate reading,
  // so we watch for updates and keep the best one instead of taking the first.
  const GPS_TARGET_ACCURACY_M = 30;
  const GPS_MAX_WAIT_MS       = 15000;

  const stopWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => stopWatch, []);

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }
    stopWatch();
    setDetect(true);
    setAccuracy(null);

    let best: GeolocationPosition | null = null;

    const finish = () => {
      window.clearTimeout(timeoutId);
      stopWatch();
      setDetect(false);
      if (!best) return;
      const { latitude, longitude } = best.coords;
      const detected = countyAt(latitude, longitude);
      if (!detected) {
        update({ latitude: null, longitude: null });
        setGpsCounty(null);
        setAccuracy(null);
        toast.error(OUTSIDE_LIBERIA_MESSAGE);
        return;
      }
      // Fill the county from GPS when the reporter hasn't picked one yet
      setForm((p) => ({ ...p, latitude, longitude, county: p.county || detected }));
      setGpsCounty(detected);
      setAccuracy(best.coords.accuracy);
      toast.success(
        best.coords.accuracy <= GPS_TARGET_ACCURACY_M
          ? "Location detected."
          : `Location detected (±${Math.round(best.coords.accuracy)}m accuracy). For a more precise fix, move to open sky and try again.`,
      );
    };

    const timeoutId = window.setTimeout(finish, GPS_MAX_WAIT_MS);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= GPS_TARGET_ACCURACY_M) finish();
      },
      (err) => {
        if (best) { finish(); return; }
        window.clearTimeout(timeoutId);
        stopWatch();
        setDetect(false);
        const messages: Record<number, string> = {
          1: "Location access was denied. Enable location permission for this site in your browser settings, then try again.",
          2: "Couldn't determine your location. Make sure GPS/location services are turned on and try again outdoors.",
          3: "Location is taking too long. Move to an open area with a clear view of the sky and try again.",
        };
        toast.error(messages[err.code] ?? "Could not detect location. Please allow location access and try again.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: GPS_MAX_WAIT_MS },
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

      setRef(json.reference_number);
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
    setPreviewUrls([]);
    setPhotoChecks([]);
    setRef(null);
    setGpsCounty(null);
    setSurveyPrompt("offered");
    setStep(1);
  };

  /* ── Success screen — always offers the optional survey ── */
  if (reference) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-12 text-center sm:px-8 sm:py-14">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-semibold">
              Thank you for taking action!
            </h2>
            <p className="mt-3 mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Your report has been received.
            </p>
            {(surveyPrompt === "done" || surveyPrompt === "skipped") && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button onClick={reset} className="btn btn-secondary">Submit another report</button>
                <Link href="/" className="btn btn-outline-blue">Back to home</Link>
              </div>
            )}
          </div>
        </div>

        {surveyPrompt === "offered" && (
          <div className="rounded-lg border border-[var(--nrf-blue)]/20 bg-[var(--nrf-blue)]/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--nrf-blue)]/10">
                <ClipboardList className="size-5 text-[var(--nrf-blue)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Got 2 minutes? Help us improve roads</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tell us how roads affect daily life in {form.community}.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setSurveyPrompt("open")} className="btn btn-secondary btn-sm">
                Take the survey
              </button>
              <button onClick={() => setSurveyPrompt("skipped")} className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
                Skip
              </button>
            </div>
          </div>
        )}

        {surveyPrompt === "open" && (
          <SurveyForm
            report={{ county: form.county, community: form.community, reportReference: reference }}
            onDone={() => { setSurveyPrompt("done"); toast.success("Survey submitted — thank you!"); }}
            onSkip={() => setSurveyPrompt("skipped")}
          />
        )}
      </div>
    );
  }

  /* ── Step indicator ── */
  const selectedSeverity  = SEVERITY_OPTIONS.find((o) => o.value === form.severity);
  const SelectedSevIcon   = selectedSeverity?.icon;

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">

      <StepIndicator labels={STEP_LABELS} step={step} />

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
                ? (
                  <p className="text-xs text-muted-foreground">
                    {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
                    {accuracy !== null && ` · ±${Math.round(accuracy)}m accuracy`}
                  </p>
                )
                : <p className="text-xs text-muted-foreground">GPS is required so your report appears on the road conditions map.</p>
              }
              {gpsCounty && form.county && gpsCounty !== form.county && (
                <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    Your GPS puts you in {gpsCounty}, but you selected {form.county}.
                  </span>
                  <button type="button" onClick={() => update({ county: gpsCounty })}
                    className="shrink-0 self-start text-xs font-semibold underline underline-offset-2 sm:self-auto">
                    Use {gpsCounty}
                  </button>
                </div>
              )}
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

        {step < 2 ? (
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
