# Frontend Guidelines (`apps/urs-web`)

This document defines the default frontend standards for this workspace.  
These rules are mandatory for new frontend work unless a task explicitly requires an exception.

## 1) Required Stack

- Data fetching and server state: `@tanstack/react-query`
- Forms and form state: `@tanstack/react-form`
- UI components: Untitled UI React components (`@untitledui/*` + copied components from CLI)
- Framework: Next.js App Router (existing app: `apps/urs-web`)

## 2) Setup Commands

Install required TanStack packages in the `urs-web` workspace:

```bash
npm install -w @investment/urs-web @tanstack/react-query @tanstack/react-form
```

Optional but recommended for debugging:

```bash
npm install -w @investment/urs-web -D @tanstack/react-query-devtools @tanstack/react-form-devtools
```

Install Untitled UI components through the official CLI:

```bash
npx untitledui@latest add <component-name> --dir apps/urs-web
```

Examples:

```bash
npx untitledui@latest add input button select --dir apps/urs-web
npx untitledui@latest add table --dir apps/urs-web
```

## 3) React Query Rules

- Use React Query for all HTTP/API data fetching in client components.
- Do not call `fetch`/`axios` directly inside page or presentational components.
- Every feature must define query keys in one place (`keys.ts`) to avoid key drift.
- Use `useQuery` for reads and `useMutation` for writes.
- Invalidate related queries after successful mutations.
- Set sane defaults in a single `QueryClient` (retry, staleTime, gcTime).
- Handle loading, empty, and error states explicitly in UI.

### Recommended file structure

```text
src/features/<feature>/
  api/
    keys.ts
    queries.ts
    mutations.ts
    types.ts
  components/
```

### QueryClient provider pattern

```tsx
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Wrap `RootLayout` children with `<Providers />`.

## 4) Untitled UI Component Rules

- Use Untitled UI components first before creating custom base primitives.
- Keep components in existing `src/components/...` paths to match current codebase conventions.
- Prefer composition over forking component internals.
- If customization is needed, customize with props, className, wrappers, or tokens first.
- Only build a custom component when Untitled UI cannot cover the use case.
- Keep accessibility behavior from React Aria components intact.

## 5) TanStack Form Rules

- Use TanStack Form for all non-trivial forms.
- Do not introduce another form-state library.
- Define `defaultValues` explicitly and keep form state local to feature/page.
- Use field-level validation and show errors near each field.
- Use React Query mutations for submit side effects.
- Keep submit button disabled while submitting or when invalid (as needed by UX).

### Example pattern

```tsx
'use client';

import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';

type CreateFundInput = {
  name: string;
};

export function CreateFundForm() {
  const createFund = useMutation({
    mutationFn: async (payload: CreateFundInput) => {
      const res = await fetch('/api/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create fund');
      return res.json();
    },
  });

  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      await createFund.mutateAsync(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => (!value ? 'Fund name is required' : undefined),
        }}
      >
        {(field) => (
          <div className="space-y-1">
            <label htmlFor={field.name}>Fund Name</label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-sm text-error-primary">{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
      </form.Field>

      <button type="submit" disabled={createFund.isPending}>
        {createFund.isPending ? 'Saving...' : 'Create fund'}
      </button>
    </form>
  );
}
```

Note: Replace `<input>` and `<button>` above with Untitled UI components in production code.

## 6) Review Checklist

Before merging frontend PRs:

- Uses React Query for async server data
- Uses TanStack Form for form state
- Uses Untitled UI components (or documents why custom UI is needed)
- Includes loading/error/empty states
- Includes query invalidation after mutations
- Keeps feature code grouped under `src/features/<feature>`
