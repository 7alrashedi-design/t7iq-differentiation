# V1.0 Release Readiness

## Product flows
- Teacher: lesson → tools → integrated plan → structured evidence → reflection → improved version → impact reading → coaching → review → portfolio.
- Participant: join → 50-item fingerprint → free product choice → L1/L2/L3 rubric → journey → final report → print/PDF/share.
- Trainer: live test-mode dashboard using latest attempt per participant/product/level.

## Evidence model
Supported evidence types: exit ticket, short quiz, observation, student product, rubric, performance data, other. Optional quantitative numerator/denominator and evidence URL are stored with the project version.

## Guardrails
Impact screens describe temporal evidence and design changes. They do not claim causality automatically and do not score teacher quality.

## Security
Teacher projects, reflections, coaching cycles and coaching reviews use owner-scoped RLS. Child inserts/updates validate ownership of their parent record. Tool saves use an authenticated atomic RPC to avoid JSON overwrite races. Public trainer summary is limited to sessions explicitly marked test_mode=true.

## Quality gate
GitHub Actions runs npm ci and npm run build on pushes and pull requests to main.

## Production checklist
1. Supabase environment variables configured.
2. Workshop production session created with test_mode=false.
3. Trainer production access must use authenticated teacher/trainer UI; demo_summary intentionally rejects non-test sessions.
4. Test mobile share and browser Save as PDF on target devices.
5. Verify one end-to-end teacher account and one participant session before public launch.
