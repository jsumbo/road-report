import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Users, BarChart3 } from "lucide-react";

export const metadata = { title: "About — CRS Platform" };

const PILLARS = [
  {
    icon: Users,
    title: "Community-driven",
    desc: "Every citizen can report a road hazard in under two minutes — no account, no paperwork, no barriers.",
  },
  {
    icon: ShieldCheck,
    title: "Engineer-reviewed",
    desc: "Every submission is triaged by NRF engineers who assign severity, track progress, and close the loop.",
  },
  {
    icon: MapPin,
    title: "Nationally mapped",
    desc: "Reports are pinned to GPS coordinates and plotted on a live map covering all 15 counties of Liberia.",
  },
  {
    icon: BarChart3,
    title: "Publicly transparent",
    desc: "Anyone can view the full report log and track the status of issues from submission to resolution.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Page hero — pulled up behind the floating navbar */}
      <div className="-mt-20 border-b border-border bg-[var(--nrf-ink)] px-4 pb-20 pt-36 text-white md:px-8 md:pb-28 md:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            National Road Fund of Liberia
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            The CRS Platform
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            The Community Reporting System is Liberia&apos;s first open platform for citizens to
            report road conditions and track how the National Road Fund responds.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="bg-white px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold md:text-3xl">
            Our mission
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Liberia&apos;s road network is the backbone of economic activity and community life across
            all 15 counties. When roads deteriorate — through potholes, flooding, erosion, or
            structural damage — the impact falls hardest on the people who depend on them most.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The CRS Platform was built to close the gap between citizens who see problems and
            engineers who can fix them. By turning every mobile phone into a reporting tool and
            every submission into a trackable work item, we aim to make Liberia&apos;s roads safer,
            faster, and more accountable — one report at a time.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-[var(--nrf-off-white)] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold md:text-3xl">
            How the platform works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border bg-white p-6 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--nrf-blue)]/10">
                  <Icon className="size-5 text-[var(--nrf-blue)]" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About NRF */}
      <section className="bg-white px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold md:text-3xl">
            About the National Road Fund
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The National Road Fund of Liberia (NRF) is a government agency responsible for
            financing, maintaining, and improving Liberia&apos;s road infrastructure. Established
            to ensure sustainable funding for road works, the NRF oversees projects across the
            country in partnership with county administrations and development partners.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The CRS Platform is an NRF initiative to modernise how road condition data is collected
            and acted upon — moving from periodic surveys to real-time, citizen-powered intelligence.
          </p>
          <a
            href="https://nrf.gov.lr"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nrf-blue)] hover:underline"
          >
            Visit nrf.gov.lr ↗
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--nrf-blue)] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold md:text-4xl">
            Ready to make a difference?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/75">
            Submit a road condition report in under two minutes. No account required.
          </p>
          <Link href="/submit" className="btn btn-primary btn-lg mt-8">
            Report a Road Condition
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
