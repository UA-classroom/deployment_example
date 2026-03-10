import { create } from "zustand";

const loadInitialState = () => {
  const token = localStorage.getItem("token") || null;
  const userData = JSON.parse(localStorage.getItem("userData")) || null;

  return { token, userData};
};

const authStore = create((set, get) => ({
  ...loadInitialState(),

  setToken: (token) => {
    localStorage.setItem("token", token);
    set(() => ({ token }));
  },
  setUserData: (userData) => {
    localStorage.setItem("userData", JSON.stringify(userData));
    set(() => ({ userData }));
  },
  logout: async () => {
    const { token } = get();
    // Tell the backend to delete the token from the database
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    // Clear local state regardless of whether the API call succeeded
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    set(() => ({ token: null, userData: null }));
  },
    fetchUser: async () => {
    const { token, logout, setUserData } = get();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const userData = await response.json();
        setUserData(userData);
      } else if (response.status === 401) {
        // Token expired or invalid - log the user out
        logout();
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("There was an error fetching user data:", error);
    }
  },
}));

export default authStore;
