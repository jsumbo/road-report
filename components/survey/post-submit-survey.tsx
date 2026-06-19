"use client";

import { useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SELECT =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/* ── CheckList — plain checkboxes, responsive grid ── */
function CheckList({ options, values, onChange }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-[var(--nrf-blue)]"
            checked={values.includes(opt)}
            onChange={() => toggle(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

/* ── Types ── */

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

const INITIAL: SurveyData = {
  roadRating: "", safetyRating: "", roadProblems: [],
  maintenanceDone: "", maintSatisfaction: "", maintDelivered: "",
  impactAreas: [], transportCost: "",
  nrfAware: "", nrfSatisfaction: "", feedback: "",
};

const STEPS = ["Road Condition", "Maintenance & Impact", "NRF & Feedback"];

const RATING_OPTIONS = [
  { value: "1", label: "1 — Very Poor / Very Unsafe" },
  { value: "2", label: "2 — Poor / Unsafe" },
  { value: "3", label: "3 — Fair / Neutral" },
  { value: "4", label: "4 — Good / Safe" },
  { value: "5", label: "5 — Very Good / Very Safe" },
];

const SATISFACTION_OPTIONS = [
  { value: "1", label: "1 — Very Dissatisfied" },
  { value: "2", label: "2 — Dissatisfied" },
  { value: "3", label: "3 — Neutral" },
  { value: "4", label: "4 — Satisfied" },
  { value: "5", label: "5 — Very Satisfied" },
];

/* ── Component ── */

export function PostSubmitSurvey({ county, community }: { county: string; community: string }) {
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState<SurveyData>(INITIAL);
  const [submitting, setSubmit] = useState(false);
  const [done, setDone]         = useState(false);

  const up = (patch: Partial<SurveyData>) => setForm((p) => ({ ...p, ...patch }));

  const canNext = () => {
    if (step === 1) return !!form.roadRating && !!form.safetyRating;
    if (step === 2) {
      if (!form.maintenanceDone || !form.transportCost) return false;
      if (form.maintenanceDone === "yes" && (!form.maintSatisfaction || !form.maintDelivered)) return false;
      return true;
    }
    return !!form.nrfAware;
  };

  const handleSubmit = async () => {
    setSubmit(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county, community,
          roadRating:        Number(form.roadRating),
          safetyRating:      Number(form.safetyRating),
          roadProblems:      form.roadProblems,
          maintenanceDone:   form.maintenanceDone,
          maintSatisfaction: form.maintSatisfaction ? Number(form.maintSatisfaction) : null,
          maintDelivered:    form.maintDelivered || null,
          impactAreas:       form.impactAreas,
          transportCost:     form.transportCost,
          nrfAware:          form.nrfAware,
          nrfSatisfaction:   form.nrfSatisfaction ? Number(form.nrfSatisfaction) : null,
          feedback:          form.feedback,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save survey. Please try again.");
    } finally {
      setSubmit(false);
    }
  };

  /* ── Collapsed prompt ── */
  if (!open) {
    return (
      <div className="mt-4 rounded-lg border border-[var(--nrf-blue)]/20 bg-[var(--nrf-blue)]/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--nrf-blue)]/10">
            <ClipboardList className="size-5 text-[var(--nrf-blue)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Share your broader road experience
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              3 quick questions about road conditions in {community}, {county}. Takes about 2 minutes.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
            Take the survey
          </button>
          <button onClick={() => setDone(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            Skip
          </button>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  if (done) {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-5 text-center">
        <CheckCircle className="mx-auto size-7 text-green-600" />
        <p className="mt-2 text-sm font-semibold text-green-800">Survey complete — thank you!</p>
        <p className="mt-1 text-xs text-green-700">
          Your feedback helps NRF improve roads across Liberia.
        </p>
      </div>
    );
  }

  /* ── Survey steps ── */
  return (
    <div className="mt-4 rounded-lg border border-border bg-white shadow-sm">

      {/* Header + step indicator */}
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Citizen feedback — {community}, {county}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            return (
              <div key={n} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={cn("h-px w-6 shrink-0 bg-border sm:w-10", step > i && "bg-[var(--nrf-blue)]")} />
                )}
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
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
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5 p-4 sm:p-6">

        {/* Step 1: Road condition & safety */}
        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="road-rating">Overall road condition *</Label>
                <select id="road-rating" value={form.roadRating}
                  onChange={(e) => up({ roadRating: e.target.value })} className={SELECT}>
                  <option value="">Select rating…</option>
                  {RATING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="safety-rating">Safety on this road *</Label>
                <select id="safety-rating" value={form.safetyRating}
                  onChange={(e) => up({ safetyRating: e.target.value })} className={SELECT}>
                  <option value="">Select rating…</option>
                  {RATING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Road problems observed <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <CheckList
                values={form.roadProblems}
                onChange={(v) => up({ roadProblems: v })}
                options={["Potholes", "Uneven surface", "Flooding", "No lighting", "Damaged bridges", "Poor drainage", "Road erosion", "Other"]}
              />
            </div>
          </>
        )}

        {/* Step 2: Maintenance & impact */}
        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="maint-done">Road maintenance done in the last 12 months? *</Label>
              <select id="maint-done" value={form.maintenanceDone}
                onChange={(e) => up({ maintenanceDone: e.target.value, maintSatisfaction: "", maintDelivered: "" })}
                className={SELECT}>
                <option value="">Select…</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Not sure</option>
              </select>
            </div>

            {form.maintenanceDone === "yes" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="maint-sat">Maintenance satisfaction *</Label>
                  <select id="maint-sat" value={form.maintSatisfaction}
                    onChange={(e) => up({ maintSatisfaction: e.target.value })} className={SELECT}>
                    <option value="">Select rating…</option>
                    {SATISFACTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maint-delivered">Maintenance matched promises? *</Label>
                  <select id="maint-delivered" value={form.maintDelivered}
                    onChange={(e) => up({ maintDelivered: e.target.value })} className={SELECT}>
                    <option value="">Select…</option>
                    <option value="yes">Yes, fully</option>
                    <option value="partially">Partially</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Road condition affected access to: <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <CheckList
                values={form.impactAreas}
                onChange={(v) => up({ impactAreas: v })}
                options={["Markets", "Health facilities", "Schools", "Workplaces", "No significant impact"]}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transport-cost">Effect on transport costs *</Label>
              <select id="transport-cost" value={form.transportCost}
                onChange={(e) => up({ transportCost: e.target.value })} className={SELECT}>
                <option value="">Select…</option>
                <option value="increased">Increased</option>
                <option value="same">Stayed the same</option>
                <option value="decreased">Decreased</option>
              </select>
            </div>
          </>
        )}

        {/* Step 3: NRF & feedback */}
        {step === 3 && (
          <>
            <div className={cn("grid gap-4", form.nrfAware === "yes" ? "sm:grid-cols-2" : "")}>
              <div className="space-y-1.5">
                <Label htmlFor="nrf-aware">Are you aware of the National Road Fund (NRF)? *</Label>
                <select id="nrf-aware" value={form.nrfAware}
                  onChange={(e) => up({ nrfAware: e.target.value, nrfSatisfaction: "" })} className={SELECT}>
                  <option value="">Select…</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {form.nrfAware === "yes" && (
                <div className="space-y-1.5">
                  <Label htmlFor="nrf-sat">Satisfaction with NRF road interventions</Label>
                  <select id="nrf-sat" value={form.nrfSatisfaction}
                    onChange={(e) => up({ nrfSatisfaction: e.target.value })} className={SELECT}>
                    <option value="">Select rating…</option>
                    {SATISFACTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback">
                Additional comments <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="feedback" rows={4} maxLength={500}
                placeholder="Any other feedback on road conditions, safety, or NRF performance…"
                value={form.feedback} onChange={(e) => up({ feedback: e.target.value })} />
              <p className="text-right text-xs text-muted-foreground">{form.feedback.length}/500</p>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-outline-blue btn-sm">
            <ChevronLeft className="size-3.5" /> Back
          </button>
        ) : (
          <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}

        {step < 3 ? (
          <button type="button" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}
            className="btn btn-secondary btn-sm disabled:opacity-40">
            Continue <ChevronRight className="size-3.5" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting || !canNext()}
            className="btn btn-primary btn-sm disabled:opacity-40">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitting ? "Submitting…" : "Submit Survey"}
          </button>
        )}
      </div>
    </div>
  );
}
