---
paths:
  - "frontend/**/*.jsx"
  - "frontend/**/*.js"
  - "frontend/**/*.css"
---

# Frontend React Rules (never break these)

1. **Only use `useEffect` with an empty dependency array** -- for initial data fetching on mount. Never use `useEffect` with non-empty dependency arrays to react to state changes. If you need derived values, compute them inline or in a plain function.

```jsx
// CORRECT -- empty deps, fetches once on mount
useEffect(() => {
  fetchPrograms();
}, []);

// WRONG -- reacting to state changes via useEffect
useEffect(() => {
  const filtered = items.filter((i) => i.category === selected);
  setFilteredItems(filtered);
}, [selected, items]);

// CORRECT -- compute inline instead
const filteredItems = items.filter((i) => i.category === selected);
```

2. **Define functions outside `useEffect`** -- never define async functions or logic inside the effect callback. Declare them in the component body and call them from the effect.

```jsx
// CORRECT
async function fetchPrograms() {
  setIsLoading(true);
  try {
    const response = await fetch(`${BASE_API_URL}/programs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setPrograms(data);
  } catch (err) {
    setError("Failed to load programs.");
  } finally {
    setIsLoading(false);
  }
}

useEffect(() => {
  fetchPrograms();
}, []);

// WRONG
useEffect(() => {
  async function fetchPrograms() {
    const res = await fetch(...);
    setPrograms(await res.json());
  }
  fetchPrograms();
}, []);
```

3. **No custom hooks** -- do not create `useXyz()` hooks. Keep logic directly in the component or extract to plain functions. This keeps the codebase flat and easy to follow.

```jsx
// WRONG -- custom hook
function usePrograms() {
  const [programs, setPrograms] = useState([]);
  useEffect(() => { ... }, []);
  return programs;
}

// CORRECT -- just use state + fetch in the component directly
export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  async function fetchPrograms() { ... }
  useEffect(() => { fetchPrograms(); }, []);
  ...
}
```

4. **Keep it simple, avoid premature DRY** -- three similar lines of code are better than an abstraction nobody asked for. Only extract shared logic when there are 4+ identical patterns across different files. Inline is fine.

```jsx
// FINE -- a little repetition is readable
<div className="rounded-2xl shadow-sm border border-gray-100 p-5 bg-primary-50">
  <p className="text-sm font-medium text-gray-600 mb-1">Aktiva program</p>
  <p className="text-3xl font-bold text-primary-600">3</p>
</div>
<div className="rounded-2xl shadow-sm border border-gray-100 p-5 bg-green-50">
  <p className="text-sm font-medium text-gray-600 mb-1">Studenter</p>
  <p className="text-3xl font-bold text-success">42</p>
</div>

// ALSO FINE -- data array + map when there are 4+ items
{statCards.map((card) => (
  <div key={card.label} className={`rounded-2xl shadow-sm border border-gray-100 p-5 ${card.bg}`}>
    <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
    <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
  </div>
))}
```

5. **Tailwind utility classes only** -- no CSS modules, no `styled-components`, no component libraries (MUI, Chakra, etc.). All styling uses Tailwind classes from our `@theme` in `index.css`.

6. **Always add PropTypes** -- every component that receives props must declare `PropTypes`. No TypeScript, no `prop-types` shortcuts like `any`.

```jsx
import PropTypes from "prop-types";

function StatusBadge({ status }) {
  return <span className={...}>{status}</span>;
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
```

7. **Use native `fetch()` for API calls** -- no axios, no wrapper libraries. Get the token from the Zustand auth store and pass it as a Bearer header.

```jsx
const BASE_API_URL = import.meta.env.VITE_API_URL;
const token = authStore((state) => state.token);

const response = await fetch(`${BASE_API_URL}/programs`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

8. **Comment liberally** -- add comments explaining sections of JSX, non-obvious logic, and data flow. Use `{/* Section name */}` in JSX to mark regions.

```jsx
return (
  <div>
    {/* Welcome section */}
    <h1>Hej, {firstName}</h1>

    {/* Stat cards */}
    <div className="grid grid-cols-4 gap-4">
      ...
    </div>

    {/* Quick links -- filtered by role */}
    <div>
      ...
    </div>
  </div>
);
```

9. **Static data lives outside the component** -- constants, config arrays, and lookup objects go above the component function so they are not re-created on every render.

```jsx
// CORRECT -- outside component
const quickLinksByRole = {
  admin: [{ label: "Hantera anvandare", to: "/dashboard/users" }],
  student: [{ label: "Mina program", to: "/dashboard/programs" }],
};

export default function DashboardIndexPage() {
  const role = userData?.role || "student";
  const quickLinks = quickLinksByRole[role] || [];
  ...
}
```

10. **Never install frontend dependencies without asking** -- no new npm packages unless explicitly approved by the user.

11. **Use pagination for list pages** -- any page that fetches and displays a list of items (programs, users, courses, cohorts, etc.) must implement pagination. Use query params (`?page=1&per_page=20`) and render prev/next controls.

```jsx
const PER_PAGE = 20;

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchPrograms() {
    setIsLoading(true);
    const response = await fetch(
      `${BASE_API_URL}/programs?page=${page}&per_page=${PER_PAGE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    setPrograms(data.items);
    setTotalPages(Math.ceil(data.total / PER_PAGE));
    setIsLoading(false);
  }

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Re-fetch when page changes
  function handlePageChange(newPage) {
    setPage(newPage);
    // fetchPrograms will be called after state update via a separate mechanism
  }

  return (
    <div>
      {/* ... table/list ... */}

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-6 px-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Foregaende
        </button>
        <span className="text-sm text-gray-600">
          Sida {page} av {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Nasta
        </button>
      </div>
    </div>
  );
}
```

12. **Never use `window.alert()`, `window.confirm()`, or `window.prompt()`** -- always use custom inline alerts, toast notifications, or snackbars styled with Tailwind. Browser dialogs block the thread, look inconsistent, and break the design.

```jsx
// WRONG -- native browser alert
window.alert("Program skapat!");

// WRONG -- native confirm
if (window.confirm("Vill du ta bort?")) { ... }

// CORRECT -- inline alert/banner in JSX
const [alert, setAlert] = useState(null);

function handleDelete() {
  setAlert({ type: "confirm", message: "Vill du ta bort detta program?" });
}

return (
  <div>
    {/* Success alert */}
    {alert?.type === "success" && (
      <div className="mb-4 flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3">
        <p className="text-sm font-medium text-green-800">{alert.message}</p>
        <button
          onClick={() => setAlert(null)}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Stang
        </button>
      </div>
    )}

    {/* Error alert */}
    {alert?.type === "error" && (
      <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3">
        <p className="text-sm font-medium text-red-800">{alert.message}</p>
        <button
          onClick={() => setAlert(null)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Stang
        </button>
      </div>
    )}

    {/* Confirm dialog -- inline, not a browser popup */}
    {alert?.type === "confirm" && (
      <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm font-medium text-amber-800 mb-3">{alert.message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { deleteProgram(); setAlert(null); }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Ta bort
          </button>
          <button
            onClick={() => setAlert(null)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Avbryt
          </button>
        </div>
      </div>
    )}
  </div>
);
```
