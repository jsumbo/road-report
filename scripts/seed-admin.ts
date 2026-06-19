/**
 * Seed the first admin user.
 * Run with: npx tsx scripts/seed-admin.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@nrf.gov.lr";
const PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "NRF@admin2026";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const { data, error } = await supabase
    .from("road_report_admins")
    .upsert(
      { email: EMAIL, password_hash: hash, name: "NRF Administrator", role: "admin", is_active: true },
      { onConflict: "email" },
    )
    .select("id, email")
    .single();

  if (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
  console.log(`✓ Admin user seeded: ${data.email} (id: ${data.id})`);
  console.log(`  Login with: ${EMAIL} / ${PASSWORD}`);
}

main();
