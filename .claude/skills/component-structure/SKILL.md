---
name: component-structure
description: Enforces React component standards and best practices for this codebase. Use when creating new components, reviewing existing ones, or refactoring. Defines patterns for state management, data fetching, prop handling, and file organization.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write
---

# React Component Standards

Follow these rules when writing or reviewing React components in this project.

## Component File Structure

Every component file follows this order:

```jsx
// 1. Imports (external libraries first, then internal)
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import authStore from "../store/authStore";

// 2. Constants (outside the component)
const API_URL = import.meta.env.VITE_API_URL;

// 3. Helper functions (outside the component, not hooks)
// Only create these if genuinely reused across multiple places.
// Repeating 3-5 lines is fine. Don't abstract prematurely.
function formatDate(dateStr) {
  // Format a date string to Swedish locale
  return new Date(dateStr).toLocaleDateString("sv-SE");
}

// 4. The component
export default function MyComponent() {
  // -- State declarations --
  // -- Derived values --
  // -- Data fetching (useEffect with [] only) --
  // -- Event handlers and action functions --
  // -- Return JSX --
}

// 5. PropTypes (for components that accept props)
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func,
};
```

## Rules

### useEffect: Only for initial data fetching

```jsx
// CORRECT: Fetch data on mount
useEffect(() => {
  async function loadPrograms() {
    const res = await fetch(`${API_URL}/programs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPrograms(data);
    }
  }
  loadPrograms();
}, []);

// WRONG: useEffect for derived state
useEffect(() => {
  setFilteredUsers(users.filter(u => u.role === selectedRole));
}, [users, selectedRole]);

// CORRECT: Derive inline instead
const filteredUsers = selectedRole
  ? users.filter(u => u.role === selectedRole)
  : users;
```

**Never use useEffect for:**
- Transforming data (derive it inline or in a variable)
- Responding to events (use event handlers)
- Syncing state between variables (derive instead)
- Anything with a non-empty dependency array

### Functions: Always outside useEffect

```jsx
// CORRECT: Function defined at component level, called inside useEffect
export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const token = authStore((state) => state.token);

  // Function at component scope
  async function fetchPrograms() {
    const res = await fetch(`${API_URL}/programs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPrograms(await res.json());
    }
  }

  // useEffect only calls it
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Same function reused for refresh button
  return (
    <button onClick={fetchPrograms}>Refresh</button>
  );
}

// WRONG: Function defined inside useEffect
useEffect(() => {
  async function fetchData() { /* ... */ }
  fetchData();
}, []);
```

### No custom hooks

Do not create custom hooks (`useXxx` files). Keep logic directly in the component. If multiple components need the same fetch call, repeat the fetch logic -- it is typically 5-10 lines and the duplication is clearer than an abstraction.

```jsx
// WRONG: Don't create this
function usePrograms() {
  const [programs, setPrograms] = useState([]);
  useEffect(() => { /* fetch */ }, []);
  return programs;
}

// CORRECT: Just put the fetch in the component
export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const token = authStore((state) => state.token);

  async function fetchPrograms() {
    const res = await fetch(`${API_URL}/programs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPrograms(await res.json());
  }

  useEffect(() => { fetchPrograms(); }, []);
  // ...
}
```

### Props and PropTypes

Always validate props using the `prop-types` package:

```jsx
import PropTypes from "prop-types";

function StatusBadge({ status }) {
  // Component logic...
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
```

### State management

- **Auth state**: Use `authStore` (Zustand) -- token, userData, login/logout
- **Page-level state**: Use `useState` -- form data, loading, errors, fetched lists
- **Derived state**: Calculate inline from existing state, never sync with useEffect
- **Shared state across pages**: If needed, add to a Zustand store. But prefer passing via URL params or fetching fresh

### Data fetching pattern

Every page that fetches data follows this pattern:

```jsx
export default function ExamplePage() {
  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = authStore((state) => state.token);

  // Fetch function at component scope
  async function fetchItems() {
    try {
      const res = await fetch(`${API_URL}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load items");
      setItems(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Single useEffect with empty deps
  useEffect(() => {
    fetchItems();
  }, []);

  // Loading state
  if (loading) {
    return <div className="p-6 text-gray-500">Laddar...</div>;
  }

  // Error state
  if (error) {
    return <div className="p-6 text-coral">{error}</div>;
  }

  // Success state
  return (
    <div className="p-6">
      {/* ... */}
    </div>
  );
}
```

### Form submission pattern

```jsx
export default function ExampleForm() {
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = authStore((state) => state.token);
  const navigate = useNavigate();

  // Generic field updater
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // Submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setSuccess("Sparad!");
      navigate("/dashboard/items");
    } else {
      const data = await res.json();
      setError(data.detail || "Nagonting gick fel");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-coral text-sm">{error}</p>}
      {success && <p className="text-success text-sm">{success}</p>}
      {/* Form fields using handleChange */}
    </form>
  );
}
```

### Comments

Add comments liberally. Explain the "why", not just the "what":

```jsx
// Fetch the list of utbildningsledare to populate the leader dropdown.
// We only need users with this specific role, so we pass ?role= filter.
async function fetchLeaders() {
  const res = await fetch(`${API_URL}/general/user?role=utbildningsledare`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) setLeaders(await res.json());
}

// Only admins can see the delete button.
// Utbildningsledare can edit but not delete.
{userData?.role === "admin" && (
  <button onClick={handleDelete} className="text-coral">
    Ta bort
  </button>
)}
```

### Utility functions: Be critical

Only create a utility function in `src/utils.js` if:
1. It is used in **3+ different files** (not 2)
2. It is pure (no side effects, no state)
3. It is more than a trivial one-liner

Examples of good utilities:
- `formatDate(str)` -- used across many pages
- `getApiHeaders(token)` -- reduces boilerplate in every fetch call

Examples of bad utilities (just inline them):
- `capitalize(str)` -- too trivial, just use the code inline
- `isAdmin(user)` -- one-liner, inline as `user.role === "admin"`

### File naming

- Pages: `PascalCase.jsx` in `src/pages/` (e.g., `ProgramsPage.jsx`)
- Components: `PascalCase.jsx` in `src/components/` (e.g., `RoleBadge.jsx`)
- Stores: `camelCase.js` in `src/store/` (e.g., `authStore.js`)
- Utils: `camelCase.js` in `src/` (e.g., `utils.js`)

### Styling

- Tailwind utility classes only -- no CSS modules, no inline styles, no component libraries
- Follow the project palette defined in `index.css` (`primary-600`, `coral`, `success`, `warning`)
- Cards: `bg-white rounded-2xl shadow-sm border border-gray-100`
- Buttons: `bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm shadow-primary-600/25`
- Inputs: `rounded-lg focus:ring-primary-500 focus:border-primary-500`

### What NOT to do

- Do not create HOCs (higher-order components)
- Do not use `forwardRef` unless absolutely required for DOM access
- Do not use `useReducer` -- useState is sufficient for our forms and pages
- Do not create context providers for page-level state (use Zustand if truly global)
- Do not add TypeScript -- this is a plain JSX project
- Do not add testing libraries without asking first
- Do not create index.js barrel files for re-exports
