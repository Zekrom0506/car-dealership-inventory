/** Values the admin seed reads (passed in explicitly so tests don't touch process.env). */
export interface AdminSeedEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

// STUB (RED step): real logic comes in GREEN.
export async function seedAdmin(_env: AdminSeedEnv): Promise<void> {}

// STUB (RED step): real logic comes in GREEN. Returns how many vehicles were added.
export async function seedSampleVehicles(): Promise<number> {
  return 0;
}
