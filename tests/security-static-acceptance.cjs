const fs = require("fs");

function read(path) { return fs.readFileSync(path, "utf8"); }
function must(condition, message) { if (!condition) throw new Error(message); }

const edge = read("supabase/functions/invite-platform-user/index.ts");
const migration = read("supabase/migrations/20260918_platform_admin_workshop_builder.sql");
const health = read("app/api/health/route.ts");

must(edge.includes('if (callerError || !caller)'), "Edge function must reject unauthenticated callers");
must(edge.includes('status: 401'), "Unauthenticated callers must receive 401");
must(edge.includes('account_status !== "active"'), "Suspended accounts must be rejected");
must(edge.includes('status: 403'), "Forbidden callers must receive 403");
must(edge.includes('["suspend","activate","delete"].includes(action)'), "Lifecycle actions must be explicitly handled");
must(edge.includes('if (!isPlatformAdmin)'), "Sensitive lifecycle actions must require platform admin");
must(edge.includes('targetUserId === caller.id'), "Current admin must not suspend/delete itself");
must(edge.includes('password.length < 8'), "Account creation must enforce minimum password length");
must(edge.includes('SUPABASE_SERVICE_ROLE_KEY'), "Privileged operations must stay in server-side edge function");

must(migration.includes("enable row level security"), "Training tables must enable RLS");
must(migration.includes("revoke all on function private.is_platform_admin() from public, anon"), "Admin helper must not be executable by anon/public");
must(migration.includes('grant execute on function private.is_platform_admin() to authenticated'), "Admin helper must be limited to authenticated users");
must(migration.includes('create policy "platform admin manages organizations"'), "Organization admin RLS policy missing");
must(migration.includes('create policy "users manage own training progress"'), "Own-progress RLS policy missing");

must(health.includes('"Cache-Control": "no-store"'), "Health endpoint must not be cached");
must(health.includes('status: 200'), "Health endpoint must explicitly return 200");

console.log("Security static acceptance: PASS");
