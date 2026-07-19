# Roadmap

First hardening pass after onboarding to the Hermes kanban-gate pipeline. Grounded in a live run of
the full verification chain against `dev` (`f81c8e0`) on 2026-07-18: `npm install`, `npm run lint`
(0 errors, 12 warnings), `npx tsc --noEmit` (clean), `npm run test` (51 test files, 190 tests, all
passing), `npm run build` (clean, `dist/` produced), plus a one-off `npx vitest run --coverage`
(`@vitest/coverage-v8`, not a committed dependency, installed with `--no-save` purely to measure
this snapshot) — overall **21.18% statements / 60.12% branches / 49.51% functions / 21.18% lines**.
The low overall number is mostly large, entirely untested page/dialog components (several
300-600 line files at 0%); this roadmap targets the small, isolated, high-value gaps instead of
that larger surface.

## Constraints

- Hardening and coverage only. No new features, routes, or behavior changes.
- No changes to authentication (`src/app/providers/auth-context.tsx`), DICOM data
  parsing/handling correctness, or anything that could affect clinical data integrity — this is a
  DICOM/healthcare-adjacent admin UI; those areas are explicitly out of scope for this pass.
- Follow existing test patterns exactly: colocated `foo.ts` → `foo.test.ts`, Vitest +
  `@testing-library/react` + jsdom, `describe`/`it`/`expect` style already used throughout `src/`.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` must stay green after every change.
- One minimal, single-purpose task per item — do not bundle multiple files into one change.
- Do not touch `useEffect` dependency arrays to silence `react-hooks/exhaustive-deps` warnings —
  changing a dependency array changes render/re-fetch behavior, which is out of scope here even
  though `npm run lint` reports 8 such warnings today.

## Now

- [ ] **Remove the stale `eslint-disable` comment in `src/features/viewer/components/CornerstoneViewport.tsx:128`.**
   `npm run lint` reports it explicitly: `Unused eslint-disable directive (no problems were
   reported from 'react-hooks/exhaustive-deps')`. Deleting the one comment line is a pure lint
   fix with zero behavior change — the directive was already inert.

- [ ] **Add `src/lib/dicom-validation.test.ts` for `src/lib/dicom-validation.ts` (58 lines, 0% coverage, no test file exists).**
   Pure functions, no React/DOM mocking beyond a `File` object: `hasDicomMagicBytes` (checks the
   128-byte DICOM preamble + `DICM` magic bytes) and `isKnownNonDicom` (filename-based pre-filter
   for OS metadata files, `thumbs.db`, and a fixed set of known non-DICOM extensions). Follow the
   pattern in `src/lib/dicom-tag-utils.test.ts` (colocated, no mocks needed).

- [ ] **Add `src/shared/api/errors.test.ts` for `src/shared/api/errors.ts` (51 lines, 0% coverage, no test file exists).**
   `ApiError` and its four subclasses (`NetworkError`, `AuthError`, `NotFoundError`, `DicomError`)
   plus the `isApiError` type guard — pure class/constructor logic, no external dependencies.
   Follow the pattern in `src/lib/errors.test.ts`.

- [ ] **Add `src/store/ui-store.ts` tests (31 lines, 0% coverage, no test file exists).**
   Zustand store with `theme`/`sidebarCollapsed` state and two actions. Follow
   `src/store/sessionStore.test.ts`'s pattern exactly (`beforeEach` resets state via `setState`,
   assertions read back via `getState()`).

- [ ] **Add `src/features/activity/store/activity-ui-store.ts` tests (12 lines, 0% coverage, no test file exists).**
   Smallest untested store in the repo — a single `pendingSelectId` field and setter. Same
   `sessionStore.test.ts` pattern; a 2-3 test file is sufficient.

## Next

- [ ] **Add `src/features/audit/store/audit-store.ts` tests (26 lines, 0% coverage, no test file exists).**
   `log()` (prepends an event with a generated id/timestamp) and `clear()`. Same zustand-store
   test pattern as items 4-5; only wrinkle is asserting the generated `id` has the
   `audit-live-<n>` shape rather than a literal value.

- [ ] **Add `src/store/tab-store.ts` tests (128 lines, 0% coverage, no test file exists).**
   Largest untested store in the repo. Follow `src/store/upload-store.test.ts`'s pattern (already
   at 86.36% — the closest existing precedent for a multi-action store test file in this repo).

- [ ] **Extend `src/api/studies.test.ts` (currently 79 lines) to cover the untested branches in `src/api/studies.ts`.**
   Coverage report shows 73.91% statements / 66.66% functions, with lines 97-99 and 102-104
   uncovered — the `addLabel`/`removeLabel` methods have no test coverage at all. Add cases
   following the existing file's request-mocking pattern for the two missing methods.

- [ ] **Extend `src/features/settings/components/ModalitiesTab.test.tsx` (currently 55 lines) to raise coverage of the already-tested component.**
   Currently 79.74% statements / 33.33% functions, with lines 139-247 and 318-319 uncovered.
   Add test cases for the currently-unexercised interaction paths in the existing test file,
   following its existing `@testing-library/react` render + `userEvent` pattern.

## Later

- [ ] **Add tests for the two uncovered branches in `src/lib/client.ts` (currently 88.13% statements / 77.27% branches).**
    Lines 28-31 and 34-36 are uncovered — both are error-handling branches in the central HTTP
    client already exercised at a high level by `src/lib/client.test.ts`. Extend that file rather
    than creating a new one.

- [ ] **Add a branch-coverage test to `src/shared/components/ModalityBadge.tsx`'s existing coverage (currently 91.3% statements / 37.5% branches).**
    Lines 25-26 uncovered — a small presentational component with only one untested conditional
    path. Low effort, follows any existing component-test pattern in `src/shared/components/`
    (e.g. `HealthBanner.test.tsx`'s render-and-assert style).

- [ ] **Add `src/features/tasks/store/job-store.ts` a direct unit test file (currently 65.95% statements / 44.44% functions, only indirectly exercised via `useJobs.test.tsx`/`use-anonymize-job.test.ts`).**
    Lines 47-60 and 71-73 are uncovered. A direct store test (same pattern as items 4-7) would
    cover the store's own action logic independent of the hooks that currently provide its only
    indirect coverage.
