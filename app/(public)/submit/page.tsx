import { ReportForm } from "@/components/submit/report-form";

export const metadata = { title: "Report a Road Condition" };

export default function SubmitPage() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl">
            Report a Road Condition
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Takes less than 2 minutes. No account required.
          </p>
        </div>
        <ReportForm />
      </div>
    </div>
  );
}
