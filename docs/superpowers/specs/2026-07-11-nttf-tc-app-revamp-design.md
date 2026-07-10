# NTTF TC Generator — Design Spec

## 1. Theme & Colors

- **Primary**: `#f5821f` (NTTF orange) — buttons, active states, highlights
- **Secondary**: `#1d8bcb` (NTTF blue) — links, secondary buttons, badges, accents
- **Background**: Gradient mesh blending warm orange/blue tones
- **Dark mode**: Full dark theme toggle (moon/sun icon in header), persisted to `localStorage('darkMode')`

## 2. Auth / Login

- **Login page** at `/login` with email + password fields
- Credentials stored in `.env` as `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`
- Auth state stored in localStorage to persist across refreshes
- Unauthenticated users are redirected to `/login`
- After successful login → redirect to `/`

## 3. Layout

- **Sidebar**: Collapsible — `w-16` collapsed (icons only), `w-64` expanded on hover. NTTF logo in sidebar header. Footer: "Made by Vivek Kumar" with GitHub link.
- **Header**: Gradient bar with page title + dark mode toggle.
- **Settings page**: Password-gated with `vivek123`. Prompt on first access.

## 4. TC Preview Modal

- Preview button opens full-screen modal
- Background renders `letterheadNttf.jpeg`
- TC content overlaid on letterhead with proper spacing + NTTF logo
- A4 aspect ratio container

## 5. School Info Removal

- Remove `DEFAULT_SCHOOL_INFO` from TCPreview — letterhead already has it.

## 6. PDF → Auto-Save to Sheets

- Generating PDF auto-saves to Google Sheets first
- Check TC number uniqueness before saving
- Duplicate TC numbers get a -2, -3 suffix appended

## 7. Line Spacing

- Increased spacing between TC fields (py-3.5, gap-1)
- Fixed overlapping text issues

## 8. Files Changed

- `src/index.css` — new theme variables, dark mode, gradients
- `src/App.tsx` — sidebar, header, auth context
- `src/components/TCPreview.tsx` — letterhead modal, no school info
- `src/components/TCForm.tsx` — auto-save to sheets
- `src/components/GoogleAuth.tsx` — password lock
- `src/` new files: `AuthContext.tsx`, `LoginPage.tsx`, `AuthGuard.tsx`
- `.env` — admin credentials
- `src/components/ui/` — existing ShadCN components stay
