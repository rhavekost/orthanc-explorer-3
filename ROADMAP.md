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

- [ ] **Add `src/shared/api/errors.test.ts` for `src/shared/api/errors.ts` (51 lines, 0% coverage, no test file exists).**
   `ApiError` and its four subclasses (`NetworkError`, `AuthError`, `NotFoundError`, `DicomError`)
   plus the `isApiError` type guard — pure class/constructor logic, no external dependencies.
   Follow the pattern in `src/lib/errors.test.ts`.
  <!-- roadmap-id: 4e9dbbf8 -->

- [ ] **Add `src/store/ui-store.ts` tests (31 lines, 0% coverage, no test file exists).**
   Zustand store with `theme`/`sidebarCollapsed` state and two actions. Follow
   `src/store/sessionStore.test.ts`'s pattern exactly (`beforeEach` resets state via `setState`,
   assertions read back via `getState()`).
  <!-- roadmap-id: 6695806f -->

- [ ] **Add `src/features/activity/store/activity-ui-store.ts` tests (12 lines, 0% coverage, no test file exists).**
   Smallest untested store in the repo — a single `pendingSelectId` field and setter. Same
   `sessionStore.test.ts` pattern; a 2-3 test file is sufficient.
  <!-- roadmap-id: 60b100dc -->

## Next

- [ ] **Add `src/features/audit/store/audit-store.ts` tests (26 lines, 0% coverage, no test file exists).**
   `log()` (prepends an event with a generated id/timestamp) and `clear()`. Same zustand-store
   test pattern as items 4-5; only wrinkle is asserting the generated `id` has the
   `audit-live-<n>` shape rather than a literal value.
  <!-- roadmap-id: 2aa24b83 -->

- [ ] **Add `src/store/tab-store.ts` tests (128 lines, 0% coverage, no test file exists).**
   Largest untested store in the repo. Follow `src/store/upload-store.test.ts`'s pattern (already
   at 86.36% — the closest existing precedent for a multi-action store test file in this repo).
  <!-- roadmap-id: f0046c66 -->

- [ ] **Extend `src/api/studies.test.ts` (currently 79 lines) to cover the untested branches in `src/api/studies.ts`.**
   Coverage report shows 73.91% statements / 66.66% functions, with lines 97-99 and 102-104
   uncovered — the `addLabel`/`removeLabel` methods have no test coverage at all. Add cases
   following the existing file's request-mocking pattern for the two missing methods.
  <!-- roadmap-id: 4123a53d -->

- [ ] **Extend `src/features/settings/components/ModalitiesTab.test.tsx` (currently 55 lines) to raise coverage of the already-tested component.**
   Currently 79.74% statements / 33.33% functions, with lines 139-247 and 318-319 uncovered.
   Add test cases for the currently-unexercised interaction paths in the existing test file,
   following its existing `@testing-library/react` render + `userEvent` pattern.
  <!-- roadmap-id: 3533c28e -->

- [ ] **Add `src/features/settings/hooks/use-echo-modality.test.ts` for `src/features/settings/hooks/use-echo-modality.ts` (8 lines, 0% coverage, no test file exists).**
   Smallest untested hook in the repo — a bare `useMutation` wrapper around `echoModalityAction` with no
   `onSuccess`/cache-invalidation logic. Follow `src/features/settings/hooks/use-modalities.test.tsx`'s
   `renderHook` + `QueryClientProvider` wrapper pattern, mocking `echoModalityAction` (already covered at
   the action layer by `src/actions/echoModality.test.ts`) rather than the underlying API.

- [ ] **Add `src/features/settings/hooks/use-modality-config.test.ts` for `src/features/settings/hooks/use-modality-config.ts` (10 lines, 0% coverage, no test file exists).**
   A `useQuery` wrapper around `modalitiesApi.get`, gated by the `enabled: !!name` guard. Follow
   `src/features/settings/hooks/use-modalities.test.tsx`'s pattern exactly — same `renderHook` +
   `QueryClientProvider` wrapper, mock `modalitiesApi.get` via `vi.spyOn`.

- [ ] **Add `src/features/settings/hooks/use-delete-modality.test.ts` for `src/features/settings/hooks/use-delete-modality.ts` (13 lines, 0% coverage, no test file exists).**
   A `useMutation` wrapper around `deleteModalityAction` (already tested at the action layer by
   `src/actions/deleteModality.test.ts`) whose own untested logic is the `onSuccess` cache-invalidation —
   it calls `queryClient.invalidateQueries(["modalities"])` and `removeQueries(["modality", name])`. Mock
   the action, assert on a shared `QueryClient` instance's cache methods.

- [ ] **Add `src/features/settings/hooks/use-save-modality.test.ts` for `src/features/settings/hooks/use-save-modality.ts` (20 lines, 0% coverage, no test file exists).**
   A `useMutation` wrapper around `saveModalityAction` (already tested at the action layer by
   `src/actions/saveModality.test.ts`) with two `invalidateQueries` calls in `onSuccess`. Same pattern as
   `use-delete-modality.test.ts` above — mock the action, spy on the `QueryClient` instance.

- [ ] **Add `src/shared/utils/format.test.ts` for `src/shared/utils/format.ts` (31 lines, 0% coverage, no test file exists).**
   Four pure formatting functions (`formatPatientName`, `formatDiskSize`, `formatDuration`,
   `formatRelativeTime`) with several unexercised size/duration thresholds each. No React/DOM
   dependencies. Follow the pattern in `src/lib/dicom-tag-utils.test.ts` (colocated, no mocks needed).

- [ ] **Add `src/shared/api/repository-factory.test.ts` for `src/shared/api/repository-factory.ts` (26 lines, 0% coverage, no test file exists).**
   `RepositoryFactory.createStudyRepository()` (memoizes a singleton) and `setUseDemoData()` (resets the
   singleton so the next call re-creates it). Mock `OrthancStudyRepository` and `DemoStudyRepository`
   constructors via `vi.mock` so the test exercises only the factory's own branching, not the repositories'
   internals. Follow `src/lib/errors.test.ts`'s pure-class-logic pattern.

- [ ] **Add `src/shared/hooks/use-tab-label.test.tsx` for `src/shared/hooks/use-tab-label.ts` (20 lines, 0% coverage, no test file exists).**
   Updates a tab's label in `src/store/tab-store.ts` when the current route matches an open tab.
   `renderHook` with a `MemoryRouter` wrapper (needed for `useLocation`), seed `useTabStore`'s state
   directly via `setState` (same store-seeding approach as `src/store/sessionStore.test.ts`), and assert
   `updateTabLabel` is called only when the label actually changes.

- [ ] **Add `src/hooks/use-mobile.test.tsx` for `src/hooks/use-mobile.tsx` (19 lines, 0% coverage, no test file exists).**
   Reads `window.matchMedia` and listens for viewport-width changes. `renderHook`, stub
   `window.matchMedia` (jsdom does not implement it) with a minimal mock exposing `addEventListener`/
   `removeEventListener`, and assert the boolean flips at the 768px breakpoint.

## Later

- [ ] **Add tests for the two uncovered branches in `src/lib/client.ts` (currently 88.13% statements / 77.27% branches).**
    Lines 28-31 and 34-36 are uncovered — both are error-handling branches in the central HTTP
    client already exercised at a high level by `src/lib/client.test.ts`. Extend that file rather
    than creating a new one.
  <!-- roadmap-id: 907ebbe1 -->

- [ ] **Add a branch-coverage test to `src/shared/components/ModalityBadge.tsx`'s existing coverage (currently 91.3% statements / 37.5% branches).**
    Lines 25-26 uncovered — a small presentational component with only one untested conditional
    path. Low effort, follows any existing component-test pattern in `src/shared/components/`
    (e.g. `HealthBanner.test.tsx`'s render-and-assert style).
  <!-- roadmap-id: 4c4d5a88 -->

- [ ] **Add `src/features/tasks/store/job-store.ts` a direct unit test file (currently 65.95% statements / 44.44% functions, only indirectly exercised via `useJobs.test.tsx`/`use-anonymize-job.test.ts`).**
    Lines 47-60 and 71-73 are uncovered. A direct store test (same pattern as items 4-7) would
    cover the store's own action logic independent of the hooks that currently provide its only
    indirect coverage.
  <!-- roadmap-id: 861e75d5 -->

- [ ] **Add `src/pages/NotFound.test.tsx` for `src/pages/NotFound.tsx` (24 lines, 0% coverage, no test file exists).**
   The live 404 page (wired up in `src/App.tsx`'s catch-all route) — render-and-assert on the heading
   text and the "Return to Home" link. Note: `src/app/router/NotFound.tsx` is a byte-for-byte duplicate
   that is never imported anywhere; this item targets only the file actually reachable from the app.

- [ ] **Add `src/features/audit/hooks/use-audit-log.test.ts` for `src/features/audit/hooks/use-audit-log.ts` (38 lines, 0% coverage, no test file exists).**
   Wraps `useAuditStore`'s `log` action with fixed metadata (actor, IP, truncated user agent).
   `renderHook` and mock/spy on `useAuditStore` (same store-mocking approach as
   `src/features/tasks/hooks/use-anonymize-job.test.ts` uses for `useJobStore`), asserting the shape
   passed to `log()` including the default `severity: 'info'`.

- [ ] **Add `src/app/providers/error-boundary.test.tsx` for `src/app/providers/error-boundary.tsx` (73 lines, 0% coverage, no test file exists).**
   The app's top-level error boundary — `getDerivedStateFromError` sets error state, `render()` shows
   a fallback UI (or a custom `fallback` prop) with a "Try Again" reset button. Render a component that
   throws, assert the fallback UI appears, then click "Try Again" and assert the boundary recovers when
   a non-throwing child is rendered next. `@testing-library/react` render + `userEvent`, standard React
   error-boundary test pattern (a `console.error` spy will be needed to silence React's expected
   boundary logging).

- [ ] **Add `src/components/ErrorBoundary.test.tsx` for `src/components/ErrorBoundary.tsx` (55 lines, 0% coverage, no test file exists).**
   A second, distinct error boundary used elsewhere in the tree — branches on whether the caught error
   is an `OrthancError` (shows its `correlationId`) or a generic error (fixed message), and logs via
   `src/lib/logger.ts`. Same throwing-child + fallback-assertion pattern as the `error-boundary.tsx`
   item above; this file's own branch (the `instanceof OrthancError` check) is the file-specific case
   to cover.

## Completed

<!-- completed: 2026-07-19 -->
- [x] **Remove the stale `eslint-disable` comment in `src/features/viewer/components/CornerstoneViewport.tsx:128`.**
   `npm run lint` reports it explicitly: `Unused eslint-disable directive (no problems were
   reported from 'react-hooks/exhaustive-deps')`. Deleting the one comment line is a pure lint
   fix with zero behavior change — the directive was already inert.
  <!-- roadmap-id: 30f237fb -->


<!-- completed: 2026-07-19 -->
- [x] **Add `src/lib/dicom-validation.test.ts` for `src/lib/dicom-validation.ts` (58 lines, 0% coverage, no test file exists).**
   Pure functions, no React/DOM mocking beyond a `File` object: `hasDicomMagicBytes` (checks the
   128-byte DICOM preamble + `DICM` magic bytes) and `isKnownNonDicom` (filename-based pre-filter
   for OS metadata files, `thumbs.db`, and a fixed set of known non-DICOM extensions). Follow the
   pattern in `src/lib/dicom-tag-utils.test.ts` (colocated, no mocks needed).
  <!-- roadmap-id: e447466c -->

