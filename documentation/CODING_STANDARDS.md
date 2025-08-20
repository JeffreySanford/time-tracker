# Coding standards: Promise → Hot Observable migration

 This document captures the recent requirements, a running tally of Promise/async usage found in the codebase, why we prefer hot RxJS Observables in enterprise code, and practical migration notes / next steps.

## Requirements (from recent work)

- Build a usable reports screen (material table, pagination/filter, billing totals, editable rate).
- Add a quick-edit drawer on task cards that persists edits to the backend.
- Rename status token `paused` → `backlog` across app and seeds.
- Seed the demo planning task as `active` in `apps/time-tracker/src/assets/tasks.json` (no programmatic upsert).
- Add CDK drag-and-drop to the planning kanban and persist moves.
- Add sessionStorage fallback for persistence when backend unavailable.
- Add backend CRUD endpoints for tasks and a dev in-memory Mongo fallback for local dev.
- Audit the repository for all `async`/`await`/`Promise`/`.then()` usage and estimate effort to replace with hot observables.

## Running tally (scoped to `apps/**/*.ts`; current scan)

- `async`: 32 matches
- `await`: 68 matches

## Coding standards — Nx (Angular + NestJS modules), Observable-first

 This document captures the standards for migrating Promise/async code to RxJS Observables in this Nx workspace. It assumes traditional Angular NgModules and NestJS modules (no standalone components/providers).

### High-level rules

- Keep NestJS modules and Angular NgModules (do not convert to standalone patterns for now).
- Services should expose Observables at boundaries. Use cold Observables for single-shot operations and hot Observables (Subjects/BehaviorSubject) for shared state.
- Controllers may return Observables directly — do not mark those controller methods `async` when they return Observables.
- Keep Bootstrap/startup code (e.g., `main.ts`, `forRootAsync`) `async` where it needs to `await` (MongoMemoryServer, NestFactory.create). These are acceptable exceptions.

### Concrete patterns

#### 1) Mongoose → Observable

 ```ts
 // find
 findAll(): Observable<MyDoc[]> {
   return from(this.model.find().lean().exec());
 }

 // create
 create(payload: CreateDto): Observable<MyDoc> {
   return from(new this.model(payload).save());
 }

 // seeding (file)
 seedFromFileIfEmpty(filePath: string): Observable<void> {
   return from(this.model.estimatedDocumentCount()).pipe(
     mergeMap(count => {
       if (count > 0) return of(undefined);
       const docs = JSON.parse(fs.readFileSync(filePath, 'utf8')) as any[];
       return from(this.model.insertMany(docs)).pipe(mapTo(undefined));
     }),
     catchError(() => of(undefined))
   );
 }
 ```

#### 2) Angular fetch → fromFetch

 ```ts
 fromFetch('/api/tasks').pipe(
   switchMap(res => res.ok ? from(res.json()) : throwError(() => new Error('API'))),
   catchError(() => of([]))
 )
 ```

#### 3) Hot vs Cold

- Cold: `from(promise)`, `defer(() => from(...))` — executes on subscribe.
- Hot: `new BehaviorSubject<T>(initial)` for application state; expose as `state$.asObservable()`.
- Cache HTTP calls: `.pipe(shareReplay({ bufferSize: 1, refCount: true }))`

#### 4) Controllers

- Return Observables directly. Avoid `async` on such methods.

### Testing

- Keep tests using `async/await` (Jest/Playwright). For unit tests of Observable services, use `firstValueFrom()` to await the emission in tests.
- Add at least one happy-path test per converted service.

### Migration checklist (repo-wide)

 1. Generate a repo-wide `documentation/async_inventory.csv` listing all occurrences of `async`, `await`, `Promise`, and `.then(` with file path and snippet. (Done — updated file.)
 2. Convert services (5–10 files per batch). Each conversion:
    - Return Observables from services.
    - Update controllers to return Observables (remove `async` if necessary).
    - Run `npx tsc -p apps/api/tsconfig.json` and fix errors.
    - Add a unit test (happy path) for each converted service using `firstValueFrom`.
 3. Convert frontend fetch wrappers to `fromFetch` and adjust consumers to use `async` pipe or subscriptions.
 4. Update CSV and PR description per batch.

### When not to convert

- Do not convert test harness `async`/`await` usage (leave Playwright/Jest tests as-is).
- Do not convert top-level bootstrap code that intentionally uses `await` (e.g., in-memory Mongo creation).

 If you'd like, I will now apply conversions in batches of 5 files using these standards and update `documentation/async_inventory.csv` as I go. Recommend batch size: 5 files/PR.

 ---

 Updated: August 19, 2025

- For error mapping, use `pipe(catchError(err => throwError(() => mapToHttpError(err))))` to map DB errors to Nest-friendly HTTP errors.
