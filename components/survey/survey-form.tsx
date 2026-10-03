"use client";

import { useState } from "react";
import {
  CheckCircle, ChevronRight, ChevronLeft, Loader2,
  AlertCircle, XCircle, Star, TrendingUp, Minus, TrendingDown, Building2,
  Car, PersonStanding, Bus, Store, Clock, HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LIBERIA_COUNTIES } from "@/lib/counties";
import { SelectField, StepIndicator, type SelectOption } from "@/components/form/fields";

/* ── Option definitions ── */

const ROAD_USER_OPTIONS: SelectOption[] = [
  { value: "driver",           label: "Driver (Motorcyclist / Kehkeh Rider / Cyclist)",        icon: Car },
  { value: "pedestrian",       label: "Pedestrian (children, elderly, vulnerable people)",      icon: PersonStanding },
  { value: "public_transport", label: "Public Transport / Commercial / Heavy Duty Driver",      icon: Bus },
  { value: "trader",           label: "Trader",                                                icon: Store },
];

const HOLDING_UP_OPTIONS: SelectOption[] = [
  { value: "yes",      label: "Yes",      icon: CheckCircle },
  { value: "somewhat", label: "Somewhat", icon: AlertCircle },
  { value: "no",       label: "No",       icon: XCircle },
];

const RESPONSE_TIME_OPTIONS: SelectOption[] = [
  { value: "within_1m",   label: "Within 1 Month",     icon: Clock },
  { value: "within_3m",   label: "Within 3 Months",    icon: Clock },
  { value: "within_6m",   label: "Within 6 Months",    icon: Clock },
  { value: "over_6m",     label: "More than 6 Months", icon: Clock },
  { value: "no_response", label: "No Response",        icon: XCircle },
];

const TRANSPORT_IMPROVEMENT_OPTIONS: SelectOption[] = [
  { value: "significantly", label: "Significantly",     icon: TrendingUp },
  { value: "somewhat",      label: "Somewhat",          icon: TrendingUp },
  { value: "no_change",     label: "No Change",         icon: Minus },
  { value: "worse",         label: "Made Things Worse", icon: TrendingDown },
];

const ACCESS_IMPROVEMENT_OPTIONS: SelectOption[] = [
  { value: "significantly", label: "Significantly", icon: TrendingUp },
  { value: "somewhat",      label: "Somewhat",      icon: TrendingUp },
  { value: "no_change",     label: "No Change",     icon: Minus },
  { value: "not_at_all",    label: "Not at All",    icon: TrendingDown },
];

const AGREEMENT_OPTIONS: SelectOption[] = [
  { value: "5", label: "Strongly Agree",    icon: Star },
  { value: "4", label: "Agree",             icon: Star },
  { value: "3", label: "Neutral",           icon: Star },
  { value: "2", label: "Disagree",          icon: Star },
  { value: "1", label: "Strongly Disagree", icon: Star },
];

const SATISFACTION_OPTIONS: SelectOption[] = [
  { value: "1", label: "1 — Very Dissatisfied", icon: Star },
  { value: "2", label: "2 — Dissatisfied",      icon: Star },
  { value: "3", label: "3 — Neutral",           icon: Star },
  { value: "4", label: "4 — Satisfied",         icon: Star },
  { value: "5", label: "5 — Very Satisfied",    icon: Star },
];

const NRF_AWARE_OPTIONS: SelectOption[] = [
  { value: "yes", label: "Yes", icon: Building2 },
  { value: "no",  label: "No",  icon: HelpCircle },
];

/* ── Types ── */

interface SurveyData {
  county: string;
  community: string;
  roadUserType: string;
  holdingUp: string;
  responseTime: string;
  transportImprovement: string;
  accessImprovement: string;
  nrfAware: string;
  valueForMoney: string;
  nrfSatisfaction: string;
  feedback: string;
}

type Section = "area" | "road" | "impact" | "nrf";

const SECTION_LABELS: Record<Section, string> = {
  area:   "Your Area",
  road:   "Road Use",
  impact: "Response & Impact",
  nrf:    "NRF & Feedback",
};

/** Set when the survey follows a road report — the area is already known. */
export interface SurveyReportContext {
  county: string;
  community: string;
  reportReference: string;
}

/* ── Component ── */

export function SurveyForm({ report, onDone, onSkip }: {
  report?: SurveyReportContext;
  onDone?: () => void;
  onSkip?: () => void;
}) {
  const initial: SurveyData = {
    county: report?.county ?? "", community: report?.community ?? "",
    roadUserType: "", holdingUp: "",
    responseTime: "", transportImprovement: "", accessImprovement: "",
    nrfAware: "", valueForMoney: "", nrfSatisfaction: "", feedback: "",
  };

  const sections: Section[] = report ? ["road", "impact", "nrf"] : ["area", "road", "impact", "nrf"];

  const [step, setStep]         = useState(1);
  const [survey, setSurvey]     = useState<SurveyData>(initial);
  const [submitting, setSubmit] = useState(false);
  const [submitted, setDone]    = useState(false);

  const up = (patch: Partial<SurveyData>) => setSurvey((p) => ({ ...p, ...patch }));
  const section = sections[step - 1];
  const isLast  = step === sections.length;

  /* ── Validation per section ── */
  const canGoNext = (): boolean => {
    switch (section) {
      case "area":   return survey.county !== "" && survey.community.trim() !== "";
      case "road":   return !!survey.roadUserType && !!survey.holdingUp;
      case "impact": return !!survey.responseTime && !!survey.transportImprovement && !!survey.accessImprovement;
      case "nrf":    return !!survey.nrfAware && !!survey.valueForMoney && !!survey.nrfSatisfaction;
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmit(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county:               survey.county,
          community:            survey.community,
          reportReference:      report?.reportReference,
          roadUserType:         survey.roadUserType,
          holdingUp:            survey.holdingUp,
          responseTime:         survey.responseTime,
          transportImprovement: survey.transportImprovement,
          accessImprovement:    survey.accessImprovement,
          nrfAware:             survey.nrfAware,
          valueForMoney:        Number(survey.valueForMoney),
          nrfSatisfaction:      Number(survey.nrfSatisfaction),
          feedback:             survey.feedback,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      if (onDone) onDone();
      else setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save survey. Please try again.");
    } finally {
      setSubmit(false);
    }
  };

  /* ── Reset ── */
  const reset = () => {
    setSurvey(initial);
    setDone(false);
    setStep(1);
  };

  /* ── Success screen (standalone only — embedded callers handle onDone) ── */
  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-14 text-center sm:px-8 sm:py-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <h2 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-semibold">
            Thank you for your feedback!
          </h2>
          <p className="mt-3 mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your answers help the National Road Fund see where road projects are making a difference.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/submit" className="btn btn-secondary">Report a road condition</Link>
            <Link href="/" className="btn btn-outline-blue">Back to home</Link>
          </div>
          <button onClick={reset} className="mt-4 text-xs font-medium text-muted-foreground hover:text-foreground">
            Submit another survey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">

      <StepIndicator labels={sections.map((s) => SECTION_LABELS[s])} step={step} />

      {/* Fields */}
      <div className="p-4 sm:p-6">

        {/* ── Your Area (standalone only) ── */}
        {section === "area" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="survey-county" label="County" value={survey.county} required
              onChange={(v) => up({ county: v })}
              placeholder="Select county…"
              options={LIBERIA_COUNTIES.map((c) => ({ value: c, label: c }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="survey-community">Community / Area *</Label>
              <Input
                id="survey-community"
                placeholder="e.g. Paynesville, Red Light"
                value={survey.community}
                onChange={(e) => up({ community: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
        )}

        {/* ── Road Use ── */}
        {section === "road" && (
          <div className="space-y-5">
            <SelectField
              id="road-user-type" label="What type of road user are you?" value={survey.roadUserType} required
              onChange={(v) => up({ roadUserType: v })}
              placeholder="Select…"
              options={ROAD_USER_OPTIONS}
            />

            <SelectField
              id="holding-up" label="In your opinion, is the road holding up well after completion?" value={survey.holdingUp} required
              onChange={(v) => up({ holdingUp: v })}
              placeholder="Select…"
              options={HOLDING_UP_OPTIONS}
            />
          </div>
        )}

        {/* ── Response & Impact ── */}
        {section === "impact" && (
          <div className="space-y-5">
            <SelectField
              id="response-time" label="When potholes or road damages occur, how quickly do authorities respond?" value={survey.responseTime} required
              onChange={(v) => up({ responseTime: v })}
              placeholder="Select…"
              options={RESPONSE_TIME_OPTIONS}
            />

            <SelectField
              id="transport-improvement" label="Has this road improved transportation and movement in your area?" value={survey.transportImprovement} required
              onChange={(v) => up({ transportImprovement: v })}
              placeholder="Select…"
              options={TRANSPORT_IMPROVEMENT_OPTIONS}
            />

            <SelectField
              id="access-improvement" label="Has the road improved access to markets, schools, hospitals, and businesses?" value={survey.accessImprovement} required
              onChange={(v) => up({ accessImprovement: v })}
              placeholder="Select…"
              options={ACCESS_IMPROVEMENT_OPTIONS}
            />
          </div>
        )}

        {/* ── NRF & Feedback ── */}
        {section === "nrf" && (
          <div className="space-y-5">
            <SelectField
              id="nrf-aware" label="Are you aware that road maintenance is funded through fuel levy collections managed by the National Road Fund?" value={survey.nrfAware} required
              onChange={(v) => up({ nrfAware: v })}
              placeholder="Select…"
              options={NRF_AWARE_OPTIONS}
            />

            <SelectField
              id="value-for-money" label="Do you believe citizens are receiving value for money from road projects funded through the fuel levy?" value={survey.valueForMoney} required
              onChange={(v) => up({ valueForMoney: v })}
              placeholder="Select…"
              options={AGREEMENT_OPTIONS}
            />

            <SelectField
              id="nrf-sat" label="Overall, how satisfied are you with roads funded by the National Road Fund?" value={survey.nrfSatisfaction} required
              onChange={(v) => up({ nrfSatisfaction: v })}
              placeholder="Select rating…"
              options={SATISFACTION_OPTIONS}
            />

            <div className="space-y-1.5">
              <Label htmlFor="feedback">
                Additional comments <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="feedback" rows={4} maxLength={500}
                placeholder="Any other feedback on road conditions, safety, or NRF performance…"
                value={survey.feedback} onChange={(e) => up({ feedback: e.target.value })} />
              <p className="text-right text-xs text-muted-foreground">{survey.feedback.length}/500</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-outline-blue">
            <ChevronLeft className="size-4" /> Back
          </button>
        ) : onSkip ? (
          <button type="button" onClick={onSkip} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Skip survey
          </button>
        ) : (
          <span />
        )}

        {!isLast ? (
          <button type="button" disabled={!canGoNext()} onClick={() => setStep((s) => s + 1)}
            className="btn btn-secondary disabled:opacity-40">
            Continue <ChevronRight className="size-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting || !canGoNext()}
            className="btn btn-primary disabled:opacity-40">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit survey"}
          </button>
        )}
      </div>
    </div>
  );
}
