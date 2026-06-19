"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle, ChevronRight, ChevronLeft, Loader2, MapPin, Upload, X,
  CircleDot, Waves, Milestone, Mountain, ShieldOff, AlertTriangle, Wrench, HelpCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LIBERIA_COUNTIES } from "@/lib/counties";
import { cn } from "@/lib/utils";
import type { ConditionType, ReportSeverity } from "@/lib/types";

const CONDITION_OPTIONS: { value: ConditionType; label: string; icon: React.ElementType }[] = [
  { value: "pothole",           label: "Pothole",           icon: CircleDot },
  { value: "flooding",          label: "Flooding",          icon: Waves },
  { value: "bridge_damage",     label: "Bridge Damage",     icon: Milestone },
  { value: "road_erosion",      label: "Road Erosion",      icon: Mountain },
  { value: "missing_guardrail", label: "Missing Guardrail", icon: ShieldOff },
  { value: "landslide",         label: "Landslide",         icon: AlertTriangle },
  { value: "damaged_culvert",   label: "Damaged Culvert",   icon: Wrench },
  { value: "other",             label: "Other",             icon: HelpCircle },
];

const SEVERITY_OPTIONS: { value: ReportSeverity; label: string; desc: string }[] = [
  { value: "low",      label: "Low",      desc: "Minor issue, not urgent" },
  { value: "medium",   label: "Medium",   desc: "Noticeable, needs attention" },
  { value: "high",     label: "High",     desc: "Dangerous, urgent repair needed" },
  { value: "critical", label: "Critical", desc: "Road is impassable or life-threatening" },
];

const SEVERITY_BANNER: Record<string, string> = {
  low:      "border-green-200 bg-green-50 text-green-800",
  medium:   "border-yellow-200 bg-yellow-50 text-yellow-800",
  high:     "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

const SELECT_CLASS =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface FormData {
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

const INITIAL_FORM: FormData = {
  title: "",
  county: "",
  community: "",
  latitude: null,
  longitude: null,
  conditionType: "",
  severity: "",
  description: "",
  photos: [],
};

type Step = 1 | 2;

export function ReportForm() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  type PhotoCheck = { status: "idle" | "checking" | "ok" | "warn"; message: string };
  const [photoChecks, setPhotoChecks] = useState<PhotoCheck[]>([]);

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

  const update = (patch: Partial<FormData>) => setForm((prev) => ({ ...prev, ...patch }));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setDetecting(false);
        toast.success("Location detected.");
      },
      () => {
        setDetecting(false);
        toast.error("Could not detect location. Please allow location access and try again.");
      },
      { timeout: 10000 },
    );
  };

  const addPhotos = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = 5 - form.photos.length;
      if (remaining <= 0) { toast.error("Maximum 5 photos allowed."); return; }
      const newFiles = Array.from(files).slice(0, remaining);
      const newUrls = newFiles.map((f) => URL.createObjectURL(f));
      const startIndex = form.photos.length;
      update({ photos: [...form.photos, ...newFiles] });
      setPhotoPreviewUrls((prev) => [...prev, ...newUrls]);
      setPhotoChecks((prev) => [...prev, ...newFiles.map(() => ({ status: "idle" as const, message: "" }))]);
      if (form.conditionType) {
        newFiles.forEach((file, i) => classifyPhoto(file, startIndex + i, form.conditionType as ConditionType));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.photos, form.conditionType],
  );

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    update({ photos: form.photos.filter((_, i) => i !== index) });
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setPhotoChecks((prev) => prev.filter((_, i) => i !== index));
  };

  const canGoNext = () => {
    if (step === 1)
      return (
        form.title.trim().length >= 5 &&
        form.county !== "" &&
        form.community.trim() !== "" &&
        form.latitude !== null
      );
    return (
      form.conditionType !== "" &&
      form.severity !== "" &&
      form.description.trim().length >= 10 &&
      form.photos.length > 0
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("county", form.county);
      body.append("community", form.community);
      body.append("latitude", String(form.latitude));
      body.append("longitude", String(form.longitude));
      body.append("condition_type", form.conditionType);
      body.append("severity", form.severity);
      body.append("description", form.description);
      form.photos.forEach((photo) => body.append("photos", photo));

      const res = await fetch("/api/reports", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submit button state ── */
  const isChecking   = photoChecks.some((c) => c?.status === "checking");
  const hasWarn      = photoChecks.some((c) => c?.status === "warn");
  const submitBlocked = submitting || !canGoNext() || isChecking || hasWarn;
  const submitLabel   = submitting ? "Submitting…"
                      : isChecking ? "Verifying photos…"
                      : hasWarn    ? "Fix photo mismatch"
                      : "Submit Report";

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
            <button
              onClick={() => { setForm(INITIAL_FORM); setPhotoPreviewUrls([]); setPhotoChecks([]); setSubmitted(false); setStep(1); }}
              className="btn btn-secondary"
            >
              Submit another report
            </button>
            <a href="/" className="btn btn-outline-blue">
              Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Multi-step form ── */
  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      {/* Step indicator */}
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {([1, 2] as const).map((n, i) => (
            <div key={n} className="flex items-center gap-3">
              {i > 0 && <div className={cn("h-px flex-1 w-8 bg-border", step > i && "bg-[var(--nrf-blue)]")} />}
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step === n ? "bg-[var(--nrf-blue)] text-white"
                  : step > n ? "bg-[var(--nrf-blue)]/20 text-[var(--nrf-blue)]"
                  : "bg-muted text-muted-foreground",
              )}>
                {step > n ? "✓" : n}
              </div>
              <span className={cn("text-xs font-medium", step >= n ? "text-foreground" : "text-muted-foreground")}>
                {n === 1 ? "Location" : "Condition"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 sm:p-6">

        {/* STEP 1: Location */}
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
              <div className="space-y-1.5">
                <Label htmlFor="county">County *</Label>
                <select
                  id="county"
                  value={form.county}
                  onChange={(e) => update({ county: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">Select county…</option>
                  {LIBERIA_COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
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
                className={cn(
                  "btn w-full sm:w-auto",
                  form.latitude !== null ? "btn-secondary" : "btn-outline-blue",
                )}
              >
                {detecting
                  ? <Loader2 className="size-4 animate-spin" />
                  : <MapPin className="size-4" />}
                {detecting ? "Detecting…" : form.latitude !== null ? "Location detected ✓" : "Detect my location"}
              </button>
              {form.latitude !== null && (
                <p className="text-xs text-muted-foreground">
                  {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
                </p>
              )}
              {form.latitude === null && (
                <p className="text-xs text-muted-foreground">
                  GPS is required so your report appears on the road conditions map.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Condition */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="condition-type">Condition Type *</Label>
              <select
                id="condition-type"
                value={form.conditionType}
                onChange={(e) => {
                  const newType = e.target.value as ConditionType;
                  update({ conditionType: newType });
                  if (newType && form.photos.length > 0) {
                    form.photos.forEach((photo, i) => classifyPhoto(photo, i, newType));
                  }
                }}
                className={SELECT_CLASS}
              >
                <option value="">Select condition type…</option>
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {form.conditionType && (() => {
                const opt = CONDITION_OPTIONS.find((o) => o.value === form.conditionType);
                if (!opt) return null;
                const Icon = opt.icon;
                return (
                  <div className="flex items-center gap-2 rounded-md border border-[var(--nrf-blue)]/20 bg-[var(--nrf-blue)]/5 px-3 py-2 text-sm font-medium text-[var(--nrf-blue)]">
                    <Icon className="size-4 shrink-0" />
                    {opt.label} selected
                  </div>
                );
              })()}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity *</Label>
              <select
                id="severity"
                value={form.severity}
                onChange={(e) => update({ severity: e.target.value as ReportSeverity })}
                className={SELECT_CLASS}
              >
                <option value="">Select severity…</option>
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.desc}
                  </option>
                ))}
              </select>
              {form.severity && (() => {
                const opt = SEVERITY_OPTIONS.find((o) => o.value === form.severity);
                return (
                  <div className={cn("rounded-md border px-3 py-2 text-sm font-medium", SEVERITY_BANNER[form.severity])}>
                    {opt?.label} — {opt?.desc}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={500}
                placeholder="Describe the condition — size, hazards, traffic impact, any landmarks nearby."
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
              />
              <p className="text-right text-xs text-muted-foreground">{form.description.length}/500</p>
            </div>

            {/* Photo upload */}
            <div className="space-y-2">
              <Label>
                Photos *{" "}
                <span className="font-normal text-muted-foreground">(at least 1, up to 5)</span>
              </Label>
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
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(e.target.files)}
                />
              </div>
              {photoPreviewUrls.length > 0 && (
                <>
                  <div className="grid grid-cols-4 gap-2 pt-1 sm:grid-cols-5">
                    {photoPreviewUrls.map((url, i) => {
                      const check = photoChecks[i];
                      return (
                        <div key={i} className="relative aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className={cn(
                              "size-full rounded-md object-cover ring-2",
                              check?.status === "warn" ? "ring-amber-400" : "ring-border",
                            )}
                          />
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--nrf-red)] text-white shadow"
                          >
                            <X className="size-3" />
                          </button>
                          {/* AI check badge */}
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

                  {/* Warning messages */}
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
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="btn btn-outline-blue"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        {step < 2 ? (
          <button
            type="button"
            disabled={!canGoNext()}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="btn btn-secondary disabled:opacity-40"
          >
            Continue
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitBlocked}
            className="btn btn-primary disabled:opacity-40"
          >
            {(submitting || isChecking) ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
