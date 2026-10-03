import { SurveyForm } from "@/components/survey/survey-form";

export const metadata = { title: "Citizen Survey" };

export default function SurveyPage() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl">
            Citizen Survey
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            How have roads changed life in your community? Your answers show the National Road Fund where projects are making a difference.
          </p>
        </div>
        <SurveyForm />
      </div>
    </div>
  );
}
